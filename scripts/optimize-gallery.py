"""Create responsive WebP display assets; retain originals for expanded viewing."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1] / 'outputs' / 'assets'
DEST = ROOT / 'optimized'
WIDTHS = (240, 480, 960, 1440)

def main():
    DEST.mkdir(exist_ok=True)
    originals = sorted(set(ROOT.glob('fuego-gallery-*.*')) | set(ROOT.glob('kili-gallery-*.*')) | {ROOT/'kili-guide-renga.png'})
    manifest = {}
    for source in originals:
        if source.suffix.lower() not in {'.jpg', '.jpeg', '.png'}: continue
        with Image.open(source) as original:
            photo = ImageOps.exif_transpose(original).convert('RGB')
            variants = []
            for width in WIDTHS:
                width = min(width, photo.width)
                target = DEST / f'{source.stem}-{width}.webp'
                resized = photo.copy()
                resized.thumbnail((width, round(photo.height * width / photo.width)), Image.Resampling.LANCZOS)
                resized.save(target, 'WEBP', quality=80, method=6, icc_profile=original.info.get('icc_profile', b''))
                variants.append({'src':'/assets/optimized/'+target.name, 'width':resized.width, 'bytes':target.stat().st_size})
            manifest['/assets/'+source.name] = {'width':photo.width, 'height':photo.height, 'original_bytes':source.stat().st_size, 'variants':variants}
    (ROOT/'gallery-images.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    (ROOT/'image-assets.js').write_text('/* Generated responsive gallery assets. Originals load only on expansion. */\n(function(){\nconst images='+json.dumps(manifest,separators=(',',':'))+';\n'+HELPER+'\n})();\n',encoding='utf-8')
    before=sum(item['original_bytes'] for item in manifest.values())
    display=sum(item['variants'][2]['bytes'] for item in manifest.values())
    print(f'{len(manifest)} originals retained. 960px display set: {display:,} bytes versus {before:,} original bytes ({(1-display/before)*100:.1f}% smaller).')

HELPER = r'''
function attributes(src,sizes='(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw'){
  const item=images[src];if(!item)return 'src="'+src+'" loading="lazy" decoding="async"';
  const variants=item.variants;
  return 'src="'+variants[1].src+'" srcset="'+variants.map(v=>v.src+' '+v.width+'w').join(', ')+'" sizes="'+sizes+'" width="'+item.width+'" height="'+item.height+'" loading="lazy" decoding="async"';
}
function set(img,src,sizes='(min-width: 1024px) 1024px, 100vw'){
  const item=images[src];if(!item){img.removeAttribute('srcset');img.src=src;return;}
  img.sizes=sizes;img.srcset=item.variants.map(v=>v.src+' '+v.width+'w').join(', ');img.src=item.variants[1].src;
  img.width=item.width;img.height=item.height;img.decoding='async';
}
window.OutlandImages={images,attributes,set};
'''

if __name__=='__main__': main()
