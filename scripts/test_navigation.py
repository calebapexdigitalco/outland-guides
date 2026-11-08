from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import unittest

def load(filename,name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/filename)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

checker=load('check-site.py','navigation_checker')
sync=load('sync-account-navigation.py','sync_navigation')

class NavigationTests(unittest.TestCase):
    def test_all_pages_have_permanent_account_access(self):
        self.assertEqual(checker.validate_navigation(),[])
        component=sync.TEMPLATE.read_text(encoding='utf-8').strip()
        for path in checker.ROOT.glob('*.html'):
            text=path.read_text(encoding='utf-8')
            self.assertEqual(text.count(component),1,path.name)
            self.assertEqual(sync.synchronize(text,component),text,path.name)
    def test_legacy_page_urls_fail_checks_but_external_documents_do_not(self):
        self.assertFalse(checker.clean_page_link('gear-help.html#gear'))
        self.assertFalse(checker.clean_page_link('/account.html?view=profile'))
        self.assertFalse(checker.clean_page_link('https://outlandguides.com/faq.html'))
        self.assertTrue(checker.clean_page_link('/account?view=profile'))
        self.assertTrue(checker.clean_page_link('https://www.openstreetmap.org/export/embed.html'))
    def test_detects_missing_bubble_and_script_generated_legacy_links(self):
        with TemporaryDirectory() as temp:
            root=Path(temp)
            (root/'index.html').write_text('<title>Outland</title><a href="faq.html">FAQ</a>',encoding='utf-8')
            (root/'old-nav.js').write_text('const menu=\'<a href="account.html">My Trips</a>\';',encoding='utf-8')
            errors=checker.validate_navigation(root)
            self.assertTrue(any('permanent My Trips' in e for e in errors))
            self.assertTrue(any('index.html: faq.html' in e for e in errors))
            self.assertTrue(any('old-nav.js: account.html' in e for e in errors))

if __name__=='__main__':unittest.main()
