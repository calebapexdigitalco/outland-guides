from pathlib import Path
from html.parser import HTMLParser
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree
import json,re,unittest

ROOT=Path(__file__).resolve().parents[1]/'outputs'

class Tags(HTMLParser):
    def __init__(self,text):
        super().__init__();self.nodes=[];self.feed(text)
    def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))

class LaunchTests(unittest.TestCase):
    def test_clean_canonicals_and_unique_search_metadata(self):
        titles=[];descriptions=[]
        footer=(ROOT.parent/'templates/site-footer.html').read_text(encoding='utf-8').strip()
        for page in ROOT.glob('*.html'):
            text=page.read_text(encoding='utf-8');nodes=Tags(text).nodes
            expected='https://outlandguides.com'+('/' if page.stem=='index' else '/'+page.stem)
            self.assertEqual([a['href'] for t,a in nodes if t=='link' and a.get('rel')=='canonical'],[expected],page.name)
            desc=[a.get('content') for t,a in nodes if t=='meta' and a.get('name')=='description']
            self.assertEqual(len(desc),1,page.name);self.assertTrue(70<=len(desc[0])<=165,page.name);descriptions+=desc
            titles.append(re.search(r'<title>(.*?)</title>',text).group(1))
            self.assertEqual(sum(t=='h1' for t,a in nodes),1,page.name)
            robots=[a['content'] for t,a in nodes if t=='meta' and a.get('name')=='robots']
            self.assertEqual(len(robots),1)
            self.assertEqual('noindex' in robots[0],page.stem in {'account','payments'})
            self.assertIn('data-legal-links',text,page.name)
            self.assertIn(footer,text,page.name)
        self.assertEqual(len(set(titles)),len(titles));self.assertEqual(len(set(descriptions)),len(descriptions))

    def test_sitemap_and_robots_allow_clean_public_pages_and_noindex_crawling(self):
        tree=ElementTree.parse(ROOT/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls=[n.text for n in tree.findall('s:url/s:loc',ns)]
        self.assertEqual(len(urls),9);self.assertEqual(len(set(urls)),9)
        self.assertFalse(any('.html' in url or url.endswith(('/payments','/account')) for url in urls))
        robot=RobotFileParser();robot.parse((ROOT/'robots.txt').read_text().splitlines())
        self.assertTrue(all(robot.can_fetch('Googlebot',url) for url in urls))
        self.assertTrue(robot.can_fetch('Googlebot','https://outlandguides.com/account'))
        self.assertFalse(robot.can_fetch('Googlebot','https://outlandguides.com/api/booking/session'))
        self.assertIn('https://outlandguides.com/sitemap.xml',robot.site_maps())
        routing=(ROOT/'.htaccess').read_text();self.assertIn('%{THE_REQUEST}',routing);self.assertIn('[R=404,END,NC]',routing)

    def test_no_retired_prices_or_unsupported_homepage_metrics(self):
        for p in ROOT.rglob('*'):
            if p.suffix not in {'.html','.js'}:continue
            self.assertFalse(re.search(r'\$(?:3,?950|4,?650|2,?850|110|450)(?!\d)',p.read_text(encoding='utf-8')),str(p))
        home=(ROOT/'index.html').read_text(encoding='utf-8')
        for phrase in ['3+ Years','100+','Five-star reviews']:self.assertNotIn(phrase,home)
        for phrase in ['Expedition experiences','Kilimanjaro itineraries','Planning support']:self.assertIn(phrase,home)
        self.assertFalse((ROOT/'assets/kilimanjaro-routes.js').exists())

    def test_gallery_variants_are_small_and_originals_are_retained(self):
        images=json.loads((ROOT/'assets/gallery-images.json').read_text())
        self.assertEqual(len(images),16)
        for src,item in images.items():
            self.assertTrue((ROOT/src.lstrip('/')).exists())
            self.assertEqual(len(item['variants']),4)
            self.assertLess(item['variants'][2]['bytes'],item['original_bytes'])
            for variant in item['variants']:self.assertTrue((ROOT/variant['src'].lstrip('/')).exists())
        # Expansion still uses the preserved source, while gallery markup uses responsive assets.
        fuego=(ROOT/'assets/fuego-gallery.js').read_text(encoding='utf-8')
        self.assertIn('image.src = photo.src;',fuego);self.assertIn('OutlandImages.attributes',fuego)
        kili=(ROOT/'assets/kilimanjaro-routes-v2.js').read_text(encoding='utf-8')
        self.assertIn('image.src=card.dataset.gallerySrc',kili);self.assertIn('OutlandImages.attributes',kili)

    def test_shared_trip_keyboard_controller_handles_dynamic_tabs(self):
        controller=(ROOT/'assets/kilimanjaro-mobile-tabs.js').read_text(encoding='utf-8')
        for key in ['ArrowRight','ArrowLeft','Home','End','aria-controls','aria-labelledby','tabpanel','tabIndex','MutationObserver']:
            self.assertIn(key,controller)

if __name__=='__main__':unittest.main()
