"""Check the static files that are allowed to be published."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1] / 'outputs'
PAGES = {'index.html', 'about.html', 'contact.html', 'faq.html', 'gear-help.html',
         'kilimanjaro.html', 'safari.html', 'volcan-de-fuego.html', 'payments.html', 'account.html'}
EXTENSIONS = {'.html', '.css', '.js', '.json', '.xml', '.txt', '.jpg', '.jpeg',
              '.png', '.svg', '.webm', '.mp4', '.woff', '.woff2', '.ico', '.avif', '.webp'}
SECRET = re.compile(r'(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----')

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.accounts = 0
        self.account_links = []
        self.account_scripts = 0
        self.account_styles = 0
    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get('id') == 'account-navigation': self.accounts += 1
        if tag == 'a' and 'account-bubble' in attributes.get('class','').split(): self.account_links.append(attributes.get('href'))
        if tag == 'script' and urlsplit(attributes.get('src','')).path == '/assets/account-navigation.js': self.account_scripts += 1
        if tag == 'link' and urlsplit(attributes.get('href','')).path == '/assets/account-navigation.css': self.account_styles += 1
        for key, value in attrs:
            if key in {'src', 'href', 'poster'} and value:
                self.urls.append(value)

def clean_page_link(url):
    parts=urlsplit(url)
    local=not parts.scheme and not parts.netloc
    own_domain=parts.hostname in {'outlandguides.com','www.outlandguides.com'}
    return not ((local or own_domain) and parts.path.lower().endswith('.html'))

def validate_navigation(root=ROOT):
    root=Path(root);errors=[]
    for page in sorted(PAGES):
        path=root/page
        if not path.exists():continue
        parser=References();parser.feed(path.read_text(encoding='utf-8-sig'))
        if parser.accounts!=1 or parser.account_links!=['/account']:
            errors.append(f'Missing or duplicate permanent My Trips link: {page}')
        if parser.account_scripts!=1 or parser.account_styles!=1:
            errors.append(f'Account navigation must load directly once: {page}')
        for url in parser.urls:
            if not clean_page_link(url):errors.append(f'Use a clean page address in {page}: {url}')
    for script in root.rglob('*.js'):
        for url in re.findall(r'''href\s*=\s*["']([^"']+)["']''',script.read_text(encoding='utf-8-sig')):
            if not clean_page_link(url):errors.append(f'Use a clean page address in {script.name}: {url}')
    return errors

def validate(root=ROOT):
    root = Path(root).resolve()
    errors = []
    if not root.is_dir():
        return ['The outputs folder is missing.']
    for page in sorted(PAGES):
        if not (root / page).is_file():
            errors.append(f'Missing required page: {page}')
    for file in sorted(root.rglob('*')):
        relative = file.relative_to(root)
        if file.is_symlink():
            errors.append(f'Symbolic links cannot be published: {relative}')
            continue
        if not file.is_file():
            continue
        routing_config = relative.as_posix() == '.htaccess'
        payment_backend = relative.as_posix() in {'api/stripe/index.php', 'api/stripe/lib.php', 'api/booking/catalog.php', 'api/booking/portal.php', 'api/booking/index.php'}
        if not (routing_config or payment_backend) and (file.suffix.lower() not in EXTENSIONS or any(part.startswith('.') for part in relative.parts)):
            errors.append(f'Unexpected public file: {relative}')
        if file.stat().st_size >= 100 * 1024 * 1024:
            errors.append(f'File exceeds GitHub normal file size limit: {relative}')
        if routing_config or payment_backend or file.suffix.lower() in {'.html', '.css', '.js', '.json', '.xml', '.txt', '.svg'}:
            text = file.read_text(encoding='utf-8-sig')
            if SECRET.search(text):
                errors.append(f'A private credential appears in public file: {relative}')
            if file.suffix.lower() == '.html':
                parser = References()
                parser.feed(text)
                if '<title' not in text.lower():
                    errors.append(f'Missing page title: {relative}')
                for url in parser.urls:
                    parts = urlsplit(url)
                    if parts.scheme or parts.netloc or not parts.path:
                        continue
                    target = (root / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else (file.parent / unquote(parts.path))
                    target = target.resolve()
                    if not target.exists() and not target.suffix and target.with_suffix('.html').name in PAGES:
                        target = target.with_suffix('.html')
                    if not target.is_relative_to(root):
                        errors.append(f'Link escapes public folder: {relative}')
                    elif not target.exists():
                        errors.append(f'Broken local reference in {relative}: {parts.path}')
    return errors

if __name__ == '__main__':
    problems = validate() + validate_navigation()
    if shutil.which('node'):
        for script in sorted(ROOT.rglob('*.js')):
            result = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
            if result.returncode:
                problems.append(f'JavaScript syntax check failed: {script.relative_to(ROOT)}\n{result.stderr}')
    if problems:
        print('\n'.join(problems), file=sys.stderr)
        sys.exit(1)
    print(f'Website checks passed: {len(PAGES)} pages; local references, public file types, credentials, and JavaScript checked.')
