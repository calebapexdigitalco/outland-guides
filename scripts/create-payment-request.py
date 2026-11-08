"""Create a private, fixed-amount booking payment link. Does not email or charge anyone."""
from decimal import Decimal
import argparse
import json
import re
import time
from siteground_connection import php, SITE

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', required=True)
    parser.add_argument('--amount', required=True, help='Agreed amount due now in USD, e.g. 999.50; not the full trip total unless paying in full.')
    parser.add_argument('--expedition', required=True)
    parser.add_argument('--route', default='')
    parser.add_argument('--type', choices=['Deposit','Remaining balance','Full payment'], required=True)
    parser.add_argument('--email', default='')
    parser.add_argument('--valid-days', type=int, default=7)
    args = parser.parse_args()
    if not re.fullmatch(r'\d{1,6}(?:\.\d{1,2})?', args.amount) or not 1 <= args.valid_days <= 90:
        parser.error('Use a positive USD amount with up to two decimals and an expiry of 1–90 days.')
    data = dict(reference=args.reference, amount=int(Decimal(args.amount)*100), expedition=args.expedition,
                route=args.route, payment_type=args.type, email=args.email, expires=int(time.time())+args.valid_days*86400)
    code = f"require '{SITE}/public_html/api/stripe/lib.php'; $c=payment_config(); if(!payments_enabled($c)){{fwrite(STDERR,'Payments not connected.');exit(1);}} $d=json_decode(stream_get_contents(STDIN),true,16,JSON_THROW_ON_ERROR); echo json_encode(create_payment_request(payment_db(),$d,$c['mode']));"
    result = json.loads(php(code, json.dumps(data)))
    print('Private booking payment link (share only with this guest):')
    print(result['url'])
    print('No message was sent and no payment was taken.')

if __name__ == '__main__':
    main()
