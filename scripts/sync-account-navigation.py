"""Keep the permanent account link in every page, independent of JavaScript."""
from html.parser import HTMLParser
from pathlib import Path
import re

PROJECT=Path(__file__).resolve().parents[1]
TEMPLATE=PROJECT/'templates/account-navigation.html'
VERSION='nav-20261108'
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Elements(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=False);self.nodes=[];self.stack=[]
        self.offsets=[0]
        for line in text.splitlines(keepends=True):self.offsets.append(self.offsets[-1]+len(line))
        self.feed(text)
    def position(self):
        line,col=self.getpos();return self.offsets[line-1]+col
    def handle_starttag(self,tag,attrs):
        node={'tag':tag,'attrs':dict(attrs),'start':self.position(),'open_end':self.position()+len(self.get_starttag_text()),'parents':list(self.stack)}
        self.nodes.append(node)
        if tag not in VOID:self.stack.append(node)
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
    def handle_endtag(self,tag):
        for index in range(len(self.stack)-1,-1,-1):
            if self.stack[index]['tag']==tag:
                self.stack[index]['end']=self.position()+len(tag)+3
                del self.stack[index:];break

def synchronize(text,component):
    nodes=Elements(text).nodes
    account=next((n for n in nodes if n['attrs'].get('id')=='account-navigation'),None)
    if account:
        text=text[:account['start']]+component+text[account['end']:]
    else:
        nav=next(n for n in nodes if n['attrs'].get('id')=='site-nav')
        match=re.search(r'<(a|button)\b[^>]*>\s*(?:Book an Expedition|Start an Inquiry)\s*</\1>',text[nav['start']:nav['end']])
        if not match:raise ValueError('Missing header booking action.')
        start=nav['start']+match.start();book=next(n for n in nodes if n['start']==start)
        parent=book['parents'][-1];header=nav['start']
        # About and FAQ used to place the booking link directly in the header.
        direct_header=parent['parents'][-1]['start']==header
        book_markup=text[book['start']:book['end']]
        if direct_header:
            toggle='<button id="menu-toggle" type="button" class="grid h-11 w-11 place-items-center rounded-full border border-[#44443D]/30 text-obsidian lg:hidden" aria-controls="mobile-menu" aria-expanded="false" aria-label="Open navigation"><i data-lucide="menu" class="h-5 w-5"></i></button>'
            text=text[:book['start']]+'<div class="nav-actions">'+component+book_markup+toggle+'</div>'+text[book['end']:]
        else:
            opening=text[parent['start']:parent['open_end']]
            if 'nav-actions' not in parent['attrs'].get('class','').split():opening=opening.replace('class="','class="nav-actions ',1)
            text=text[:parent['start']]+opening+text[parent['open_end']:book['start']]+component+text[book['start']:]
    # Make the primary booking action visible before the page scripts run too.
    nodes=Elements(text).nodes
    nav=next(n for n in nodes if n['attrs'].get('id')=='site-nav')
    actions=next(n for n in nodes if 'nav-actions' in n['attrs'].get('class','').split() and nav in n['parents'])
    book=next(n for n in nodes if n['tag'] in {'a','button'} and actions in n['parents'] and 'bg-summit' in n['attrs'].get('class','').split())
    opening=text[book['start']:book['open_end']]
    classes=[c for c in book['attrs']['class'].split() if c not in {'hidden','sm:block'}]
    if 'mobile-book-cta' not in classes:classes.append('mobile-book-cta')
    opening=re.sub(r'class="[^"]*"','class="'+' '.join(classes)+'"',opening,count=1)
    text=text[:book['start']]+opening+text[book['open_end']:]
    assets=f'<link rel="stylesheet" href="/assets/account-navigation.css?v={VERSION}" />\n<script defer src="/assets/account-navigation.js?v={VERSION}"></script>'
    text=re.sub(r'<link\b[^>]*href="/assets/account-navigation\.css[^" ]*"[^>]*>\s*','',text)
    text=re.sub(r'<script\b[^>]*src="/assets/account-navigation\.js[^" ]*"[^>]*></script>\s*','',text)
    return text.replace('</head>',assets+'\n</head>',1)

def main():
    component=TEMPLATE.read_text(encoding='utf-8').strip()
    for path in sorted((PROJECT/'outputs').glob('*.html')):
        path.write_text(synchronize(path.read_text(encoding='utf-8'),component),encoding='utf-8')
    print('Permanent My Trips navigation synchronized across all ten pages.')

if __name__=='__main__':main()
