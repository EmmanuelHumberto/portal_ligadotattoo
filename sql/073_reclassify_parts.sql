begin;

-- Grips e tapes são acessórios, não máquinas.
update catalog.product_model
   set product_type_key='ACCESSORY', updated_at=now()
 where product_type_key='PEN'
   and (name ~* 'grips' or name ~* 'grip (tube|tip|stem|holder|cover|tape|bandage)')
   and name !~* '\ypen\y';

-- Agulhas avulsas (SMP, bar needles) são acessórios, não máquinas.
update catalog.product_model
   set product_type_key='ACCESSORY', updated_at=now()
 where product_type_key='PEN'
   and name ~* 'needles?'
   and name !~* 'kit|machine|\ypen\y|gun|cartridge';

-- Máquinas pen que caíram em acessórios.
update catalog.product_model
   set product_type_key='PEN', updated_at=now()
 where product_type_key='ACCESSORY'
   and name in ('Flite Pen & Battery Bundle','Hawk Pen II');

commit;
