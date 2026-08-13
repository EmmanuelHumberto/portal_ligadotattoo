import {PoolClient} from 'pg';

type FixtureConfig={enabled:boolean};

export function fixtureConfig(env:NodeJS.ProcessEnv):FixtureConfig {
  const enabled=env.BOOTSTRAP_FIXTURES?.trim().toLowerCase()==='true';
  if (enabled && env.NODE_ENV==='production') {
    throw new Error('BOOTSTRAP_FIXTURES cannot be enabled in production');
  }
  return {enabled};
}

const ids={
  manufacturer:'f1000000-0000-4000-8000-000000000001',
  brand:'f1000000-0000-4000-8000-000000000002',
  rotary:'f1000000-0000-4000-8000-000000000101',
  pen:'f1000000-0000-4000-8000-000000000102',
  seller:'f1000000-0000-4000-8000-000000000201',
  rotaryListing:'f1000000-0000-4000-8000-000000000301',
  penListing:'f1000000-0000-4000-8000-000000000302',
  rotaryPrice:'f1000000-0000-4000-8000-000000000401',
  penPrice:'f1000000-0000-4000-8000-000000000402',
};

const facts=[
  ['f1000000-0000-4000-8000-000000001001',ids.rotary,'stroke',3.5,'mm'],
  ['f1000000-0000-4000-8000-000000001002',ids.rotary,'weight',185,'g'],
  ['f1000000-0000-4000-8000-000000001003',ids.rotary,'voltage_range','5–11','V'],
  ['f1000000-0000-4000-8000-000000001004',ids.pen,'stroke',4.0,'mm'],
  ['f1000000-0000-4000-8000-000000001005',ids.pen,'weight',198,'g'],
  ['f1000000-0000-4000-8000-000000001006',ids.pen,'voltage_range','5–12','V'],
] as const;

export async function applySyntheticFixtures(client:PoolClient) {
  await client.query(
    `insert into catalog.manufacturer
       (id,name,normalized_name,slug,official_website,country_code,status)
     values ($1,'Fixture Tattoo Labs','fixture tattoo labs',
             'fixture-tattoo-labs','https://example.com','BR','ACTIVE')
     on conflict(id) do update set
       name=excluded.name,normalized_name=excluded.normalized_name,
       slug=excluded.slug,updated_at=now()`,
    [ids.manufacturer],
  );
  await client.query(
    `insert into catalog.brand(id,manufacturer_id,name,slug)
     values ($1,$2,'Fixture Tattoo Labs','fixture-tattoo-labs-brand')
     on conflict(id) do update set name=excluded.name,updated_at=now()`,
    [ids.brand,ids.manufacturer],
  );
  await client.query(
    `insert into catalog.product_model
       (id,manufacturer_id,brand_id,product_type_key,name,normalized_name,
        slug,model_code,lifecycle)
     values
       ($1,$3,$4,'ROTARY','Fixture Rotary One','fixture rotary one',
        'fixture-rotary-one','FIX-R1','ACTIVE'),
       ($2,$3,$4,'PEN','Fixture Pen Pro','fixture pen pro',
        'fixture-pen-pro','FIX-P1','ACTIVE')
     on conflict(id) do update set
       name=excluded.name,normalized_name=excluded.normalized_name,
       product_type_key=excluded.product_type_key,lifecycle=excluded.lifecycle,
       updated_at=now()`,
    [ids.rotary,ids.pen,ids.manufacturer,ids.brand],
  );

  for (const [factId,subjectId,key,value,unit] of facts) {
    const claimId=factId.replace('0010','0020');
    const proposalId=factId.replace('0010','0030');
    await client.query(
      `insert into knowledge.claim
         (id,subject_type,subject_id,property_key,value,claimant_type,
          claimant_id,source_url,observed_at,confidence,status)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,'SYNTHETIC_FIXTURE',
               'local-bootstrap','https://example.com/fixture',now(),1,'ACTIVE')
       on conflict(id) do update set value=excluded.value,observed_at=now()`,
      [claimId,subjectId,key,JSON.stringify(value)],
    );
    await client.query(
      `insert into knowledge.canonical_proposal
         (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
          status,created_by,decided_by,decided_at,decision_reason)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,array[$5::uuid],
               'APPROVED','local-bootstrap','local-bootstrap',now(),
               'Synthetic development fixture')
       on conflict(id) do update set proposed_value=excluded.proposed_value`,
      [proposalId,subjectId,key,JSON.stringify(value),claimId],
    );
    await client.query(
      `insert into knowledge.canonical_fact
         (id,subject_type,subject_id,property_key,value,unit,valid_from,
          proposal_id,decided_by,decision_reason)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,$5,now(),$6,
               'local-bootstrap','Synthetic development fixture')
       on conflict(id) do update set value=excluded.value,unit=excluded.unit`,
      [factId,subjectId,key,JSON.stringify(value),unit,proposalId],
    );
  }

  await client.query(
    `insert into commerce.seller
       (id,name,slug,website_url,status,public_freshness_interval)
     values ($1,'Fixture Supply','fixture-supply','https://example.com',
             'ACTIVE',interval '24 hours')
     on conflict(id) do update set name=excluded.name,status='ACTIVE',updated_at=now()`,
    [ids.seller],
  );
  await client.query(
    `insert into commerce.listing
       (id,seller_id,product_model_id,external_id,url,normalized_url,
        affiliate_mode,availability,status,last_observed_at)
     values
       ($1,$3,$4,'FIX-R1','https://example.com/fixture-rotary-one',
        'https://example.com/fixture-rotary-one','NONE','IN_STOCK','ACTIVE',now()),
       ($2,$3,$5,'FIX-P1','https://example.com/fixture-pen-pro',
        'https://example.com/fixture-pen-pro','NONE','IN_STOCK','ACTIVE',now())
     on conflict(id) do update set
       availability='IN_STOCK',status='ACTIVE',last_observed_at=now(),updated_at=now()`,
    [ids.rotaryListing,ids.penListing,ids.seller,ids.rotary,ids.pen],
  );
  await client.query(
    `insert into commerce.price_observation
       (id,listing_id,amount,currency,availability,observed_at)
     values ($1,$3,1299.90,'BRL','IN_STOCK',now()),
            ($2,$4,1599.90,'BRL','IN_STOCK',now())
     on conflict(id) do update set
       amount=excluded.amount,currency=excluded.currency,
       availability=excluded.availability,observed_at=now()`,
    [ids.rotaryPrice,ids.penPrice,ids.rotaryListing,ids.penListing],
  );
}
