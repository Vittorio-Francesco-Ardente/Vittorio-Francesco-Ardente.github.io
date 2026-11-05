#!/usr/bin/env python3
"""Crea un'anteprima LinkedIn nitida usando il ritratto e il logo tipografico originali."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "og/og-base-nitido.png"
PORTRAIT = ROOT / "v3/img/ritratto-pulito.webp"
SOURCE = ROOT / "og/og-base.jpg"
FONT_WOFF = ROOT / "fonts/montserrat-latin-800-normal.woff2"
S = 2
W, H = 1200, 628
size = (W*S, H*S)
image = Image.new("RGB", size)
pixels = image.load()
for y in range(size[1]):
    v = y / max(1,size[1]-1)
    for x in range(size[0]):
        dx = abs(x-size[0]*.50) / (size[0]*.5)
        f = min(1.0, .15*dx + .18*v)
        pixels[x,y] = (int(5+4*f), int(49-13*f), int(187-35*f))

d = ImageDraw.Draw(image)
ttf = Path("/tmp/vfa-og-montserrat.ttf")
try:
    fnt=TTFont(str(FONT_WOFF))
    fnt.flavor=None
    fnt.save(str(ttf))
    fontfile=str(ttf)
except Exception:
    fontfile="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

text="VITTORIO"
font_size=184*S
font=ImageFont.truetype(fontfile,font_size)
limit=1100*S
while d.textbbox((0,0),text,font=font,stroke_width=0)[2]>limit and font_size>90*S:
    font_size-=2*S
    font=ImageFont.truetype(fontfile,font_size)
bb=d.textbbox((0,0),text,font=font)
tw=bb[2]-bb[0]
d.text(((size[0]-tw)/2-bb[0],82*S-bb[1]),text,font=font,fill="#FFFFFF",stroke_width=0)

portrait=Image.open(PORTRAIT).convert("RGBA")
alpha=portrait.getchannel("A")
extrema=alpha.getextrema()
if extrema[0]==255:
    source=Image.open(SOURCE).convert("RGB")
    source=source.resize(size,Image.Resampling.LANCZOS)
    source=source.filter(ImageFilter.UnsharpMask(radius=2.0,percent=185,threshold=2))
    image=source
    print("Portrait has no transparent cutout: lossless sharpened fallback.")
else:
    bounds=alpha.getbbox()
    if not bounds:
        raise RuntimeError("Ritratto senza contenuto visibile")
    portrait=portrait.crop(bounds)
    maxw,maxh=520*S,510*S
    scale=min(maxw/portrait.width,maxh/portrait.height)
    target=(max(1,round(portrait.width*scale)),max(1,round(portrait.height*scale)))
    portrait=portrait.resize(target,Image.Resampling.LANCZOS)
    x=(size[0]-portrait.width)//2
    y=size[1]-portrait.height+3*S
    canvas=image.convert("RGBA")
    canvas.alpha_composite(portrait,(x,y))
    image=canvas.convert("RGB")
    print(f"Transparent portrait composited: {target}, x={x}, y={y}")

image=image.resize((W,H),Image.Resampling.LANCZOS)
DEST.parent.mkdir(parents=True,exist_ok=True)
image.save(DEST,format="PNG",optimize=True)
print(f"Output: {DEST.relative_to(ROOT)}, {image.size}, {DEST.stat().st_size} bytes")
