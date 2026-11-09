"""Keep the complete footer, including policies, identical on every public page."""
from pathlib import Path
import importlib.util

PROJECT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('navsync',PROJECT/'scripts/sync-account-navigation.py')
sync=importlib.util.module_from_spec(spec);spec.loader.exec_module(sync)

def synchronize(text,footer):
    node=next(n for n in sync.Elements(text).nodes if n['tag']=='footer')
    return text[:node['start']]+footer+text[node['end']:]

if __name__=='__main__':
    footer=(PROJECT/'templates/site-footer.html').read_text(encoding='utf-8').strip()
    for page in (PROJECT/'outputs').glob('*.html'):
        page.write_text(synchronize(page.read_text(encoding='utf-8'),footer),encoding='utf-8')
    print('Full expedition, navigation, contact, payment, and policy footer synchronized across all pages.')
