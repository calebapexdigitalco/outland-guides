"""Upload only outputs/ over pinned-host SFTP, then verify the public release."""
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
import json
import os
import re
import subprocess
import sys
import time
import importlib.util

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / 'outputs'
PUBLIC_URL = 'https://outlandguides.com'
REQUIRED = ('SITEGROUND_HOST', 'SITEGROUND_USER', 'SITEGROUND_PORT', 'SITEGROUND_PATH',
            'SITEGROUND_SSH_KEY', 'SITEGROUND_KNOWN_HOSTS')

def validate_settings(settings):
    missing = [name for name in REQUIRED if not settings.get(name, '').strip()]
    if missing:
        raise ValueError('Missing GitHub Actions secrets: ' + ', '.join(missing))
    host, user, port = (settings[name].strip() for name in REQUIRED[:3])
    destination = settings['SITEGROUND_PATH'].strip().rstrip('/')
    if not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?', host):
        raise ValueError('Invalid SiteGround SSH host.')
    if not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]*', user):
        raise ValueError('Invalid SiteGround SSH username.')
    if not port.isdecimal() or not 1 <= int(port) <= 65535:
        raise ValueError('Invalid SiteGround SSH port.')
    if not re.fullmatch(r'/home/(?:customer|[A-Za-z0-9_.-]+)/www/outlandguides\.com/public_html', destination):
        raise ValueError('Deployment path must be the Outland Guides public_html folder, not an account root or another site.')
    if 'PRIVATE KEY-----' not in settings['SITEGROUND_SSH_KEY']:
        raise ValueError('The SiteGround deployment private key is incomplete.')
    return host, user, port, destination

def quote(value):
    value = str(value)
    if '\n' in value or '\r' in value:
        raise ValueError('Newlines are not allowed in deployment paths.')
    return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'

def main():
    settings = {name: os.environ.get(name, '') for name in REQUIRED}
    host, user, port, destination = validate_settings(settings)
    release = os.environ.get('GITHUB_SHA', '')
    if not re.fullmatch(r'[0-9a-f]{40}', release):
        raise ValueError('A GitHub commit is required. Run this from the repository Actions workflow.')
    spec = importlib.util.spec_from_file_location('check_site', PROJECT / 'scripts/check-site.py')
    checker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(checker)
    problems = checker.validate(ROOT)
    if problems:
        raise ValueError('\n'.join(problems))
    files = sorted((p for p in ROOT.rglob('*') if p.is_file()),
                   key=lambda p: (p.name == '.htaccess', p.suffix.lower() == '.html', p.name == 'index.html', p.as_posix()))
    with TemporaryDirectory(prefix='outland-deploy-') as temporary:
        temporary = Path(temporary)
        key, known = temporary / 'key', temporary / 'known_hosts'
        key.write_text(settings['SITEGROUND_SSH_KEY'].strip() + '\n', encoding='utf-8')
        known.write_text(settings['SITEGROUND_KNOWN_HOSTS'].strip() + '\n', encoding='utf-8')
        key.chmod(0o600)
        known.chmod(0o600)
        marker = temporary / 'deployment.json'
        marker.write_text(json.dumps({'commit': release, 'deployed_at': datetime.now(timezone.utc).isoformat(),
                                     'files': len(files)}), encoding='utf-8')
        commands = ['cd ' + quote(destination)]
        directories = sorted({p.parent.relative_to(ROOT).as_posix() for p in files if p.parent != ROOT},
                             key=lambda p: (p.count('/'), p))
        for directory in directories:
            # A leading minus only ignores "already exists"; put/rename errors still abort.
            commands.append('-mkdir ' + quote(directory))
        commands.append('-mkdir "assets"')
        for file in files:
            target = file.relative_to(ROOT).as_posix()
            upload = target + '.outland-upload-' + release[:12]
            commands.extend(['put ' + quote(file.as_posix()) + ' ' + quote(upload),
                             'rename ' + quote(upload) + ' ' + quote(target)])
        marker_upload = 'assets/deployment.json.outland-upload-' + release[:12]
        commands.extend(['put ' + quote(marker.as_posix()) + ' ' + quote(marker_upload),
                         'rename ' + quote(marker_upload) + ' "assets/deployment.json"', 'bye'])
        command = ['sftp', '-P', port, '-i', str(key), '-o', 'BatchMode=yes',
                   '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                   '-o', 'UserKnownHostsFile=' + str(known), '-o', 'ConnectTimeout=30',
                   '-b', '-', user + '@' + host]
        print(f'Uploading {len(files)} website files to Outland Guides. Existing server-only files are preserved.', flush=True)
        result = subprocess.run(command, input='\n'.join(commands) + '\n', capture_output=True, text=True, timeout=900)
        if result.returncode:
            diagnostic = (result.stderr or result.stdout).strip()[-1800:]
            raise RuntimeError('SiteGround upload failed. ' + diagnostic)
    verified = False
    for attempt in range(6):
        try:
            request = Request(PUBLIC_URL + '/assets/deployment.json?release=' + release,
                              headers={'Cache-Control': 'no-cache', 'User-Agent': 'Outland-Deployment-Check'})
            with urlopen(request, timeout=30) as response:
                verified = json.load(response).get('commit') == release
            if verified:
                break
        except Exception:
            pass
        time.sleep(5)
    if not verified:
        raise RuntimeError('Upload finished, but the public release could not be confirmed. Check SiteGround cache and domain routing before retrying.')
    request = Request(PUBLIC_URL + '/?release=' + release, headers={'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=30) as response:
        if response.status != 200 or b'Outland Guides' not in response.read():
            raise RuntimeError('The published homepage could not be confirmed.')
    print('Published and verified https://outlandguides.com — commit ' + release[:12])
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
            summary.write(f'### Published Outland Guides\n\nCommit `{release}` is live at {PUBLIC_URL}.\n\nUploaded {len(files)} website files.\n')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
