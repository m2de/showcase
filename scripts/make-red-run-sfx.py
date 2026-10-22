"""Synthesises the sounds for The One Red Run in public/sfx/red-run/. No samples, nothing to license.

Run with: python3 scripts/make-red-run-sfx.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx" / "red-run"
rng = np.random.default_rng(22)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack, decay):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(attack, 1e-4)) * np.exp(-x / decay)


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    data = np.clip(np.stack([x, x], axis=1), -1, 1)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((data * 32767).astype(np.int16).tobytes())


def blip(freq=1800, dur=0.03):
    s = t(dur)
    return np.sin(2 * np.pi * freq * s) * env(len(s), 0.001, dur / 4)


# A test run passing: one short, quiet blip.
save("blip", blip(), 0.5)

# The grid filling: blips that start slow and run into a blur, over five seconds.
length = 5.0
fill = np.zeros(int(SR * length))
times = 4.6 * (np.linspace(0, 1, 260) ** 0.42)
for i, at in enumerate(times):
    b = blip(1500 + rng.uniform(-200, 400), 0.025) * (0.35 + 0.65 * (1 - i / 260))
    start = int(at * SR)
    fill[start : start + len(b)] += b[: len(fill) - start]
save("fill", fill, 0.6)

# The one red run: a low thump with a dull buzz on top.
s = t(1.2)
thump = np.sin(2 * np.pi * (55 + 60 * np.exp(-s * 18)) * s) * env(len(s), 0.002, 0.35)
buzz = np.sign(np.sin(2 * np.pi * 110 * s)) * 0.18 * env(len(s), 0.005, 0.18)
save("thud", thump + buzz)

# A smaller red flash, for the brittle test.
s = t(0.4)
save("flick", np.sin(2 * np.pi * (90 + 120 * np.exp(-s * 30)) * s) * env(len(s), 0.002, 0.09) + np.sign(np.sin(2 * np.pi * 220 * s)) * 0.08 * env(len(s), 0.002, 0.06), 0.7)

# A knock: the agent bumping into code.
s = t(0.25)
noise = rng.standard_normal(len(s))
save("knock", (np.sin(2 * np.pi * 180 * s) + 0.4 * noise) * env(len(s), 0.001, 0.03), 0.7)

# A mouse click.
s = t(0.06)
save("click", rng.standard_normal(len(s)) * env(len(s), 0.0005, 0.006), 0.5)

# A whoosh for the squares flying home.
s = t(1.4)
n = rng.standard_normal(len(s))
spec = np.fft.rfft(n)
f = np.fft.rfftfreq(len(n), 1 / SR)
spec[(f < 300) | (f > 5000)] = 0
w = np.fft.irfft(spec, len(n)) * np.sin(np.pi * np.clip(s / 1.4, 0, 1)) ** 2
save("whoosh", w, 0.5)

# A soft two-note chime for the end card.
s = t(1.6)
chime = sum(np.sin(2 * np.pi * fr * s) * env(len(s), 0.003, 0.5) * a for fr, a in [(660, 1), (990, 0.5), (1320, 0.2)])
late = np.concatenate([np.zeros(int(SR * 0.12)), (np.sin(2 * np.pi * 880 * s) * env(len(s), 0.003, 0.6))[: len(s) - int(SR * 0.12)]])
save("chime", chime + 0.7 * late, 0.6)
