-- Wormhole é revenda/white-label, não fabricante de máquinas.
-- Remove as máquinas (PEN/ROTARY/COIL) do catálogo técnico de máquinas,
-- mantendo acessórios, baterias, cartuchos, tintas e fontes da marca.
-- A marca continua listada em /marcas; não possui ofertas.
update catalog.product_model
   set lifecycle='UNKNOWN', updated_at=now(), version=version+1
 where manufacturer_id=(select id from catalog.manufacturer where slug='wormhole')
   and product_type_key in ('PEN','ROTARY','COIL');
