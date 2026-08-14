begin;

-- Reclassifica o catálogo já importado:
-- 1) Tintas por padrão de nome (ink, tinta, pigment, colour/color, grey wash).
update catalog.product_model
   set product_type_key='INK', updated_at=now()
 where product_type_key='ACCESSORY'
   and (
     name ~* '\yink\y'
     or name ~* 'tinta|pigment|colour|color|greywash|graywash|grey wash|gray wash'
   )
   and name !~* 'cup|cap|grip|cartridge|needle|cable|rca|machine|rotary|wireless|aftercare|hygiene';

-- 2) Tintas sem palavra-chave no nome (conjuntos e marcas de tinta).
update catalog.product_model
   set product_type_key='INK', updated_at=now()
 where product_type_key='ACCESSORY'
   and name in (
     'Eternal','Intenze','Gold Label','Myke Chambers','Nocturnal By Bishop',
     'Scar Camouflage','Kuro Sumi Lining Black','Liz Cook Portrait Series',
     'Maks Kornev Sets','Master Mike Asian Set','Oleg Shepelenko Set',
     'Sarah Miller&#039;s Valhalla Portrait Set','Silvano Fiato Black Set',
     'Yomico Moreno Artistic Basic Set','Yomico Moreno Renaissance Set',
     'M Series','Muted Earth Tones'
   );

-- 3) Máquinas e kits que caíram na categoria de acessórios.
update catalog.product_model
   set product_type_key='PEN', updated_at=now()
 where product_type_key='ACCESSORY'
   and name in (
     'Cobra','Cobra Configurator',
     'Dragonfly X2','Dragonfly X2 Configurator',
     'Scorpion X2','Scorpion X2 Configurator',
     'Stingray X2','Stingray X2 Configurator',
     'TPS 500 X2','Tps 500 X2 Configurator',
     'Wormhole Pro Rossa','PMU Master','Pmu Master Configurator',
     'Artis Wirelss Battery Tattoo Power Pen II. Battery is Removable.',
     'New Rechargeable Wireless Pen High Capacity Battery Digital Tattoo Gun',
     'E96 Adjustable Wireless Tattoo Kit'
   );

-- 4) Power pack da Cobra é fonte/alimentação, não acessório.
update catalog.product_model
   set product_type_key='POWER_SUPPLY', updated_at=now()
 where product_type_key='ACCESSORY'
   and name = 'Powerpack For Cobra';

commit;
