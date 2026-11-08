<?php
declare(strict_types=1);

// Customer prices supplied by Outland Guides. Public charging requires explicit activation.
function expedition_catalog(): array {
    return [
        'machame-6' => ['name'=>'Mount Kilimanjaro','option'=>'Machame 6-Day','days'=>6,'kind'=>'mountain','tiers'=>[2=>199900,3=>197900,4=>194900,5=>179900,6=>169900]],
        'machame-7' => ['name'=>'Mount Kilimanjaro','option'=>'Machame 7-Day','days'=>7,'kind'=>'mountain','tiers'=>[2=>219900,3=>217900,4=>214900,5=>199900,6=>189900]],
        'lemosho-6' => ['name'=>'Mount Kilimanjaro','option'=>'Lemosho 6-Day','days'=>6,'kind'=>'mountain','tiers'=>[2=>204900,3=>202900,4=>199900,5=>184900,6=>174900]],
        'lemosho-7' => ['name'=>'Mount Kilimanjaro','option'=>'Lemosho 7-Day','days'=>7,'kind'=>'mountain','tiers'=>[2=>224900,3=>222900,4=>219900,5=>204900,6=>194900]],
        'fuego-shared' => ['name'=>'Volcán de Fuego','option'=>'Shared five-person cabin','days'=>2,'kind'=>'volcano','min_travelers'=>1,'max_travelers'=>5,'tiers'=>[1=>20000]],
        'fuego-private' => ['name'=>'Volcán de Fuego','option'=>'Private two-person cabin','days'=>2,'kind'=>'private-cabin','min_travelers'=>2,'max_travelers'=>2,'tiers'=>[1=>49900]],
        'safari-3' => ['name'=>'Wildlife Safari','option'=>'3-Day Ngorongoro Safari','days'=>3,'kind'=>'safari','tiers'=>[2=>134900,3=>119900,5=>109900]],
        'safari-4' => ['name'=>'Wildlife Safari','option'=>'4-Day Serengeti Safari','days'=>4,'kind'=>'safari','tiers'=>[2=>209900,3=>199900,5=>179900]],
    ];
}
function group_price(array $tiers, int $travelers): int {
    $price = null;
    foreach ($tiers as $minimum => $amount) if ($travelers >= $minimum) $price = $amount;
    if ($price === null) throw new InvalidArgumentException('Solo trips need a personal quote. Contact Outland Guides for pricing.');
    return $price;
}
function quote_expedition(array $input): array {
    $catalog = expedition_catalog();
    $id = $input['option_id'] ?? '';
    if (!is_string($id) || !isset($catalog[$id])) throw new InvalidArgumentException('Choose a currently bookable expedition option.');
    $count = $input['travelers'] ?? null;
    if (!is_int($count) || $count < 1 || $count > 20) throw new InvalidArgumentException('Choose 1–20 travelers for an online quote. Other group sizes need a personal consultation.');
    $trip = $catalog[$id];
    if (in_array($trip['kind'],['volcano','private-cabin'],true) && $count>15) throw new InvalidArgumentException('Volcán de Fuego trips are limited to 15 travelers.');
    if ($id==='fuego-shared' && $count>5) throw new InvalidArgumentException('A shared five-person cabin booking must have 1–5 travelers. Contact us to arrange multiple cabins.');
    if ($trip['kind']==='mountain' || $trip['kind']==='safari') { if ($count<2) throw new InvalidArgumentException('Kilimanjaro and Safari bookings require at least two travelers.'); }
    if ($trip['kind']==='private-cabin') { if($count!==2) throw new InvalidArgumentException('A private cabin booking covers exactly two travelers.'); }
    $lines = [['label'=>$trip['name'].' · '.$trip['option'],'unit_amount'=>group_price($trip['tiers'],$count),'quantity'=>$trip['kind']==='private-cabin'?1:$count]];
    $addon = $input['safari_addon'] ?? '';
    if (!is_string($addon) || !in_array($addon,['','safari-3','safari-4'],true)) throw new InvalidArgumentException('Choose a valid safari add-on.');
    if ($addon !== '') {
        if ($trip['kind'] !== 'mountain') throw new InvalidArgumentException('Safari add-ons are available with Kilimanjaro bookings.');
        $safari = $catalog[$addon];
        $lines[] = ['label'=>$safari['option'].' add-on','unit_amount'=>group_price($safari['tiers'],$count),'quantity'=>$count];
    }
    $nights = $input['lodging_nights'] ?? 0;
    if (!is_int($nights) || !in_array($nights,[0,1,2],true)) throw new InvalidArgumentException('Choose zero, one, or two additional lodging nights.');
    if ($nights && in_array($trip['kind'],['volcano','private-cabin'],true)) throw new InvalidArgumentException('Fuego cabin pricing includes one night. Extra Tanzania lodging does not apply.');
    if ($nights) $lines[] = ['label'=>$nights.' additional lodging night'.($nights===1?'':'s'),
        'unit_amount'=>group_price($nights===1?[2=>4000,3=>3000,5=>2000]:[2=>7000,3=>5000,5=>3000],$count),'quantity'=>$count];
    $total = array_sum(array_map(fn($line)=>$line['unit_amount']*$line['quantity'],$lines));
    return ['option_id'=>$id,'expedition'=>$trip['name'],'option'=>$trip['option'],'travelers'=>$count,
        'safari_addon'=>$addon,'lodging_nights'=>$nights,'currency'=>'usd','lines'=>$lines,
        'total_amount'=>$total,'deposit_amount'=>intdiv($total+1,2),'price_version'=>'outland-2026-11-v1'];
}
function booking_payment_amount(int $total, int $received, int $refunded, string $type): int {
    if ($total < 50 || $received < 0 || $refunded < 0 || $refunded > $received) throw new InvalidArgumentException('This booking needs a payment review.');
    $net = $received-$refunded;
    $balance = max(0,$total-$net);
    if (!$balance) throw new InvalidArgumentException('This booking has no remaining balance.');
    return match ($type) {
        'deposit' => $net < intdiv($total+1,2) ? min($balance,intdiv($total+1,2)-$net) : throw new InvalidArgumentException('Your deposit is already covered. Choose the remaining balance.'),
        'balance' => $net > 0 ? $balance : throw new InvalidArgumentException('Choose a deposit or full payment for your first payment.'),
        'full' => $net === 0 ? $balance : throw new InvalidArgumentException('Choose the remaining balance for a booking with previous payments.'),
        default => throw new InvalidArgumentException('Choose deposit, remaining balance, or full payment.'),
    };
}
