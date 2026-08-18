import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {CuratedProductFactRepository} from '../../apps/api/src/catalog/curated-product-fact.repository';
import {SetProductTypeHandler} from '../../apps/api/src/catalog/set-product-type.handler';
import {PostgresAuditRepository} from '../../apps/api/src/platform/audit.repository';
import {OutboxRepository} from '../../apps/api/src/platform/outbox.repository';
import {TransactionManager} from '../../apps/api/src/platform/transaction-manager';

const databaseUrl=process.env.TEST_DATABASE_URL;
const integration=databaseUrl?describe:describe.skip;

integration('product admin mutations',()=>{
  const pool=new Pool({connectionString:databaseUrl});
  const manufacturerId=randomUUID();
  const productId=randomUUID();
  const slug=`mutation-${productId}`;
  const handler=new SetProductTypeHandler(
    new TransactionManager(pool),new CuratedProductFactRepository(),
    new PostgresAuditRepository(),new OutboxRepository(),
  );

  beforeAll(async()=>{
    await pool.query(
      `insert into catalog.manufacturer
       (id,name,normalized_name,slug,status,version)
       values ($1,'Mutation Test','mutation test',$2,'ACTIVE',1)`,
      [manufacturerId,`mutation-maker-${manufacturerId}`],
    );
    await pool.query(
      `insert into catalog.product_model
       (id,manufacturer_id,product_type_key,name,normalized_name,slug,lifecycle,version)
       values ($1,$2,'PEN','Mutation Machine','mutation machine',$3,'ACTIVE',1)`,
      [productId,manufacturerId,slug],
    );
  });

  afterAll(async()=>{
    const proposals=await pool.query(
      `select id,evidence_ids from knowledge.canonical_proposal
        where subject_type='PRODUCT_MODEL' and subject_id=$1`,[productId],
    );
    const proposalIds=proposals.rows.map(x=>x.id);
    const claimIds=proposals.rows.flatMap(x=>x.evidence_ids??[]);
    await pool.query(
      `delete from ops.job where source_event_id in (
        select id from ops.outbox_event where aggregate_id=any($1::text[])
      )`,[proposalIds],
    );
    await pool.query('delete from ops.outbox_event where aggregate_id=any($1::text[])',
      [proposalIds]);
    await pool.query('delete from knowledge.canonical_fact where subject_id=$1',[productId]);
    await pool.query('delete from knowledge.canonical_proposal where subject_id=$1',[productId]);
    await pool.query('delete from knowledge.claim where id=any($1::uuid[])',[claimIds]);
    await pool.query('delete from ops.audit_log where subject_id=$1',[productId]);
    await pool.query('delete from search.search_document where source_id=$1',[productId]);
    await pool.query('delete from catalog.product_model where id=$1',[productId]);
    await pool.query('delete from catalog.manufacturer where id=$1',[manufacturerId]);
    await pool.end();
  });

  it('keeps exactly one current product_type fact across changes',async()=>{
    await handler.execute(productId,'COIL','integration-admin');
    await handler.execute(productId,'ROTARY','integration-admin');
    const facts=await pool.query(
      `select value,valid_to from knowledge.canonical_fact
        where subject_type='PRODUCT_MODEL' and subject_id=$1
          and property_key='product_type' order by valid_from`,[productId],
    );
    expect(facts.rows).toHaveLength(2);
    expect(facts.rows.filter(x=>x.valid_to===null)).toHaveLength(1);
    expect(facts.rows.at(-1)?.value).toBe('ROTARY');
    const product=await pool.query(
      'select product_type_key from catalog.product_model where id=$1',[productId],
    );
    expect(product.rows[0]?.product_type_key).toBe('ROTARY');
  });
});
