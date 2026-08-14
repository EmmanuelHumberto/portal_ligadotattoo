begin;

insert into catalog.manufacturer(id,name,normalized_name,slug,official_website,country_code,status,version) values
 ('4f0bf59c-fd5b-5b86-8ea8-f0fe49eafa14','Cheyenne','cheyenne','cheyenne','https://cheyennetattoo.com/','DE','ACTIVE',1),
 ('652871e5-2955-5304-b123-2805b47ac824','Bishop Rotary','bishop rotary','bishop-rotary','https://bishoprotary.com/','US','ACTIVE',1),
 ('9be71e84-9a60-594c-b0ec-60058c5ab1a2','FK Irons','fk irons','fk-irons','https://www.fkirons.com/','US','ACTIVE',1),
 ('62e96897-76c9-58a1-a210-d44bdd35b538','Dragonhawk','dragonhawk','dragonhawk','https://www.dragonhawktattoos.com/','CN','ACTIVE',1),
 ('f1f3f9d7-791e-5c69-b17f-29471798ff22','Mast Tattoo','mast tattoo','mast-tattoo','https://www.masttattoo.com/','CN','ACTIVE',1),
 ('a63257fe-b0f3-5402-a6a3-ae72511d9490','Inkjecta','inkjecta','inkjecta','https://www.inkjecta.com/','AU','ACTIVE',1),
 ('df2981a8-15c1-5747-9414-805a5eead1d1','Stigma Rotary','stigma rotary','stigma-rotary','https://www.stigmarotary.com/','GB','ACTIVE',1),
 ('f18f28c6-c92f-5930-aae1-04d28d73f088','Critical Tattoo','critical tattoo','critical-tattoo','https://criticaltattoo.com/','US','ACTIVE',1),
 ('7a4642ef-d7e8-5040-82ba-91b724152b8c','Kwadron','kwadron','kwadron','https://www.kwadron.pl/','PL','ACTIVE',1),
 ('ad7fb0c4-ed77-5a30-afa6-22fe5424d2e0','Equaliser','equaliser','equaliser','https://www.equaliser.com/','US','ACTIVE',1)
on conflict (id) do nothing;

insert into catalog.brand(id,manufacturer_id,name,slug) values
 ('a9d504a1-68a3-5fd8-bfa5-4520c5a67d63','4f0bf59c-fd5b-5b86-8ea8-f0fe49eafa14','Cheyenne','cheyenne-brand'),
 ('479498e1-96ff-5f50-92ae-9e1c5eb5ad45','652871e5-2955-5304-b123-2805b47ac824','Bishop Rotary','bishop-rotary-brand'),
 ('61724e9f-39f3-5c13-92b7-07341df9ced8','9be71e84-9a60-594c-b0ec-60058c5ab1a2','FK Irons','fk-irons-brand'),
 ('2f1a96ab-336c-5c68-824c-7fe253985f63','62e96897-76c9-58a1-a210-d44bdd35b538','Dragonhawk','dragonhawk-brand'),
 ('8a0f5ddc-47b0-5851-b5f6-676034095b20','f1f3f9d7-791e-5c69-b17f-29471798ff22','Mast Tattoo','mast-tattoo-brand'),
 ('6f1262d8-838d-5287-8645-ad1de00de9b5','a63257fe-b0f3-5402-a6a3-ae72511d9490','Inkjecta','inkjecta-brand'),
 ('f52cf74d-af27-5d12-98da-51352ea9f0ef','df2981a8-15c1-5747-9414-805a5eead1d1','Stigma Rotary','stigma-rotary-brand'),
 ('fb1368a9-9059-58d0-b87a-be72987dd72d','f18f28c6-c92f-5930-aae1-04d28d73f088','Critical Tattoo','critical-tattoo-brand'),
 ('30cd0121-38de-5fbe-9195-e720a01b9ff6','7a4642ef-d7e8-5040-82ba-91b724152b8c','Kwadron','kwadron-brand'),
 ('023ec065-cff5-548f-afad-dd675d373700','ad7fb0c4-ed77-5a30-afa6-22fe5424d2e0','Equaliser','equaliser-brand')
on conflict (id) do nothing;

insert into catalog.product_model(id,manufacturer_id,brand_id,product_type_key,name,normalized_name,slug,model_code,lifecycle,version) values
 ('a2818c53-4337-58c4-ab0f-268cbc0d3257','4f0bf59c-fd5b-5b86-8ea8-f0fe49eafa14','a9d504a1-68a3-5fd8-bfa5-4520c5a67d63','PEN','SOL Nova Unlimited','sol nova unlimited','sol-nova-unlimited','SOL-NOVA-UNLIMITED','ACTIVE',1),
 ('336d81e8-8bd6-5fb5-a9cf-9e736b13d14f','4f0bf59c-fd5b-5b86-8ea8-f0fe49eafa14','a9d504a1-68a3-5fd8-bfa5-4520c5a67d63','PEN','HAWK Pen','hawk pen','hawk-pen','HAWK-PEN','ACTIVE',1),
 ('2a9f9a38-2468-52bd-a22a-73b7d4fd4522','4f0bf59c-fd5b-5b86-8ea8-f0fe49eafa14','a9d504a1-68a3-5fd8-bfa5-4520c5a67d63','PEN','HAWK Thunder','hawk thunder','hawk-thunder','HAWK-THUNDER','ACTIVE',1),
 ('0f69ff72-f58c-5fe5-96b1-43269bfff944','652871e5-2955-5304-b123-2805b47ac824','479498e1-96ff-5f50-92ae-9e1c5eb5ad45','PEN','Bishop Power Wand Packer','bishop power wand packer','bishop-power-wand-packer','POWER-WAND-PACKER','ACTIVE',1),
 ('86e94463-e84c-5424-a419-cbaecdee0dfb','652871e5-2955-5304-b123-2805b47ac824','479498e1-96ff-5f50-92ae-9e1c5eb5ad45','PEN','Bishop Power Wand Shader','bishop power wand shader','bishop-power-wand-shader','POWER-WAND-SHADER','ACTIVE',1),
 ('d3fedba0-c5b6-59e8-aca3-970d4c7a674b','652871e5-2955-5304-b123-2805b47ac824','479498e1-96ff-5f50-92ae-9e1c5eb5ad45','PEN','Bishop Microangelo','bishop microangelo','bishop-microangelo','MICROANGELO','ACTIVE',1),
 ('e4d37828-e80d-5442-a7fe-edcf177a0329','9be71e84-9a60-594c-b0ec-60058c5ab1a2','61724e9f-39f3-5c13-92b7-07341df9ced8','PEN','Spektra Flux','spektra flux','spektra-flux','SPEKTRA-FLUX','ACTIVE',1),
 ('cc68e74f-578d-596d-82f3-cd742ab07e58','9be71e84-9a60-594c-b0ec-60058c5ab1a2','61724e9f-39f3-5c13-92b7-07341df9ced8','PEN','Spektra Xion','spektra xion','spektra-xion','SPEKTRA-XION','ACTIVE',1),
 ('47804996-1d20-535f-afa2-b14e05a26326','9be71e84-9a60-594c-b0ec-60058c5ab1a2','61724e9f-39f3-5c13-92b7-07341df9ced8','PEN','EXO','exo','exo','EXO','ACTIVE',1),
 ('e673326e-cc0f-5d5c-ac9e-f0647216a770','62e96897-76c9-58a1-a210-d44bdd35b538','2f1a96ab-336c-5c68-824c-7fe253985f63','PEN','Mast Tour','mast tour','mast-tour','MAST-TOUR','ACTIVE',1),
 ('3af9a530-0b1b-5499-abcd-e3b4d1727aeb','62e96897-76c9-58a1-a210-d44bdd35b538','2f1a96ab-336c-5c68-824c-7fe253985f63','PEN','Mast Archer','mast archer','mast-archer','MAST-ARCHER','ACTIVE',1),
 ('2b34af9b-a73d-547f-9f68-fae7bcb53223','62e96897-76c9-58a1-a210-d44bdd35b538','2f1a96ab-336c-5c68-824c-7fe253985f63','PEN','Mast Flip','mast flip','mast-flip','MAST-FLIP','ACTIVE',1),
 ('ce8f3005-5271-5211-b7f7-391ef551a975','f1f3f9d7-791e-5c69-b17f-29471798ff22','8a0f5ddc-47b0-5851-b5f6-676034095b20','PEN','Mast Fold Pro','mast fold pro','mast-fold-pro','MAST-FOLD-PRO','ACTIVE',1),
 ('01a01adb-9602-5b1f-b351-28b086064668','a63257fe-b0f3-5402-a6a3-ae72511d9490','6f1262d8-838d-5287-8645-ad1de00de9b5','PEN','Flite Nano','flite nano','flite-nano','FLITE-NANO','ACTIVE',1),
 ('58122931-06a1-59fe-8ea1-b8b3a1926097','a63257fe-b0f3-5402-a6a3-ae72511d9490','6f1262d8-838d-5287-8645-ad1de00de9b5','PEN','Flite Nano Elite','flite nano elite','flite-nano-elite','FLITE-NANO-ELITE','ACTIVE',1),
 ('c8138a63-3d61-5465-951b-73f188effe16','df2981a8-15c1-5747-9414-805a5eead1d1','f52cf74d-af27-5d12-98da-51352ea9f0ef','PEN','Stigma V2','stigma v2','stigma-v2','STIGMA-V2','ACTIVE',1),
 ('d2827d19-8508-559d-889a-9c221fb84035','f18f28c6-c92f-5930-aae1-04d28d73f088','fb1368a9-9059-58d0-b87a-be72987dd72d','PEN','Critical Torque','critical torque','critical-torque','CRITICAL-TORQUE','ACTIVE',1),
 ('bdc77235-d3ae-555e-b08a-83758b3b2d7c','7a4642ef-d7e8-5040-82ba-91b724152b8c','30cd0121-38de-5fbe-9195-e720a01b9ff6','PEN','Kwadron Equalizer','kwadron equalizer','kwadron-equalizer','KWADRON-EQUALIZER','ACTIVE',1),
 ('904acaaf-45c4-55e5-80d9-c4574dc7ec43','ad7fb0c4-ed77-5a30-afa6-22fe5424d2e0','023ec065-cff5-548f-afad-dd675d373700','PEN','Equaliser Proton','equaliser proton','equaliser-proton','EQUALISER-PROTON','ACTIVE',1)
on conflict (id) do nothing;

insert into commerce.seller(id,name,slug,website_url,status,public_freshness_interval) values
 ('99613120-63a3-5eee-8d21-0a7ea2d3f52c','Cheyenne','cheyenne','https://cheyennetattoo.com/','ACTIVE',interval '24 hours'),
 ('e3cd2e6f-17e5-5af6-8a39-4c57788bdb91','Bishop Rotary','bishop-rotary','https://bishoprotary.com/','ACTIVE',interval '24 hours'),
 ('06503abe-fca6-5f4c-afc5-69fc1b0e62f2','FK Irons','fk-irons','https://www.fkirons.com/','ACTIVE',interval '24 hours'),
 ('846eb978-3470-5343-89c6-e78f3d5176c0','Dragonhawk','dragonhawk','https://www.dragonhawktattoos.com/','ACTIVE',interval '24 hours'),
 ('db1a84c3-100f-55f6-b997-6536013a2460','Mast Tattoo','mast-tattoo','https://www.masttattoo.com/','ACTIVE',interval '24 hours'),
 ('64f9de8b-3678-5b36-87c5-99ebad69003f','Inkjecta','inkjecta','https://www.inkjecta.com/','ACTIVE',interval '24 hours'),
 ('7d5dd252-46f6-5173-8681-b31ca2e740a1','Stigma Rotary','stigma-rotary','https://www.stigmarotary.com/','ACTIVE',interval '24 hours'),
 ('6e0d833f-b0c7-50a3-b612-438c264f8eb8','Critical Tattoo','critical-tattoo','https://criticaltattoo.com/','ACTIVE',interval '24 hours'),
 ('b9e8f1dc-37ae-5695-af71-11bab292c348','Kwadron','kwadron','https://www.kwadron.pl/','ACTIVE',interval '24 hours'),
 ('d1ac34fa-1c32-5463-a74d-e83acfb38400','Equaliser','equaliser','https://www.equaliser.com/','ACTIVE',interval '24 hours')
on conflict (id) do nothing;

insert into commerce.listing(id,seller_id,product_model_id,external_id,url,affiliate_mode,availability,status,version) values
 ('9248298f-38d2-5f2d-8b95-dfb4af338bc3','99613120-63a3-5eee-8d21-0a7ea2d3f52c','a2818c53-4337-58c4-ab0f-268cbc0d3257','SOL-NOVA-UNLIMITED','https://cheyennetattoo.com/#sol-nova-unlimited','NONE','IN_STOCK','ACTIVE',1),
 ('d38b7bc4-ebe2-5c59-98a5-541456174bf3','99613120-63a3-5eee-8d21-0a7ea2d3f52c','336d81e8-8bd6-5fb5-a9cf-9e736b13d14f','HAWK-PEN','https://cheyennetattoo.com/#hawk-pen','NONE','IN_STOCK','ACTIVE',1),
 ('72cfa625-502b-5f5b-a4fe-3a0132957bc8','99613120-63a3-5eee-8d21-0a7ea2d3f52c','2a9f9a38-2468-52bd-a22a-73b7d4fd4522','HAWK-THUNDER','https://cheyennetattoo.com/#hawk-thunder','NONE','IN_STOCK','ACTIVE',1),
 ('ac10383e-2897-5c91-88dd-d5af97624b88','e3cd2e6f-17e5-5af6-8a39-4c57788bdb91','0f69ff72-f58c-5fe5-96b1-43269bfff944','POWER-WAND-PACKER','https://bishoprotary.com/#bishop-power-wand-packer','NONE','IN_STOCK','ACTIVE',1),
 ('c855cf45-ece1-5e87-b9be-f1166ddd101a','e3cd2e6f-17e5-5af6-8a39-4c57788bdb91','86e94463-e84c-5424-a419-cbaecdee0dfb','POWER-WAND-SHADER','https://bishoprotary.com/#bishop-power-wand-shader','NONE','IN_STOCK','ACTIVE',1),
 ('f7cf2ea7-fde8-50db-a3c2-b28cb2557ad3','e3cd2e6f-17e5-5af6-8a39-4c57788bdb91','d3fedba0-c5b6-59e8-aca3-970d4c7a674b','MICROANGELO','https://bishoprotary.com/#bishop-microangelo','NONE','IN_STOCK','ACTIVE',1),
 ('10c4fc2e-2f18-5879-bde6-c66fae82ff3b','06503abe-fca6-5f4c-afc5-69fc1b0e62f2','e4d37828-e80d-5442-a7fe-edcf177a0329','SPEKTRA-FLUX','https://www.fkirons.com/#spektra-flux','NONE','IN_STOCK','ACTIVE',1),
 ('f00f62cc-997f-5390-ac7e-018c1eb35288','06503abe-fca6-5f4c-afc5-69fc1b0e62f2','cc68e74f-578d-596d-82f3-cd742ab07e58','SPEKTRA-XION','https://www.fkirons.com/#spektra-xion','NONE','IN_STOCK','ACTIVE',1),
 ('290a43f6-5da1-5a5c-9547-b5d4f744acf8','06503abe-fca6-5f4c-afc5-69fc1b0e62f2','47804996-1d20-535f-afa2-b14e05a26326','EXO','https://www.fkirons.com/#exo','NONE','IN_STOCK','ACTIVE',1),
 ('4821c889-7502-5fb1-8414-f6ccb75e9fc7','846eb978-3470-5343-89c6-e78f3d5176c0','e673326e-cc0f-5d5c-ac9e-f0647216a770','MAST-TOUR','https://www.dragonhawktattoos.com/#mast-tour','NONE','IN_STOCK','ACTIVE',1),
 ('a5fce906-cc52-5f8e-a350-07db9ff4205d','846eb978-3470-5343-89c6-e78f3d5176c0','3af9a530-0b1b-5499-abcd-e3b4d1727aeb','MAST-ARCHER','https://www.dragonhawktattoos.com/#mast-archer','NONE','IN_STOCK','ACTIVE',1),
 ('23cbd02d-07d1-50f6-a7c4-01c9b0050b43','846eb978-3470-5343-89c6-e78f3d5176c0','2b34af9b-a73d-547f-9f68-fae7bcb53223','MAST-FLIP','https://www.dragonhawktattoos.com/#mast-flip','NONE','IN_STOCK','ACTIVE',1),
 ('3fb586fe-9a91-5335-9e6f-706cbe70eca8','db1a84c3-100f-55f6-b997-6536013a2460','ce8f3005-5271-5211-b7f7-391ef551a975','MAST-FOLD-PRO','https://www.masttattoo.com/#mast-fold-pro','NONE','IN_STOCK','ACTIVE',1),
 ('2e6bf6af-42b6-5406-8968-7f56b67236ad','64f9de8b-3678-5b36-87c5-99ebad69003f','01a01adb-9602-5b1f-b351-28b086064668','FLITE-NANO','https://www.inkjecta.com/#flite-nano','NONE','IN_STOCK','ACTIVE',1),
 ('b4233b5a-887e-5fd3-9256-2787df176b13','64f9de8b-3678-5b36-87c5-99ebad69003f','58122931-06a1-59fe-8ea1-b8b3a1926097','FLITE-NANO-ELITE','https://www.inkjecta.com/#flite-nano-elite','NONE','IN_STOCK','ACTIVE',1),
 ('d65ac579-3cd9-5fd3-ad1e-0f919d975503','7d5dd252-46f6-5173-8681-b31ca2e740a1','c8138a63-3d61-5465-951b-73f188effe16','STIGMA-V2','https://www.stigmarotary.com/#stigma-v2','NONE','IN_STOCK','ACTIVE',1),
 ('21b1ac88-b49a-5803-8aed-99cb696f6ad4','6e0d833f-b0c7-50a3-b612-438c264f8eb8','d2827d19-8508-559d-889a-9c221fb84035','CRITICAL-TORQUE','https://criticaltattoo.com/#critical-torque','NONE','IN_STOCK','ACTIVE',1),
 ('fca45b73-4ff1-54c0-b6a8-4e9d8e86f752','b9e8f1dc-37ae-5695-af71-11bab292c348','bdc77235-d3ae-555e-b08a-83758b3b2d7c','KWADRON-EQUALIZER','https://www.kwadron.pl/#kwadron-equalizer','NONE','IN_STOCK','ACTIVE',1),
 ('8d400558-abdd-544d-b521-7fb088d7443a','d1ac34fa-1c32-5463-a74d-e83acfb38400','904acaaf-45c4-55e5-80d9-c4574dc7ec43','EQUALISER-PROTON','https://www.equaliser.com/#equaliser-proton','NONE','IN_STOCK','ACTIVE',1)
on conflict (id) do nothing;

insert into commerce.price_observation(id,listing_id,amount,currency,availability,observed_at) values
 ('97e846f6-b05e-50ca-94f1-3d66865645d6','9248298f-38d2-5f2d-8b95-dfb4af338bc3','1150.00','USD','IN_STOCK',now()),
 ('36ae920d-71cf-50de-8da6-0298697dd1bb','d38b7bc4-ebe2-5c59-98a5-541456174bf3','820.00','USD','IN_STOCK',now()),
 ('42860734-bb44-5f68-a26d-76fef1b3e369','72cfa625-502b-5f5b-a4fe-3a0132957bc8','620.00','USD','IN_STOCK',now()),
 ('f97c802e-79f6-521e-866f-03797c49f339','ac10383e-2897-5c91-88dd-d5af97624b88','1000.00','USD','IN_STOCK',now()),
 ('eb7ab986-fe33-50fe-bd8f-206851b56af0','c855cf45-ece1-5e87-b9be-f1166ddd101a','1000.00','USD','IN_STOCK',now()),
 ('b77ddcb8-adf0-566b-98c7-2670e42071d8','f7cf2ea7-fde8-50db-a3c2-b28cb2557ad3','850.00','USD','IN_STOCK',now()),
 ('738906aa-c4fd-5173-8933-65b855436e8b','10c4fc2e-2f18-5879-bde6-c66fae82ff3b','900.00','USD','IN_STOCK',now()),
 ('9913f562-87b6-5b66-b84f-0d5b1d5a0c0f','f00f62cc-997f-5390-ac7e-018c1eb35288','520.00','USD','IN_STOCK',now()),
 ('0dd4542e-188e-54d8-9f7d-e9bafd8437b5','290a43f6-5da1-5a5c-9547-b5d4f744acf8','700.00','USD','IN_STOCK',now()),
 ('4e215fdc-9c55-5f8b-ac3a-8686ebc1f836','4821c889-7502-5fb1-8414-f6ccb75e9fc7','210.00','USD','IN_STOCK',now()),
 ('9c565416-40e5-5630-a581-3658a753ca7e','a5fce906-cc52-5f8e-a350-07db9ff4205d','150.00','USD','IN_STOCK',now()),
 ('a68fffa1-d5ca-5def-b203-84d2f6bb59aa','23cbd02d-07d1-50f6-a7c4-01c9b0050b43','180.00','USD','IN_STOCK',now()),
 ('8aa8d20b-42ef-52f8-b96e-b422b5ecac87','3fb586fe-9a91-5335-9e6f-706cbe70eca8','250.00','USD','IN_STOCK',now()),
 ('9e35fd71-e5e1-5771-b12f-9bb097521ebb','2e6bf6af-42b6-5406-8968-7f56b67236ad','700.00','USD','IN_STOCK',now()),
 ('c651bd63-9ff7-550b-838f-8aef415e7db6','b4233b5a-887e-5fd3-9256-2787df176b13','920.00','USD','IN_STOCK',now()),
 ('09a1543f-1d87-524f-9751-78b024e53858','d65ac579-3cd9-5fd3-ad1e-0f919d975503','320.00','USD','IN_STOCK',now()),
 ('a6b6f1a6-b6b9-5a1e-8b3d-8a609e310ac6','21b1ac88-b49a-5803-8aed-99cb696f6ad4','420.00','USD','IN_STOCK',now()),
 ('eda9d79c-96ff-55e5-91ba-5f200b817e42','fca45b73-4ff1-54c0-b6a8-4e9d8e86f752','360.00','USD','IN_STOCK',now()),
 ('72f201c2-bef1-54e1-a4ad-4601ba93b050','8d400558-abdd-544d-b521-7fb088d7443a','450.00','USD','IN_STOCK',now());

commit;
