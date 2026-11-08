"""Private local SSH connection; never reads or prints the deployment key."""
from pathlib import Path
import os
import subprocess

SITE = '/home/customer/www/outlandguides.com'
PRIVATE = SITE + '/private/outland-payments'

def remote(command, body=None, timeout=60):
    directory = Path(os.environ['LOCALAPPDATA']) / 'OutlandGuides' / 'deployment'
    ssh = Path('C:/Program Files/Git/usr/bin/ssh.exe')
    args = [str(ssh), '-p', '18765', '-i', (directory / 'siteground_github_ed25519').as_posix(),
            '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
            '-o', 'UserKnownHostsFile=' + (directory / 'siteground_known_hosts').as_posix(),
            '-o', 'ConnectTimeout=20', 'u3109-otosy1svrp7w@ssh.outlandguides.com', command]
    return subprocess.run(args, input=body, capture_output=True, text=True, timeout=timeout)

def php(code, body=None):
    # PHP source is supplied by this repository, never by an HTTP guest.
    import shlex
    result = remote('php -r ' + shlex.quote(code), body)
    if result.returncode:
        raise RuntimeError('The server could not complete the payment configuration. No private details were printed.')
    return result.stdout
