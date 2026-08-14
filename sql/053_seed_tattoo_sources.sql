begin;

insert into ingestion.source(
  id,name,kind,base_url,allowed_hosts,robots_policy,crawl_delay_ms,status,version
) values
 ('5bb49003-7b6c-4ad2-8e27-7c5d4de710bc','Tattoo Life','NEWS','https://www.tattoolife.com/',
  ARRAY['tattoolife.com','www.tattoolife.com'],'RESPECT',1000,'ACTIVE',1),
 ('88f4c038-7499-4b40-94cf-0d6c79ab9249','Inkppl','NEWS','https://inkppl.com/',
  ARRAY['inkppl.com'],'RESPECT',1000,'ACTIVE',1),
 ('76398b74-289b-49c3-af53-3e07bf7dcec8','World Tattoo Events','EVENT','https://www.worldtattooevents.com/',
  ARRAY['worldtattooevents.com','www.worldtattooevents.com'],'RESPECT',1000,'ACTIVE',1),
 ('e5ff0762-f109-4454-bb38-297256a9ff7a','Inked Magazine','NEWS','https://www.inkedmag.com/',
  ARRAY['inkedmag.com','www.inkedmag.com'],'RESPECT',1000,'ACTIVE',1),
 ('e3f76099-9d37-408d-bd6d-e73f55a56f0b','Skin Deep','NEWS','https://www.skindeep.co.uk/',
  ARRAY['skindeep.co.uk','www.skindeep.co.uk'],'RESPECT',1000,'ACTIVE',1),
 ('89ce8632-f201-462f-84ba-2832fceb3713','Tattoodo','NEWS','https://www.tattoodo.com/',
  ARRAY['tattoodo.com','www.tattoodo.com'],'RESPECT',1000,'ACTIVE',1),
 ('22b693b3-fa8f-4c3b-a85b-7f0c882644da','Th-ink','NEWS','https://www.th-ink.co.uk/',
  ARRAY['th-ink.co.uk','www.th-ink.co.uk'],'RESPECT',1000,'ACTIVE',1),
 ('36002c1b-6dac-42d4-9550-6b471cba773a','Total Tattoo','NEWS','https://www.totaltattoo.co.uk/',
  ARRAY['totaltattoo.co.uk','www.totaltattoo.co.uk'],'RESPECT',1000,'ACTIVE',1),
 ('21774643-b5c4-4a3e-aade-04e64d663b65','Tattoo Artist Magazine','NEWS','https://tattooartistmagazine.com/',
  ARRAY['tattooartistmagazine.com'],'RESPECT',1000,'ACTIVE',1),
 ('77b8339b-b3b0-4b0d-a6f0-fcaa97685347','Tattooing 101','TECHNICAL','https://tattooing101.com/',
  ARRAY['tattooing101.com'],'RESPECT',1000,'ACTIVE',1),
 ('d7fe7c2e-396e-4192-81d9-3b499e812d22','Tattoo.com','NEWS','https://www.tattoo.com/',
  ARRAY['tattoo.com','www.tattoo.com'],'RESPECT',1000,'ACTIVE',1),
 ('9b83871b-c5b5-46bf-8a7b-ee65621e995d','Scene360','NEWS','https://scene360.com/',
  ARRAY['scene360.com'],'RESPECT',1000,'ACTIVE',1)
on conflict (id) do nothing;

insert into ingestion.crawl_target(
  id,source_id,url,discovery_mode,schedule_key,max_bytes,status
) values
 (gen_random_uuid(),'5bb49003-7b6c-4ad2-8e27-7c5d4de710bc','https://www.tattoolife.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'88f4c038-7499-4b40-94cf-0d6c79ab9249','https://inkppl.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'76398b74-289b-49c3-af53-3e07bf7dcec8','https://www.worldtattooevents.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'e5ff0762-f109-4454-bb38-297256a9ff7a','https://www.inkedmag.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'e3f76099-9d37-408d-bd6d-e73f55a56f0b','https://www.skindeep.co.uk/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'89ce8632-f201-462f-84ba-2832fceb3713','https://www.tattoodo.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'22b693b3-fa8f-4c3b-a85b-7f0c882644da','https://www.th-ink.co.uk/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'36002c1b-6dac-42d4-9550-6b471cba773a','https://www.totaltattoo.co.uk/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'21774643-b5c4-4a3e-aade-04e64d663b65','https://tattooartistmagazine.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'77b8339b-b3b0-4b0d-a6f0-fcaa97685347','https://tattooing101.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'d7fe7c2e-396e-4192-81d9-3b499e812d22','https://www.tattoo.com/','EDITORIAL','6h',5000000,'ACTIVE'),
 (gen_random_uuid(),'9b83871b-c5b5-46bf-8a7b-ee65621e995d','https://scene360.com/','EDITORIAL','6h',5000000,'ACTIVE')
on conflict (source_id,url) do nothing;

commit;
