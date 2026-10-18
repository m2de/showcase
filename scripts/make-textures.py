"""Pre-renders the noise textures in public/textures/.

Drawing SVG fractal noise on every sheet for every frame made renders crawl,
so the grain is baked into small tiling PNGs instead.

Run with: python3 scripts/make-textures.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(11)
SIZE = 512


def tileable_noise(scale):
    # Sum of smoothed random fields, wrapped so the tile repeats without seams.
    out = np.zeros((SIZE, SIZE))
    for octave, weight in [(scale, 1.0), (scale * 2, 0.5), (scale * 4, 0.25), (scale * 8, 0.125)]:
        n = max(2, SIZE // octave)
        small = rng.standard_normal((n, n))
        big = Image.fromarray(((small - small.min()) / (np.ptp(small) + 1e-9) * 255).astype(np.uint8))
        big = np.asarray(big.resize((SIZE, SIZE), Image.BICUBIC), dtype=float) / 255
        out += big * weight
    out = (out - out.min()) / np.ptp(out)
    return out


def save_grey(arr, name, contrast=1.0):
    arr = np.clip(0.5 + (arr - 0.5) * contrast, 0, 1)
    Image.fromarray((arr * 255).astype(np.uint8), "L").save(OUT / name, optimize=True)


# Paper fibre: mostly fine grain over a soft mottle.
save_grey(tileable_noise(2) * 0.6 + tileable_noise(64) * 0.4, "paper.png", 1.4)
# Film grain: pure per-pixel noise, a few frames to cycle through.
for i in range(6):
    save_grey(rng.random((SIZE, SIZE)), f"film-{i}.png", 0.9)
print(sorted(p.name for p in OUT.iterdir()))
