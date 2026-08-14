begin;

-- Peças de bobina (núcleos, arruelas e bobinas avulsas) são acessórios,
-- não máquinas. Reclassifica as que entraram como COIL.
update catalog.product_model
   set product_type_key='ACCESSORY', updated_at=now()
 where product_type_key='COIL'
   and name ~* 'core|washer|coils';

commit;
