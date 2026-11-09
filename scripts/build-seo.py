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
        s=re.sub(r'<link\b(?=[^>]*rel=["\'](?:icon|shortcut icon|apple-touch-icon)["\'])[^>]*>','',s,flags=re.I)
        s=re.sub(r'<meta\b(?=[^>]*name=["\']theme-color["\'])[^>]*>','',s,flags=re.I)
        s=re.sub(r'<script\b[^>]*id="outland-structured-data"[^>]*>.*?</script>','',s,flags=re.S)
        url=SITE+('/' if slug=='index' else '/'+slug)
        robots='noindex,follow' if slug in {'account','payments'} else 'index,follow,max-image-preview:large'
        image=SITE+'/assets/share-'+({'kilimanjaro':'kilimanjaro','volcan-de-fuego':'fuego','safari':'safari'}.get(slug,'outland'))+'-v1.jpg'
        share_title='Outland Guides | Global summits. Local legends.' if slug=='index' else title
        image_alt='Outland Guides — '+({'kilimanjaro':'Your route. Africa’s roof.','volcan-de-fuego':'After dark. Above it all.','safari':'The wild. With local eyes.'}.get(slug,'Global summits. Local legends.'))
        tags='\n<meta name="description" content="'+escape(description,quote=True)+'"/>\n<meta name="robots" content="'+robots+'"/>\n<link rel="canonical" href="'+url+'"/>\n'
        for prop,value in {'og:type':'website','og:locale':'en_US','og:site_name':'Outland Guides','og:title':share_title,'og:description':description,'og:url':url,'og:image':image,'og:image:secure_url':image,'og:image:type':'image/jpeg','og:image:width':'1200','og:image:height':'630','og:image:alt':image_alt}.items():tags+='<meta property="'+prop+'" content="'+escape(value,quote=True)+'"/>\n'
        for name,value in {'twitter:card':'summary_large_image','twitter:title':share_title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':image_alt}.items():tags+='<meta name="'+name+'" content="'+escape(value,quote=True)+'"/>\n'
        tags+='<link rel="icon" href="/favicon.ico?v=arrow-transparent-2" sizes="16x16 32x32 48x48 64x64"/>\n<link rel="icon" type="image/png" sizes="32x32" href="/assets/outland-arrow-32.png?v=transparent-2"/>\n<link rel="icon" type="image/png" sizes="192x192" href="/assets/outland-arrow-192.png?v=transparent-2"/>\n<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=arrow-1"/>\n<meta name="theme-color" content="#A65B2A"/>\n'
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
