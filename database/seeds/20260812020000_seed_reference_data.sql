BEGIN;
INSERT INTO iam.capability(key,description,created_at) VALUES
('catalog.read','Read catalog',now()),('catalog.write','Write catalog',now()),
('knowledge.read','Read knowledge',now()),('claim.write','Write claims',now()),
('canonical.propose','Propose canonical facts',now()),('canonical.decide','Decide canonical facts',now()),
('media.review','Review media rights',now()),('source.manage','Manage sources',now()),
('ingestion.operate','Operate ingestion',now()),('editorial.write','Write editorial content',now()),
('editorial.publish','Publish editorial content',now()),('commerce.manage','Manage commerce',now()),
('ai.configure','Configure AI Hub',now()),('ops.replay','Replay operational jobs/events',now())
ON CONFLICT DO NOTHING;

INSERT INTO catalog.product_type(key,name,sort_order) VALUES
('tattoo_machine','Tattoo Machine',10),('rotary_machine','Rotary Machine',20),
('coil_machine','Coil Machine',30),('pen_machine','Pen Machine',40),('battery','Battery',50),
('power_supply','Power Supply',60),('cartridge','Cartridge',70),('needle','Needle',80),
('accessory','Accessory',90)
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.property_definition
(id,key,name,value_type,status,version,created_at,updated_at)
VALUES
('00000000-0000-0000-0000-000000000101','machine.stroke','Stroke','MEASUREMENT','ACTIVE',1,now(),now()),
('00000000-0000-0000-0000-000000000102','machine.motor','Motor','TEXT','ACTIVE',1,now(),now()),
('00000000-0000-0000-0000-000000000103','machine.weight','Weight','MEASUREMENT','ACTIVE',1,now(),now()),
('00000000-0000-0000-0000-000000000104','battery.capacity','Battery Capacity','MEASUREMENT','ACTIVE',1,now(),now())
ON CONFLICT DO NOTHING;
COMMIT;
