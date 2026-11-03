"""Generate the VEIVETY app icon, adaptive icon, splash mark and favicon.

The lockup matches the packaging: small "BEAUTY WITH" over a heavy condensed
"VEIVETY" (Anton), ink on warm white.  Run: python3 scripts/generate-veivety-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ANTON = ROOT / 'node_modules/@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf'
DMSANS = ROOT / 'node_modules/@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'
INK = (22, 17, 19, 255)
WHITE = (255, 251, 250, 255)
OUT = ROOT / 'assets/images'


def lockup(size, content_ratio, background, tagline=True):
    im = Image.new('RGBA', (size, size), background)
    d = ImageDraw.Draw(im)
    target_w = size * content_ratio
    # fit VEIVETY to the target width
    fs = int(size * 0.3)
    while True:
        font = ImageFont.truetype(str(ANTON), fs)
        box = d.textbbox((0, 0), 'VEIVETY', font=font)
        if box[2] - box[0] <= target_w or fs < 8:
            break
        fs -= 2
    word_w, word_h = box[2] - box[0], box[3] - box[1]
    small = ImageFont.truetype(str(DMSANS), max(6, int(fs * 0.17)))
    sbox = d.textbbox((0, 0), 'BEAUTY WITH', font=small)
    s_w, s_h = sbox[2] - sbox[0], sbox[3] - sbox[1]
    gap = int(fs * 0.08)
    total_h = (s_h + gap if tagline else 0) + word_h
    top = (size - total_h) / 2
    if tagline:
        d.text(((size - s_w) / 2 - sbox[0], top - sbox[1]), 'BEAUTY WITH', font=small, fill=INK)
        top += s_h + gap
    d.text(((size - word_w) / 2 - box[0], top - box[1]), 'VEIVETY', font=font, fill=INK)
    return im


def monogram(size, background):
    im = Image.new('RGBA', (size, size), background)
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(str(ANTON), int(size * 0.78))
    box = d.textbbox((0, 0), 'V', font=font)
    d.text(((size - (box[2] - box[0])) / 2 - box[0], (size - (box[3] - box[1])) / 2 - box[1]), 'V', font=font, fill=INK)
    return im


lockup(1024, 0.74, WHITE).save(OUT / 'icon.png')
# Android adaptive icons crop to a circle/squircle: keep content in the middle 60%.
lockup(1024, 0.56, (0, 0, 0, 0)).save(OUT / 'adaptive-icon.png')
lockup(512, 0.86, (0, 0, 0, 0)).save(OUT / 'splash-icon.png')
monogram(64, WHITE).save(OUT / 'favicon.png')
print('icons written to', OUT)
