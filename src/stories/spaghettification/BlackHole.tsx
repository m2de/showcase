import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// A ray-traced Schwarzschild black hole with a thin accretion disk, drawn with WebGL.
// Rays are bent with the usual photon-orbit trick (a = -1.5 h² r / |r|⁵), so the far side of the
// disk lenses up over the top of the shadow the way it does in the real thing.

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 res;
uniform float time;
uniform float dist;     // camera distance, in Schwarzschild radii
uniform float tilt;     // camera elevation above the disk, radians
uniform float roll;
uniform vec2 centre;    // where the hole sits on screen, in uv units
uniform float fov;
uniform float heat;     // 0..1 how hot / bright the disk runs
uniform float hueShift; // 0 ember, 1 violet
uniform float clear;    // 1 = no stars, transparent around the hole so it can sit over a scene

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

vec3 stars(vec3 d) {
  // Hash a 3D grid of directions; one star per lucky cell, so nothing smears at the poles.
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float s = layer == 0 ? 60.0 : 140.0;
    vec3 g = d * s;
    vec3 cell = floor(g);
    float h = hash(cell.xy + cell.z * 13.7 + float(layer) * 17.0);
    if (h > 0.93) {
      vec3 c = normalize(cell + 0.5) * s;
      float r = length(g - c);
      float b = smoothstep(0.3, 0.0, r) * (h - 0.93) / 0.07;
      vec3 tint = mix(vec3(0.8, 0.75, 1.0), vec3(1.0, 0.86, 0.72), hash(cell.yz + 1.3));
      col += tint * b * (layer == 0 ? 1.6 : 0.8);
    }
  }
  float neb = fbm(vec2(atan(d.z, d.x) * 2.0, d.y * 3.0) + 4.0);
  col += vec3(0.16, 0.07, 0.32) * pow(neb, 3.0) * 0.9;
  return col;
}

vec3 diskColour(float r, float t) {
  // Hot near the inner edge, cooling outward.
  vec3 ember = vec3(1.0, 0.42, 0.10);
  vec3 gold = vec3(1.0, 0.76, 0.37);
  vec3 white = vec3(1.0, 0.95, 0.88);
  vec3 violet = vec3(0.66, 0.42, 1.0);
  vec3 c = mix(white, gold, smoothstep(2.6, 4.5, r));
  c = mix(c, ember, smoothstep(4.0, 8.0, r));
  c = mix(c, violet * 0.8, smoothstep(8.0, 13.0, r) * 0.7);
  return mix(c, mix(c, violet, 0.85), hueShift);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) - centre;
  float cr = cos(roll), sr = sin(roll);
  uv = mat2(cr, -sr, sr, cr) * uv;

  vec3 cam = vec3(0.0, sin(tilt), -cos(tilt)) * dist;
  vec3 fwd = normalize(-cam);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 dir = normalize(fwd + (uv.x * right + uv.y * up) * fov);

  vec3 pos = cam;
  vec3 vel = dir;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float closest = 100.0;
  bool absorbed = false;

  for (int i = 0; i < 220; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    closest = min(closest, r);
    if (r < 1.0) { absorbed = true; break; }
    if (r > dist * 1.6 && dot(pos, vel) > 0.0) break;
    float dt = clamp(0.045 * r * r / (r + 2.0), 0.02, 1.2);
    vec3 acc = -1.5 * h2 * pos / pow(r2, 2.5);
    vec3 np = pos + vel * dt;
    vel += acc * dt;
    if (pos.y * np.y < 0.0) {
      float k = pos.y / (pos.y - np.y);
      vec3 hit = mix(pos, np, k);
      float hr = length(hit.xz);
      if (hr > 2.6 && hr < 14.0) {
        float ang = atan(hit.z, hit.x);
        float omega = 2.2 / pow(hr, 1.5);
        float swirl = ang + omega * time * 6.0;
        vec2 q = vec2(hr * 1.6, swirl * 3.0 + hr * 0.6);
        float dens = fbm(q) * 0.75 + 0.35 * fbm(q * 3.1 + 2.0);
        dens *= smoothstep(2.6, 3.2, hr) * smoothstep(14.0, 8.5, hr);
        // Doppler beaming: the side spinning toward us runs brighter.
        vec3 v = normalize(vec3(-hit.z, 0.0, hit.x));
        float dop = 1.0 + 0.75 * dot(v, -normalize(vel)) / sqrt(hr * 0.5);
        float bright = (0.4 + 1.6 * heat) * pow(3.0 / hr, 1.2) * dop * dop;
        vec3 c = diskColour(hr, time) * bright * dens * 2.2;
        float a = clamp(dens * 1.4, 0.0, 1.0) * (1.0 - alpha);
        col += c * a;
        alpha += a;
        if (alpha > 0.97) break;
      }
    }
    pos = np;
  }

  if (!absorbed && alpha < 0.97 && clear < 0.5) {
    col += stars(normalize(vel)) * (1.0 - alpha);
  }
  // Photon ring: a thin bright rim where rays skim r ≈ 1.5.
  float ring = exp(-pow((closest - 1.55) * 14.0, 2.0)) * (absorbed ? 0.0 : 1.0) * 0.5;
  col += mix(vec3(1.0, 0.7, 0.4), vec3(0.75, 0.55, 1.0), hueShift) * ring * (0.4 + heat) * (1.0 - alpha);

  // Filmic-ish tone map and a touch of grain.
  col = 1.0 - exp(-col * 1.3);
  col = pow(col, vec3(0.92));
  if (clear > 0.5) {
    float a = absorbed ? 1.0 : clamp(max(col.r, max(col.g, col.b)) * 1.2, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
    return;
  }
  col += (hash(gl_FragCoord.xy + time) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type HoleView = {
  dist: number;
  tilt: number;
  roll?: number;
  centre?: [number, number];
  fov?: number;
  heat?: number;
  hueShift?: number;
  clear?: boolean;
};

// Drawn at a fraction of the output size and scaled up: the disk is all glow, so nobody can tell,
// and software WebGL in a headless render is the slow part of every frame.
const SCALE = 0.5;

export const BlackHole: React.FC<{ view: HoleView; t?: number; size?: { w: number; h: number }; scale?: number }> = ({ view, t, size, scale = SCALE }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const glRef = useRef<{ gl: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  const w = Math.round((size?.w ?? width) * scale);
  const h = Math.round((size?.h ?? height) * scale);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!glRef.current) {
      const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw new Error("WebGL unavailable");
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      glRef.current = { gl, prog };
    }
    const { gl, prog } = glRef.current;
    const u = (n: string) => gl.getUniformLocation(prog, n);
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u("res"), w, h);
    gl.uniform1f(u("time"), t ?? frame / fps);
    gl.uniform1f(u("dist"), view.dist);
    gl.uniform1f(u("tilt"), view.tilt);
    gl.uniform1f(u("roll"), view.roll ?? 0);
    gl.uniform2f(u("centre"), ...(view.centre ?? [0, 0]));
    gl.uniform1f(u("fov"), view.fov ?? 1);
    gl.uniform1f(u("heat"), view.heat ?? 0.6);
    gl.uniform1f(u("hueShift"), view.hueShift ?? 0);
    gl.uniform1f(u("clear"), view.clear ? 1 : 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  });

  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};
