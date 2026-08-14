begin;

-- Separa os tipos de máquina: bobina (coil) e rotativa (rotary) saem do PEN genérico.
update catalog.product_model
   set product_type_key='COIL', updated_at=now()
 where product_type_key='PEN'
   and name ~* '\ycoil\y';

update catalog.product_model
   set product_type_key='ROTARY', updated_at=now()
 where product_type_key='PEN'
   and name ~* 'rotary';

commit;
