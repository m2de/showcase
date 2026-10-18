"""Synthesises the sound effects in public/sfx/. No samples, so there's nothing to license.

Run with: python3 scripts/make-sfx.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack, decay):
    x = np.arange(n) / SR
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    return a * np.exp(-x / decay)


def lowpass(x, cutoff):
    # One-pole filter, run twice for a gentler slope.
    a = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(2):
        y = np.zeros_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            y[i] = acc
        x = y
    return x


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    data = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def stamp():
    n = int(SR * 0.6)
    x = t(0.6)
    thump = np.sin(2 * np.pi * (70 * np.exp(-x * 9) + 45) * x) * env(n, 0.002, 0.11)
    knock = lowpass(rng.standard_normal(n), 1800) * env(n, 0.0005, 0.025) * 3
    wood = np.sin(2 * np.pi * 210 * x) * env(n, 0.001, 0.04) * 0.4
    return thump * 1.4 + knock + wood


def paper_slap():
    n = int(SR * 0.35)
    noise = highpass(rng.standard_normal(n), 600)
    return noise * env(n, 0.001, 0.035) + lowpass(rng.standard_normal(n), 300) * env(n, 0.001, 0.05) * 1.5


def paper_slide(sec=0.7):
    n = int(SR * sec)
    noise = highpass(lowpass(rng.standard_normal(n), 5000), 900)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return noise * shape


def type_key(seed):
    r = np.random.default_rng(seed)
    n = int(SR * 0.09)
    x = t(0.09)
    click = highpass(r.standard_normal(n), 2000) * env(n, 0.0003, 0.006)
    body = np.sin(2 * np.pi * r.uniform(900, 1300) * x) * env(n, 0.0005, 0.012) * 0.5
    clunk = lowpass(r.standard_normal(n), 400) * env(n, 0.001, 0.02) * 1.2
    return click + body + clunk


def bell():
    x = t(1.2)
    n = len(x)
    tone = sum(np.sin(2 * np.pi * f * x) * a for f, a in [(2093, 1), (4186, 0.35), (5274, 0.2), (6280, 0.12)])
    return tone * env(n, 0.001, 0.35)


def biro(sec=0.28):
    n = int(SR * sec)
    noise = highpass(lowpass(rng.standard_normal(n), 7000), 2500)
    wobble = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t(sec))
    shape = np.sin(np.linspace(0, np.pi, n)) ** 0.7
    return noise * wobble * shape


def marker(sec=0.4):
    n = int(SR * sec)
    noise = highpass(lowpass(rng.standard_normal(n), 3500), 700)
    squeak = np.sin(2 * np.pi * 1600 * t(sec) + 3 * np.sin(2 * np.pi * 9 * t(sec))) * 0.08
    shape = np.minimum(1, np.linspace(0, 8, n)) * np.minimum(1, np.linspace(8, 0, n))
    return (noise + squeak) * shape


def tick():
    n = int(SR * 0.08)
    x = t(0.08)
    return (np.sin(2 * np.pi * 3200 * x) * 0.5 + highpass(rng.standard_normal(n), 3000)) * env(n, 0.0002, 0.006)


def tear(sec=0.9):
    n = int(SR * sec)
    # Lots of tiny fibre snaps, getting denser then trailing off.
    x = np.zeros(n)
    density = np.sin(np.linspace(0, np.pi, n)) ** 0.8
    for i in np.nonzero(rng.random(n) < density * 0.012)[0]:
        k = min(n - i, 300)
        x[i : i + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / 40) * rng.uniform(0.3, 1)
    return highpass(x, 800)


def typing(sec=8):
    # A continuous run of keystrokes at an uneven human pace, trimmed to length in the video.
    n = int(SR * sec)
    x = np.zeros(n)
    pos = 0
    keys = [type_key(i) for i in range(12)]
    while pos < n:
        k = keys[rng.integers(len(keys))] * rng.uniform(0.6, 1.0)
        end = min(n, pos + len(k))
        x[pos:end] += k[: end - pos]
        pos += int(SR * rng.uniform(0.055, 0.11))
    return x


def room(sec=12):
    # Quiet office room tone: brown-ish noise with a faint low hum.
    n = int(SR * sec)
    brown = np.cumsum(rng.standard_normal(n))
    brown = highpass(brown / np.max(np.abs(brown)), 40)
    hum = np.sin(2 * np.pi * 50 * t(sec)) * 0.02
    x = brown + hum
    fade = int(SR * 0.5)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x


OUT.mkdir(parents=True, exist_ok=True)
save("stamp.wav", stamp())
save("paper-slap.wav", paper_slap(), 0.7)
save("paper-slide.wav", paper_slide(), 0.6)
for i in range(4):
    save(f"key-{i}.wav", type_key(i), 0.6)
save("bell.wav", bell(), 0.5)
save("biro.wav", biro(), 0.5)
save("marker.wav", marker(), 0.5)
save("tick.wav", tick(), 0.5)
save("tear.wav", tear(), 0.7)
save("typing.wav", typing(), 0.55)
save("room.wav", room(), 0.3)
print("wrote", sorted(p.name for p in OUT.iterdir()))
