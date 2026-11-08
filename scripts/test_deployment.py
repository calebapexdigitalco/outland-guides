from pathlib import Path
from tempfile import TemporaryDirectory
import importlib.util
import unittest

def load(filename, name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).parent / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

checker = load('check-site.py', 'check_site')
deploy = load('deploy-siteground.py', 'deploy_siteground')

class DeploymentTests(unittest.TestCase):
    def settings(self):
        return {'SITEGROUND_HOST': 'example.siteground.biz', 'SITEGROUND_USER': 'example_user',
                'SITEGROUND_PORT': '18765', 'SITEGROUND_PATH': '/home/customer/www/outlandguides.com/public_html',
                'SITEGROUND_SSH_KEY': '-----BEGIN OPENSSH PRIVATE KEY-----\nFAKE-TEST-FIXTURE\n-----END OPENSSH PRIVATE KEY-----',
                'SITEGROUND_KNOWN_HOSTS': 'test fixture'}
    def test_rejects_account_root_and_other_sites(self):
        for path in ['/', '/home/customer', '/home/customer/www/other.com/public_html',
                     '/home/customer/www/outlandguides.com/public_html/../']:
            settings = self.settings()
            settings['SITEGROUND_PATH'] = path
            with self.assertRaises(ValueError):
                deploy.validate_settings(settings)
    def test_rejects_shell_injection_in_host(self):
        settings = self.settings()
        settings['SITEGROUND_HOST'] = 'example.com; touch bad'
        with self.assertRaises(ValueError):
            deploy.validate_settings(settings)
    def test_requires_all_secrets(self):
        for name in deploy.REQUIRED:
            settings = self.settings()
            settings.pop(name)
            with self.assertRaises(ValueError):
                deploy.validate_settings(settings)
    def test_accepts_only_exact_site_destination(self):
        self.assertEqual(deploy.validate_settings(self.settings())[3], '/home/customer/www/outlandguides.com/public_html')
    def test_detects_broken_links_and_private_credentials(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name in checker.PAGES:
                (root / name).write_text('<title>Outland</title>', encoding='utf-8')
            (root / 'index.html').write_text('<title>Outland</title><img src="missing.jpg">', encoding='utf-8')
            (root / 'leaked.js').write_text('const secret="sk_' + 'test_' + 'x' * 30 + '";', encoding='utf-8')
            errors = checker.validate(root)
            self.assertTrue(any('Broken local reference' in error for error in errors))
            self.assertTrue(any('private credential' in error for error in errors))
    def test_rejects_private_server_files_in_public_folder(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'server.py').write_text('print("must not deploy")', encoding='utf-8')
            self.assertTrue(any('Unexpected public file' in error for error in checker.validate(root)))
    def test_rejects_batch_command_injection(self):
        with self.assertRaises(ValueError):
            deploy.quote('index.html\nrm something')

if __name__ == '__main__':
    unittest.main()
