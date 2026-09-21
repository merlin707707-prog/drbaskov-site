#!/usr/bin/env python3
"""
Генератор обложек для превью ссылок (og:image).
Читает src/content/blog/*.md и создаёт public/og/<slug>.jpg для каждой статьи.

Запуск:  python tools/make-og.py
Требует: pip install pillow
"""
import os, re, glob, math
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "src", "content", "blog")
OUT  = os.path.join(ROOT, "public", "og")

W, H = 1200, 630
BG   = (16, 18, 24)
INK  = (232, 228, 220)
GOLD = (201, 162, 107)
DIM  = (154, 150, 163)

FDIR = "/usr/share/fonts/truetype/dejavu/"
if not os.path.isdir(FDIR):                      # Windows
    FDIR = "C:/Windows/Fonts/"
    SERIF, SANS = "georgia.ttf", "segoeui.ttf"
else:
    SERIF, SANS = "DejaVuSerif.ttf", "DejaVuSans.ttf"

def font(name, size):
    return ImageFont.truetype(os.path.join(FDIR, name), size)

def mix(a, b, k):
    return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

def frontmatter(path):
    txt = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---", txt, re.S)
    if not m:
        return {}
    data = {}
    for line in m.group(1).split("\n"):
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            data[k.strip()] = v.strip().strip('"').strip("'")
    return data

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def background():
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    cx, cy = 1010, 315
    for r in range(420, 0, -6):
        k = 1 - r / 420
        gd.ellipse([cx-r, cy-r, cx+r, cy+r], fill=mix(BG, (38, 33, 28), k * .55))
    img = Image.blend(img, glow, .9)
    d = ImageDraw.Draw(img)
    for r, w, a in ((300, 1, .14), (250, 1, .20), (196, 2, .30), (120, 1, .22)):
        d.ellipse([cx-r, cy-r, cx+r, cy+r], outline=mix(BG, GOLD, a), width=w)
    for a in range(0, 360, 90):
        rad = math.radians(a)
        d.line([cx+120*math.cos(rad), cy+120*math.sin(rad),
                cx+250*math.cos(rad), cy+250*math.sin(rad)], fill=mix(BG, GOLD, .26), width=2)
    for a in range(45, 360, 90):
        rad = math.radians(a)
        d.line([cx+130*math.cos(rad), cy+130*math.sin(rad),
                cx+196*math.cos(rad), cy+196*math.sin(rad)], fill=mix(BG, GOLD, .15), width=1)
    d.ellipse([cx-12, cy-12, cx+12, cy+12], fill=GOLD)
    d.rectangle([28, 28, W-29, H-29], outline=mix(BG, GOLD, .20), width=1)
    return img

def cover(title, tags):
    img = background()
    d = ImageDraw.Draw(img)
    x, max_w = 88, 700

    size = 48
    while size > 30:
        f = font(SERIF, size)
        lines = wrap(d, title, f, max_w)
        if len(lines) <= 4:
            break
        size -= 3
    f = font(SERIF, size)
    lines = wrap(d, title, f, max_w)[:4]

    lh = int(size * 1.34)
    block = lh * len(lines)
    y = 300 - block // 2

    d.text((x, 92), "ВЛАДИСЛАВ БАСКОВ", font=font(SANS, 19), fill=mix(BG, GOLD, .85))
    d.text((x, 122), "врач-психиатр, психотерапевт", font=font(SANS, 18), fill=DIM)

    for i, ln in enumerate(lines):
        d.text((x, y + i * lh), ln, font=f, fill=INK)

    d.line([x, y + block + 30, x + 84, y + block + 30], fill=GOLD, width=2)
    if tags:
        d.text((x, y + block + 52), " · ".join(tags[:3]), font=font(SANS, 19), fill=DIM)
    d.text((x, H - 96), "drbaskov.ru", font=font(SANS, 20), fill=mix(BG, GOLD, .7))
    return img

def main():
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for path in sorted(glob.glob(os.path.join(SRC, "*.md"))):
        fm = frontmatter(path)
        if fm.get("draft", "false").lower() == "true":
            continue
        slug = os.path.splitext(os.path.basename(path))[0]
        title = fm.get("title", slug)
        tags = re.findall(r'"([^"]+)"', fm.get("tags", ""))
        cover(title, tags).save(os.path.join(OUT, slug + ".jpg"), "JPEG", quality=86, optimize=True)
        n += 1
    print(f"готово: {n} обложек в public/og/")

if __name__ == "__main__":
    main()
