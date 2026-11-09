"""Write canonical metadata and a sitemap for the public, clean-address pages."""
from pathlib import Path
from html import escape
import json,re
from xml.etree.ElementTree import Element, SubElement, ElementTree, register_namespace

ROOT=Path(__file__).resolve().parents[1]/'outputs'
SITE='https://outlandguides.com'
META={
 'index':('Outland Guides | Kilimanjaro, Fuego & Tanzania Safaris','Plan Kilimanjaro climbs, Acatenango and Fuego treks, and Tanzania safaris with vetted local teams and one-on-one preparation from Outland Guides.'),
 'kilimanjaro':('Kilimanjaro Routes & Group Prices | Outland Guides','Compare six Kilimanjaro itineraries: Machame and Lemosho 6 or 7 days, Marangu 5 or 6 days. Explore routes, gear, group prices and local guide support.'),
 'volcan-de-fuego':('Acatenango & Volcán de Fuego Trek | Outland Guides','Plan a 2-day Acatenango overnight with Fuego views and an optional night trek. Compare shared and private cabins, gear, itinerary and confirmed dates.'),
 'safari':('Tanzania Wildlife Safaris: 3 & 4 Days | Outland Guides','Explore 3-day Ngorongoro and 4-day Serengeti safari options with a private 4×4 and local guide. Compare group prices or add a safari to Kilimanjaro.'),
 'about':('About Outland Guides | Caleb Bennett & Adam Dimmitt','Meet Caleb Bennett and Adam Dimmitt, the people behind Outland Guides. Learn how local partnerships and personal preparation shape your expedition.'),
 'contact':('Contact Outland Guides | Free Trip Planning Consultation','Talk with Outland Guides about Kilimanjaro, Fuego or a Tanzania safari. Share your travel window and group size for a personal trip-planning consultation.'),
 'gear-help':('Kilimanjaro, Fuego & Safari Gear Help | Outland Guides','Find trip-specific packing guidance for Kilimanjaro, Fuego and Tanzania safaris. Learn what to bring, what is provided and how to request a gear review.'),
 'faq':('Expedition Costs, Booking & Travel FAQs | Outland Guides','Get answers about Outland Guides trips, route choices, preparation, group pricing, insurance and cancellation terms before planning your expedition.'),
 'privacy-terms':('Privacy, Booking Terms & Refund Policy | Outland Guides','Read how Outland Guides handles personal information, local operator responsibilities, deposits, cancellations, refunds and expedition participation.'),
 'account':('My Trips & Account Sign-In | Outland Guides','Sign in to your Outland Guides account to view requested and confirmed trips, messages, preparation details and booking payments.'),
 'payments':('Trip Estimates & Confirmed Booking Payments | Outland Guides','Review your group trip estimate or manage payments for an Outland Guides booking. Dates and payment terms are confirmed before secure Stripe checkout.'),
}

def main():
    for slug,(title,description) in META.items():
        page=ROOT/(slug+'.html');s=page.read_text(encoding='utf-8')
        s=re.sub(r'<title>.*?</title>','<title>'+escape(title)+'</title>',s,flags=re.S|re.I)
        s=re.sub(r'<meta\b(?=[^>]*(?:name=["\'](?:description|robots|twitter:[^"\']+)["\']|property=["\']og:[^"\']+["\']))[^>]*>','',s,flags=re.I)
        s=re.sub(r'<link\b(?=[^>]*rel=["\']canonical["\'])[^>]*>','',s,flags=re.I)
        s=re.sub(r'<script\b[^>]*id="outland-structured-data"[^>]*>.*?</script>','',s,flags=re.S)
        url=SITE+('/' if slug=='index' else '/'+slug)
        robots='noindex,follow' if slug in {'account','payments'} else 'index,follow,max-image-preview:large'
        image=SITE+'/assets/'+('kilimanjaro-expedition.png' if slug=='kilimanjaro' else 'volcan-de-fuego-cone-eruption.png' if slug=='volcan-de-fuego' else 'wildlife-safari-expedition.png' if slug=='safari' else 'outland-guides-text-only.png')
        tags='\n<meta name="description" content="'+escape(description,quote=True)+'"/>\n<meta name="robots" content="'+robots+'"/>\n<link rel="canonical" href="'+url+'"/>\n'
        for prop,value in {'og:type':'website','og:site_name':'Outland Guides','og:title':title,'og:description':description,'og:url':url,'og:image':image}.items():tags+='<meta property="'+prop+'" content="'+escape(value,quote=True)+'"/>\n'
        tags+='<meta name="twitter:card" content="summary_large_image"/>\n'
        if slug not in {'account','payments'}:
            data={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':SITE+'/#organization','name':'Outland Guides','url':SITE+'/','logo':SITE+'/assets/outland-guides-text-only.png','email':'info@outlandguides.com','telephone':'+1-765-479-5280','sameAs':['https://www.facebook.com/outlandguides','https://www.instagram.com/outlandguides']},{'@type':'WebSite','@id':SITE+'/#website','name':'Outland Guides','url':SITE+'/','publisher':{'@id':SITE+'/#organization'}},{'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':description,'isPartOf':{'@id':SITE+'/#website'}}]}
            tags+='<script id="outland-structured-data" type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>\n'
        s=s.replace('</head>',tags+'</head>');s=re.sub(r'[ \t]+\n','\n',s);page.write_text(s,encoding='utf-8')
    ns='http://www.sitemaps.org/schemas/sitemap/0.9';register_namespace('',ns);root=Element('{'+ns+'}urlset')
    for slug in META:
        if slug in {'account','payments'}:continue
        node=SubElement(root,'{'+ns+'}url');SubElement(node,'{'+ns+'}loc').text=SITE+('/' if slug=='index' else '/'+slug)
        SubElement(node,'{'+ns+'}lastmod').text='2026-11-09'
    ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    (ROOT/'robots.txt').write_text('User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: '+SITE+'/sitemap.xml\n',encoding='utf-8')
    print('Unique metadata for 11 pages; sitemap includes 9 public pages. Account and payments are noindex.')

if __name__=='__main__':main()
