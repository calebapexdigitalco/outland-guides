"""Export the existing arrow mark and deterministic branded sharing cards."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageChops

ROOT = Path(__file__).resolve().parents[1] / 'outputs'
ASSETS = ROOT / 'assets'
CREAM = '#F0EDE3'
RUST = '#A65B2A'

def font(size, bold=False):
    return ImageFont.truetype(str(Path('C:/Windows/Fonts') / ('arialbd.ttf' if bold else 'arial.ttf')), size)

def main():
    logo = Image.open(ASSETS / 'OutlandGuides - 21 (Horizontal).png').convert('RGBA')
    # The arrow and lettering overlap in their rectangular bounds: isolate the
    # arrow with a generous silhouette mask, retaining its original pixels.
    mask = Image.new('L', logo.size)
    ImageDraw.Draw(mask).polygon([(578, 0), (1110, 1085), (740, 910), (840, 1200), (290, 1200), (410, 910), (0, 1090)], fill=255)
    logo.putalpha(ImageChops.multiply(logo.getchannel('A'), mask))
    arrow = logo.crop(logo.getbbox())
    icon = Image.new('RGBA', (512, 512), CREAM)
    mark = ImageOps.contain(arrow, (458, 458), Image.Resampling.LANCZOS)
    icon.alpha_composite(mark, ((512-mark.width)//2, (512-mark.height)//2))
    for size in (32, 192, 512):
        icon.resize((size,size), Image.Resampling.LANCZOS).save(ASSETS / f'outland-arrow-{size}.png', optimize=True)
    icon.resize((180,180), Image.Resampling.LANCZOS).save(ROOT / 'apple-touch-icon.png', optimize=True)
    icon.save(ROOT / 'favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64)])

    wordmark = Image.open(ASSETS / 'outland-guides-text-only.png').convert('RGBA')
    wordmark = wordmark.crop(wordmark.getbbox())
    wordmark = ImageOps.contain(wordmark, (270,135), Image.Resampling.LANCZOS)
    cards = {
        'outland': ('kilimanjaro-expedition.png', ['GLOBAL SUMMITS.', 'LOCAL LEGENDS.'], 'KILIMANJARO / FUEGO / TANZANIA SAFARIS'),
        'kilimanjaro': ('kilimanjaro-expedition.png', ['YOUR ROUTE.', 'AFRICA\u2019S ROOF.'], 'MOUNT KILIMANJARO / TANZANIA'),
        'fuego': ('fuego-gallery-night-eruption.jpeg', ['AFTER DARK.', 'ABOVE IT ALL.'], 'ACATENANGO & VOLC\u00c1N DE FUEGO / GUATEMALA'),
        'safari': ('wildlife-safari-expedition.png', ['THE WILD.', 'WITH LOCAL EYES.'], 'NGORONGORO & SERENGETI / TANZANIA'),
    }
    for name,(photo,lines,kicker) in cards.items():
        card = ImageOps.fit(ImageOps.exif_transpose(Image.open(ASSETS/photo)).convert('RGB'), (1200,630), centering=(.5,.3)).convert('RGBA')
        shade = Image.new('RGBA',card.size)
        px=shade.load()
        for x in range(1200):
            alpha=int(235 - 145*(x/1199)**1.7)
            if name == 'fuego': alpha=int(235 - 220*min(1,x/900)**.7)
            for y in range(630): px[x,y]=(13,16,17,min(255,alpha+int(25*y/630)))
        card=Image.alpha_composite(card,shade)
        card.alpha_composite(wordmark,(64,48))
        d=ImageDraw.Draw(card)
        d.rectangle((64,216,126,221), fill=RUST)
        for i,line in enumerate(lines):
            size=66
            while d.textlength(line,font=font(size,True))>1070: size-=1
            d.text((60,250+i*82),line,font=font(size,True),fill=CREAM if i==0 else '#D8864B')
        d.text((64,457),'Vetted local teams. Personal expedition planning.',font=font(25),fill=CREAM)
        d.line((64,526,1136,526),fill=(240,237,227,70),width=1)
        d.text((64,551),kicker,font=font(16,True),fill=CREAM)
        d.text((936,550),'outlandguides.com',font=font(20),fill=CREAM)
        card.convert('RGB').save(ASSETS/f'share-{name}-v1.jpg',quality=90,optimize=True,progressive=True)
    print('Arrow favicons and four 1200x630 sharing cards exported.')

if __name__=='__main__': main()
