"""Synthesises the Spaghettification sounds in public/sfx/space/. No samples, nothing to license.

Run with: python3 scripts/make-space-sfx.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx" / "space"
rng = np.random.default_rng(18)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def band(x, lo, hi):
    # Brick-wall band pass in the frequency domain. Fine for noise beds.
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = np.fft.rfft(x)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def norm(x, peak=0.9):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def save(name, left, right=None):
    right = left if right is None else right
    data = np.stack([left, right], axis=1)
    data = np.clip(data, -1, 1)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((data * 32767).astype(np.int16).tobytes())


# A low, slowly breathing drone to sit under a whole clip. Loops cleanly at 24 s.
def drone():
    x = t(24)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * x / 12)
    tones = sum(a * np.sin(2 * np.pi * f * x + p) for f, a, p in [(41.2, 1, 0), (61.7, 0.5, 1), (82.4, 0.35, 2), (123.5, 0.12, 3)])
    beat = np.sin(2 * np.pi * 41.7 * x) * 0.6
    rumble = band(rng.standard_normal(len(x)), 20, 180) * 6
    air_l = band(rng.standard_normal(len(x)), 2000, 6000) * 0.25
    air_r = band(rng.standard_normal(len(x)), 2000, 6000) * 0.25
    core = (tones + beat) * (0.6 + 0.4 * lfo) + rumble
    fade = np.minimum(1, np.minimum(x / 0.5, (24 - x) / 0.5))
    save("drone", norm(core + air_l, 0.5) * fade, norm(core + air_r, 0.5) * fade)


# The hook hit: a sub drop with a crack of noise on top.
def boom():
    x = t(3)
    f = 90 * np.exp(-x * 2.2) + 32
    phase = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(phase) * np.exp(-x * 1.4)
    crack = band(rng.standard_normal(len(x)), 300, 5000) * np.exp(-x * 18) * 0.5
    tail = band(rng.standard_normal(len(x)), 40, 400) * np.exp(-x * 2) * 0.35
    save("boom", norm(sub + crack + tail, 0.95))


# A rising rush of air into a hit.
def whoosh():
    x = t(1.6)
    n = rng.standard_normal(len(x))
    out = np.zeros_like(x)
    # Sweep a band upward in eight slices so it rises.
    slices = 16
    for i in range(slices):
        lo = 150 * (1.25 ** i)
        seg = band(n, lo, lo * 2.2)
        w = np.exp(-((x / 1.6 - i / slices) ** 2) / 0.006)
        out += seg * w
    env = np.sin(np.pi * np.clip(x / 1.6, 0, 1)) ** 1.5
    save("whoosh", norm(out * env, 0.6))


# Something being stretched: a falling pitch with a little grit.
def stretch():
    x = t(1.8)
    f = 900 * np.exp(-x * 2.4) + 50
    phase = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(phase) + 0.3 * np.sin(phase * 2.01)
    grit = band(rng.standard_normal(len(x)), 200, 2500) * 0.3
    env = np.minimum(1, x / 0.05) * np.exp(-x * 1.6)
    save("stretch", norm((tone + grit) * env, 0.45))


# A small glassy ping for a line landing.
def ping():
    x = t(1.4)
    tone = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * d) for f, a, d in [(1318.5, 1, 3), (1975.5, 0.4, 4.5), (2637, 0.2, 6)])
    save("ping", norm(tone * np.minimum(1, x / 0.004), 0.3))


# A short digital glitch for invented data.
def glitch():
    x = t(0.35)
    sq = np.sign(np.sin(2 * np.pi * 220 * x * (1 + 3 * (rng.random(len(x)) > 0.97))))
    chop = (np.floor(x * 60) % 2)
    save("glitch", norm(sq * chop * np.exp(-x * 6), 0.25))


# Tape being dragged backwards: a rising, wobbling tone over hiss.
def rewind():
    x = t(1.1)
    f = 120 + 900 * (x / 1.1) ** 2
    phase = 2 * np.pi * np.cumsum(f * (1 + 0.08 * np.sin(2 * np.pi * 13 * x))) / SR
    tone = np.sign(np.sin(phase)) * 0.25 + np.sin(phase * 0.5) * 0.4
    hiss = band(rng.standard_normal(len(x)), 1500, 7000) * 0.4
    env = np.minimum(1, x / 0.05) * np.minimum(1, (1.1 - x) / 0.1)
    save("rewind", norm((tone + hiss) * env, 0.4))


for fn in (drone, boom, whoosh, stretch, ping, glitch, rewind):
    fn()
print("written to", OUT)
