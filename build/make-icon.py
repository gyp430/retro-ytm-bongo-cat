"""
Generate build/icon.ico (+ build/icon.png) for Retro YTM Bongo Cat.

Programmatic redraw of the in-app bongo-cat mascot (renderer/index.html #cat)
onto the app's "black screen + green LCD glow" surface, so the taskbar / exe
icon matches the player. No SVG rasteriser needed — pure Pillow primitives.

Build-time only (not a runtime dep):  python -m pip install pillow
Run:  python build/make-icon.py
"""
from __future__ import annotations
import math
from PIL import Image, ImageDraw, ImageFilter

# ---- palette (mirrors winamp.css Classic Green) --------------------------
SCREEN_A = (7, 12, 9)       # rounded-rect top
SCREEN_B = (2, 5, 3)        # rounded-rect bottom
BEZEL = (34, 42, 36)
INK = (236, 231, 217)       # .ink  — the cat line-work
LCD = (141, 255, 185)       # --lcd — the green glow
LCD_DIM = (60, 150, 95)
BLUSH = (227, 137, 166)     # .blush

HEAD_FILL = (26, 32, 28)    # faint silhouette so the face reads at 24-32px
LCD_RIM = (141, 255, 185)

SS = 8                      # supersample factor for smooth lines
BASE = 256                  # final master size
N = BASE * SS

# in-app cat is drawn in a 130 x 84 viewBox — map that into the canvas
VB_W, VB_H = 130.0, 84.0
PAD = 16 * SS               # inset of the cat art inside the icon (bigger = smaller cat)
ART_W = N - 2 * PAD
SCALE = ART_W / VB_W
ART_H = VB_H * SCALE
OX = PAD
OY = (N - ART_H) / 2 + 4 * SS   # nudge down: keyboard sits low, ears need headroom


def P(x, y):
    """viewBox coord -> canvas px."""
    return (OX + x * SCALE, OY + y * SCALE)


def bez(pts, steps=120):
    """Sample a cubic (4 pts) or quadratic (3 pts) Bezier in viewBox space."""
    out = []
    for i in range(steps + 1):
        t = i / steps
        if len(pts) == 4:
            (x0, y0), (x1, y1), (x2, y2), (x3, y3) = pts
            mt = 1 - t
            x = mt**3 * x0 + 3 * mt**2 * t * x1 + 3 * mt * t**2 * x2 + t**3 * x3
            y = mt**3 * y0 + 3 * mt**2 * t * y1 + 3 * mt * t**2 * y2 + t**3 * y3
        else:
            (x0, y0), (x1, y1), (x2, y2) = pts
            mt = 1 - t
            x = mt**2 * x0 + 2 * mt * t * x1 + t**2 * x2
            y = mt**2 * y0 + 2 * mt * t * y1 + t**2 * y2
        out.append(P(x, y))
    return out


def polyline(d, pts, width, fill=INK):
    d.line(pts, fill=fill, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):          # round the caps
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def rounded_rect_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


# ---- build the RGBA master --------------------------------------------------
img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# vertical-ish gradient screen fill
grad = Image.new("RGB", (1, N))
for y in range(N):
    t = y / (N - 1)
    grad.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(SCREEN_A, SCREEN_B)))
grad = grad.resize((N, N))

radius = int(N * 0.22)
mask = rounded_rect_mask(N, radius)
img.paste(grad, (0, 0), mask)

# thin bezel keyline + inner LCD glow ring
d.rounded_rectangle((6 * SS, 6 * SS, N - 6 * SS, N - 6 * SS), radius=radius - 6 * SS,
                    outline=BEZEL, width=3 * SS)

glow = Image.new("RGBA", (N, N), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.rounded_rectangle((14 * SS, 14 * SS, N - 14 * SS, N - 14 * SS), radius=radius - 12 * SS,
                     outline=(*LCD, 90), width=5 * SS)
glow = glow.filter(ImageFilter.GaussianBlur(9 * SS))
img.alpha_composite(glow)

LW = max(4 * SS, round(3.8 * SCALE))    # bolder — must survive a 24px taskbar icon
THIN = max(3 * SS, round(2.4 * SCALE))

# 3) ears — two filled triangles on top of the head (as in the in-app SVG:
#    M45 18 L41 6 L55 14  /  M85 18 L89 6 L75 14), widened a touch for the icon
for pts in ([(44, 20), (38, 2), (58, 15)], [(86, 20), (92, 2), (72, 15)]):
    poly = [P(*p) for p in pts]
    d.polygon(poly, fill=HEAD_FILL)
    polyline(d, poly + [poly[0]], LW, INK)

# 2) head — filled silhouette + stroked arc  (M33 58 C33 11 97 11 97 58)
head = bez([(33, 58), (33, 11), (97, 11), (97, 58)])
d.polygon(head + [P(97, 58), P(33, 58)], fill=HEAD_FILL)
polyline(d, head, LW, INK)

# 1) keyboard baseline (M2 58 H128) + a soft green under-glow — after the head
#    so keys / paws sit in front of the chin
kb = [P(4, 58), P(126, 58)]
kbglow = Image.new("RGBA", (N, N), (0, 0, 0, 0))
ImageDraw.Draw(kbglow).line(kb, fill=(*LCD, 190), width=round(8 * SCALE))
kbglow = kbglow.filter(ImageFilter.GaussianBlur(5 * SS))
img.alpha_composite(kbglow)
polyline(d, kb, LW, INK)

# white keys (verticals) + black keys
for kx in range(12, 121, 10):
    polyline(d, [P(kx, 58), P(kx, 71)], THIN, INK)
for bx in (16, 37, 57, 77, 97):
    x0, y0 = P(bx, 58)
    x1, y1 = P(bx + 5.5, 67)
    d.rectangle((x0, y0, x1, y1), fill=INK)

# 4) eyes (filled green + bloom so they read as lit LCD dots)
eye_glow = Image.new("RGBA", (N, N), (0, 0, 0, 0))
eg = ImageDraw.Draw(eye_glow)
for ex in (55, 77):
    cx, cy = P(ex, 33)
    rx, ry = 4.6 * SCALE, 6.2 * SCALE
    eg.ellipse((cx - rx * 1.8, cy - ry * 1.8, cx + rx * 1.8, cy + ry * 1.8), fill=(*LCD, 120))
eye_glow = eye_glow.filter(ImageFilter.GaussianBlur(3 * SS))
img.alpha_composite(eye_glow)
for ex in (55, 77):
    cx, cy = P(ex, 33)
    rx, ry = 4.6 * SCALE, 6.2 * SCALE
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=LCD)

# 5) mouth  M60 41 q3 3 6 0 q3 3 6 0
polyline(d, bez([(60, 41), (63, 44), (66, 41)]), THIN, INK)
polyline(d, bez([(66, 41), (69, 44), (72, 41)]), THIN, INK)

# 6) blush ticks
for bx in (46, 49, 83, 86):
    polyline(d, [P(bx, 38), P(bx, 43)], THIN, BLUSH)

# 7) whiskers
for a, b in [((43, 34), (30, 32)), ((43, 38), (30, 41)),
             ((89, 34), (102, 32)), ((89, 38), (102, 41))]:
    polyline(d, [P(*a), P(*b)], THIN, INK)

# 8) paws  (rounded blobs on the keys) + toe lines
for px in (32, 97):
    poly = bez([(px - 5, 59), (px - 9, 58), (px - 9, 47)]) + \
           bez([(px - 9, 47), (px - 9, 41), (px, 41)]) + \
           bez([(px, 41), (px + 10, 41), (px + 10, 47)]) + \
           bez([(px + 10, 47), (px + 10, 52), (px + 6, 59)])
    polyline(d, poly, LW, INK)
    for t in (-4, 1, 6):
        polyline(d, [P(px + t, 59), P(px + t, 54)], THIN, INK)

# ---- downsample + reapply the rounded mask (kills fringe) -----------------
master = img.resize((BASE, BASE), Image.LANCZOS)
m2 = rounded_rect_mask(BASE, int(BASE * 0.22))
out = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
out.paste(master, (0, 0), m2)

out.save("build/icon.png")
sizes = [16, 24, 32, 48, 64, 128, 256]
out.save("build/icon.ico", sizes=[(s, s) for s in sizes])
# runtime copy for BrowserWindow({icon}) — renderer/ is bundled into app.asar
# and served by Flask, so the dev + packaged window/taskbar icon resolves here
out.save("renderer/icon.png")
print("wrote build/icon.png, build/icon.ico, renderer/icon.png", sizes)
