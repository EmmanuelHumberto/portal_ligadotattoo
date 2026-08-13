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
  news:'f1000000-0000-4000-8000-000000000501',
  blog:'f1000000-0000-4000-8000-000000000502',
  event:'f1000000-0000-4000-8000-000000000503',
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

  const editorialFixtures=[
    [ids.news,'NEWS','fixture-novidades-em-maquinas','Novidades em máquinas de tatuagem',
      'Uma notícia sintética para validar descoberta e navegação pública.'],
    [ids.blog,'BLOG','fixture-guia-de-stroke','Guia técnico de stroke',
      'Um artigo sintético sobre critérios técnicos de comparação.'],
    [ids.event,'EVENT','fixture-convencao-tattoo','Convenção Tattoo Fixture',
      'Um evento sintético para validar a agenda pública.'],
  ] as const;
  for(const [id,type,slug,title,summary] of editorialFixtures) {
    await client.query(
      `insert into editorial.content
       (id,content_type,title,slug,subtitle,summary,body_document,status,origin,
        created_by,approved_by,published_at)
       values ($1,$2,$4,$3,'Conteúdo de demonstração',$5,$6::jsonb,
               'PUBLISHED','HUMAN','local-bootstrap','local-bootstrap',now())
       on conflict(id) do update set title=excluded.title,summary=excluded.summary,
         body_document=excluded.body_document,status='PUBLISHED',updated_at=now()`,
      [id,type,slug,title,summary,JSON.stringify({version:1,blocks:[
        {type:'paragraph',text:summary},
        {type:'callout',tone:'info',title:'Fixture de desenvolvimento',
         text:'Este conteúdo é sintético e não representa publicação real.'},
      ]})],
    );
  }
  await client.query(
    `insert into editorial.event_detail
     (content_id,starts_at,ends_at,timezone,venue_name,city,country_code,
      official_url,event_status)
     values ($1,now()+interval '30 days',now()+interval '31 days',
             'America/Sao_Paulo','Centro Fixture','São Paulo','BR',
             'https://example.com/evento','SCHEDULED')
     on conflict(content_id) do update set starts_at=excluded.starts_at,
       ends_at=excluded.ends_at,event_status='SCHEDULED'`,[ids.event],
  );

  await client.query(
    `insert into search.search_document
     (id,source_type,source_id,document_type,title,normalized_title,subtitle,
      public_url,is_public,search_vector,updated_at)
     select p.id,'PRODUCT_MODEL',p.id,'PRODUCT',p.name,lower(p.name),m.name,
            '/maquinas/'||p.slug,true,
            to_tsvector('simple',p.name||' '||m.name),now()
       from catalog.product_model p
       join catalog.manufacturer m on m.id=p.manufacturer_id
      where p.id=any($1::uuid[])
     on conflict(source_type,source_id) do update set
      title=excluded.title,normalized_title=excluded.normalized_title,
      subtitle=excluded.subtitle,public_url=excluded.public_url,
      search_vector=excluded.search_vector,is_public=true,updated_at=now()`,
    [[ids.rotary,ids.pen]],
  );
  await client.query(
    `insert into search.search_document
     (id,source_type,source_id,document_type,title,normalized_title,subtitle,
      public_url,is_public,search_vector,updated_at)
     select c.id,'EDITORIAL_CONTENT',c.id,c.content_type,c.title,lower(c.title),
            c.summary,case c.content_type when 'NEWS' then '/noticias/'
             when 'EVENT' then '/eventos/' else '/blog/' end||c.slug,true,
            to_tsvector('simple',c.title||' '||coalesce(c.summary,'')),now()
       from editorial.content c where c.id=any($1::uuid[])
     on conflict(source_type,source_id) do update set
      document_type=excluded.document_type,title=excluded.title,
      normalized_title=excluded.normalized_title,subtitle=excluded.subtitle,
      public_url=excluded.public_url,search_vector=excluded.search_vector,
      is_public=true,updated_at=now()`,
    [[ids.news,ids.blog,ids.event]],
  );
}
