import { Client } from 'pg';
import { randomUUID } from 'node:crypto';

const products: { name: string; url: string; type: string; description: string }[] = [
  { name: 'Mercury M-1 Tattoo Machine', url: 'https://musotoku.com/products/tattoo-machine-mercury/', type: 'PEN', description: 'Designed in collaboration with Dan Kubin. Crafted to harness the full potential of your most cherished machine.' },
  { name: 'Vantablack Wireless Tattoo Machine', url: 'https://musotoku.com/products/tattoo-machine-mercury-vantablack/', type: 'PEN', description: 'Covering skin with solid fields of black is not easy. It is heavy work, patient work, and it pushes both artist and tool to the limit. Here is our part: the Vanta-Black.' },
  { name: 'Power Supply Machete MK-1', url: 'https://musotoku.com/products/power-supply-machete-mk-1/', type: 'POWER_SUPPLY', description: '5 Amps of power that smoothly responds to the slightest pressure of your needle producing the cleanest voltage, the best power supply.' },
  { name: 'Rover R-1 Battery Pack', url: 'https://musotoku.com/products/rover-r1-battery-pack/', type: 'BATTERY', description: 'Say goodbye to wasteful battery packs: the ROVER R-1 runs on removable batteries so battery aging will not be a concern anymore.' },
  { name: 'Rover R-1 Battery - Extended Voltage', url: 'https://musotoku.com/products/rover-r1-dan-kubin-model/', type: 'BATTERY', description: 'Designed in collaboration with Dan Kubin. Crafted to harness the full potential of your most cherished machine.' },
  { name: 'Rover R-1 Universal Wireless Tattoo Battery Pack', url: 'https://musotoku.com/products/rover-r1-universal-battery-pack/', type: 'BATTERY', description: 'Designed in collaboration with Dan Kubin. Crafted to harness the full potential of your most cherished machine.' },
  { name: 'Tattoo Hard Box Protection', url: 'https://musotoku.com/products/tattoo-power-supply-box/', type: 'ACCESSORY', description: 'This hard case is shockproof and waterproof. The interior is filled with custom-cut foam to fit your power supply tightly.' },
  { name: 'Foldable Magnetic Support', url: 'https://musotoku.com/products/foldable-magnetic-support/', type: 'ACCESSORY', description: 'The Foldable Magnetic Mount is perfect for attaching your power supply to metal surfaces and placing it in a comfortable position.' },
  { name: 'Hygienic Covers', url: 'https://musotoku.com/products/hygienic-covers/', type: 'ACCESSORY', description: 'The Hygienic Covers help you mitigate cross contamination and simplify the bagging process of your Musotoku Power Supplies.' },
];

function slugify(value: string) {
  return value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'machine';
}

async function main() {
  const c = new Client({ connectionString: 'postgres://portal:portal_dev@localhost:5433/portal' });
  await c.connect();

  const m = await c.query(`select id, slug from catalog.manufacturer where slug='musotoku' limit 1`);
  if (!m.rowCount) { console.log('manufacturer musotoku não encontrado'); await c.end(); return; }
  const manufacturerId = m.rows[0].id;

  // Seller oficial (para os listings apontarem ao site oficial).
  let seller = await c.query(`select id from commerce.seller where slug='musotoku' limit 1`);
  let sellerId: string;
  if (seller.rowCount) {
    sellerId = seller.rows[0].id;
  } else {
    const s = await c.query(
      `insert into commerce.seller (id,name,slug,website_url,status,public_freshness_interval,created_at,updated_at)
       values ($1,'Musotoku','musotoku','https://musotoku.com/','ACTIVE',interval '7 days',now(),now()) returning id`,
      [randomUUID()],
    );
    sellerId = s.rows[0].id;
  }

  let created = 0;
  for (const p of products) {
    const slug = slugify(p.name);
    const existing = await c.query(
      `select id from catalog.product_model where manufacturer_id=$1 and slug=$2 limit 1`,
      [manufacturerId, slug],
    );
    let productId: string;
    if (existing.rowCount) {
      productId = existing.rows[0].id;
    } else {
      const pm = await c.query(
        `insert into catalog.product_model
         (id,manufacturer_id,product_type_key,name,normalized_name,slug,model_code,lifecycle,version)
         values ($1,$2,$3,$4,lower($4),$5,null,'ACTIVE',1) returning id`,
        [randomUUID(), manufacturerId, p.type, p.name, slug],
      );
      productId = pm.rows[0].id;
      created++;
    }

    await c.query(
      `insert into commerce.listing
       (id,seller_id,product_model_id,external_id,url,normalized_url,affiliate_mode,availability,status,last_observed_at,version)
       select $1,$2,$3,$4,$5,$5,'NONE','IN_STOCK','ACTIVE',now(),1
        where not exists (select 1 from commerce.listing li where li.normalized_url=$5)`,
      [randomUUID(), sellerId, productId, slug, p.url],
    );

    const hasDesc = await c.query(
      `select 1 from knowledge.canonical_fact where subject_type='PRODUCT_MODEL' and subject_id=$1 and property_key='description' limit 1`,
      [productId],
    );
    if (!hasDesc.rowCount) {
      const claimId = randomUUID();
      const proposalId = randomUUID();
      await c.query(
        `insert into knowledge.claim
         (id,subject_type,subject_id,property_key,value,claimant_type,source_url,observed_at,confidence,status,version,created_at)
         values ($1,'PRODUCT_MODEL',$2,'description',$3::jsonb,'MANUFACTURER',$4,now(),0.7,'ACTIVE',1,now())`,
        [claimId, productId, JSON.stringify(p.description), p.url],
      );
      await c.query(
        `insert into knowledge.canonical_proposal
         (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,status,created_by,created_at,decided_by,decided_at,decision_reason,version)
         values ($1,'PRODUCT_MODEL',$2,'description',$3::jsonb,ARRAY[$4]::uuid[],'APPROVED','catalog',now(),'catalog',now(),'CATALOG_IMPORT',1)`,
        [proposalId, productId, JSON.stringify(p.description), claimId],
      );
      await c.query(
        `insert into knowledge.canonical_fact
         (id,subject_type,subject_id,property_key,value,unit,valid_from,proposal_id,decided_by,decision_reason,version)
         values (gen_random_uuid(),'PRODUCT_MODEL',$1,'description',$2::jsonb,null,now(),$3,'catalog','CATALOG_IMPORT',1)`,
        [productId, JSON.stringify(p.description), proposalId],
      );
    }
  }
  console.log(`musotoku: ${created} produtos criados (total ${products.length})`);
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
