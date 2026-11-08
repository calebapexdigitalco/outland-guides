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
         'kilimanjaro.html', 'safari.html', 'volcan-de-fuego.html', 'payments.html'}
EXTENSIONS = {'.html', '.css', '.js', '.json', '.xml', '.txt', '.jpg', '.jpeg',
              '.png', '.svg', '.webm', '.mp4', '.woff', '.woff2', '.ico', '.avif', '.webp'}
SECRET = re.compile(r'(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----')

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'src', 'href', 'poster'} and value:
                self.urls.append(value)

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
        payment_backend = relative.as_posix() in {'api/stripe/index.php', 'api/stripe/lib.php'}
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
    problems = validate()
    if shutil.which('node'):
        for script in sorted(ROOT.rglob('*.js')):
            result = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
            if result.returncode:
                problems.append(f'JavaScript syntax check failed: {script.relative_to(ROOT)}\n{result.stderr}')
    if problems:
        print('\n'.join(problems), file=sys.stderr)
        sys.exit(1)
    print(f'Website checks passed: {len(PAGES)} pages; local references, public file types, credentials, and JavaScript checked.')
