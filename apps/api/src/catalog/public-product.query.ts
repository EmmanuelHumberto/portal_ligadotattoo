import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import {MEDIA_DELIVERY,type MediaDeliveryPort} from '../media/media-storage.port';

@Injectable()
export class PublicProductQuery {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(MEDIA_DELIVERY) private readonly delivery:MediaDeliveryPort,
  ) {}

  async list(input: {
    limit: number;
    cursor?: string;
    productType?: string;
    manufacturer?: string;
  }) {
    const limit = Math.min(Math.max(input.limit || 24, 1), 100);
    const filterParams: unknown[] = [];
    const filterWhere: string[] = [`p.lifecycle <> 'UNKNOWN'`];

    if (input.productType) {
      const types=input.productType.split(',').filter(Boolean);
      if (types.length) {
        filterParams.push(types);
        filterWhere.push(`p.product_type_key = ANY($${filterParams.length})`);
      }
    }
    if (input.manufacturer) {
      filterParams.push(input.manufacturer);
      filterWhere.push(`m.slug = $${filterParams.length}`);
    }
    const params=[...filterParams];
    const where=[...filterWhere];
    if (input.cursor) {
      params.push(input.cursor);
      where.push(`p.id > $${params.length}::uuid`);
    }
    params.push(limit + 1);

    const [r,totalResult] = await Promise.all([this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.lifecycle,
              p.manufacturer_id,
              m.name manufacturer_name,m.slug manufacturer_slug,
              b.name brand_name,
              (select coalesce(vh.storage_key,vc.storage_key,vt.storage_key,a.storage_key)
                 from media.media_link l
                 join media.media_asset a on a.id=l.media_asset_id
                 left join media.media_variant vh on vh.media_asset_id=a.id and vh.variant_key='hero'
                 left join media.media_variant vc on vc.media_asset_id=a.id and vc.variant_key='card'
                 left join media.media_variant vt on vt.media_asset_id=a.id and vt.variant_key='thumb'
                where l.subject_type='PRODUCT_MODEL' and l.subject_id=p.id
                  and a.status='ACTIVE' and a.rights_status='PERMITTED'
                  and exists (
                    select 1 from media.media_rights mr
                     where mr.media_asset_id=a.id and mr.is_current=true
                       and mr.status='PERMITTED'
                       and (mr.expires_at is null or mr.expires_at > now())
                  )
                order by l.is_primary desc,l.sort_order,a.id limit 1) hero_key,
              offer.amount offer_amount,offer.currency offer_currency
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
         left join lateral (
           select min(po.amount) amount, min(po.currency) currency
             from commerce.listing li2
             join commerce.price_observation po on po.listing_id=li2.id
            where li2.product_model_id=p.id and li2.status='ACTIVE'
              and po.observed_at >= now() - interval '7 days'
         ) offer on true
        where ${where.join(' and ')}
        order by p.id
        limit $${params.length}`,
      params,
    ),this.pool.query(
      `select count(*)::int total
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
        where ${filterWhere.join(' and ')}`,
      filterParams,
    )]);

    const hasMore = r.rows.length > limit;
    const rows = r.rows.slice(0, limit);
    const items = await Promise.all(rows.map(async row => ({
      ...mapSummary(row),
      heroMedia: row.hero_key
        ? { url: await this.delivery.url(row.hero_key) }
        : null,
      offerFrom: row.offer_amount != null
        ? { amount: Number(row.offer_amount), currency: row.offer_currency ?? 'USD' }
        : null,
    })));
    return {
      items,
      meta: {
        hasMore,
        nextCursor: hasMore ? rows.at(-1)?.id ?? null : null,
        total:Number(totalResult.rows[0]?.total??0),
      },
    };
  }

  async bySlug(slug: string) {
    const base = await this.pool.query(
      `select p.id,p.slug,p.name,p.product_type_key,p.lifecycle,
              p.manufacturer_id,
              m.name manufacturer_name,m.slug manufacturer_slug,
              b.name brand_name,
              exists(
                select 1 from knowledge.claim c
                 where c.subject_type='PRODUCT_MODEL'
                   and c.subject_id=p.id
                   and c.claimant_type='SYNTHETIC_FIXTURE'
                   and c.status='ACTIVE'
              ) is_synthetic_fixture
         from catalog.product_model p
         join catalog.manufacturer m on m.id=p.manufacturer_id
         left join catalog.brand b on b.id=p.brand_id
        where p.slug=$1 and p.lifecycle<>'UNKNOWN'`,
      [slug],
    );
    if (!base.rowCount) return null;
    const row = base.rows[0];

    const [facts, media, offer, docs] = await Promise.all([
      this.pool.query(
        `select property_key, value, unit
           from knowledge.canonical_fact
          where subject_type='PRODUCT_MODEL'
            and subject_id=$1
            and valid_from <= now()
            and (valid_to is null or valid_to > now())
          order by property_key`,
        [row.id],
      ),
      this.pool.query(
        `select a.id,a.kind,a.storage_key,a.alt_text,a.attribution,
                coalesce(vh.storage_key,vc.storage_key,vt.storage_key,a.storage_key)
                  delivery_storage_key
           from media.media_link l
           join media.media_asset a on a.id=l.media_asset_id
           left join media.media_variant vh
             on vh.media_asset_id=a.id and vh.variant_key='hero'
           left join media.media_variant vc
             on vc.media_asset_id=a.id and vc.variant_key='card'
           left join media.media_variant vt
             on vt.media_asset_id=a.id and vt.variant_key='thumb'
          where l.subject_type='PRODUCT_MODEL'
            and l.subject_id=$1
            and a.status='ACTIVE'
            and a.rights_status='PERMITTED'
            and exists (
              select 1 from media.media_rights mr
               where mr.media_asset_id=a.id and mr.is_current=true
                 and mr.status='PERMITTED'
                 and (mr.expires_at is null or mr.expires_at > now())
            )
          order by l.is_primary desc,l.sort_order,a.id`,
        [row.id],
      ),
      this.pool.query(
        `select min(po.amount) amount, min(po.currency) currency,
                max(po.observed_at) observed_at
           from commerce.listing li
           join commerce.price_observation po on po.listing_id=li.id
          where li.product_model_id=$1
            and li.status='ACTIVE'
            and po.observed_at >= now() - interval '7 days'`,
        [row.id],
      ),
      this.pool.query(
        `select a.id,a.attribution,a.mime_type,a.byte_size,a.storage_key
           from media.media_link l
           join media.media_asset a on a.id=l.media_asset_id
          where l.subject_type='MANUFACTURER'
            and l.subject_id=$1
            and l.role='manual'
            and a.status='ACTIVE'
            and a.rights_status='PERMITTED'
          order by a.attribution`,
        [row.manufacturer_id],
      ),
    ]);

    const deliveredMedia=await Promise.all(media.rows.map(async m=>({
      id:m.id,kind:m.kind,url:await this.delivery.url(m.delivery_storage_key),
      alt:m.alt_text,attribution:m.attribution,
    })));
    const specFacts = facts.rows.filter(f =>
      !['summary','description'].includes(f.property_key));
    const summaryFact = facts.rows.find(f => f.property_key === 'summary');
    const descriptionFact = facts.rows.find(f => f.property_key === 'description');
    return {
      ...mapSummary(row),
      machineType: row.product_type_key,
      machineTypeLabel: humanize(row.product_type_key),
      summary: summaryFact ? String(summaryFact.value) : null,
      description: descriptionFact ? String(descriptionFact.value) : null,
      canonicalSpecifications: specFacts.map(f => ({
        key: f.property_key,
        name: humanize(f.property_key),
        value: f.value,
        unit: f.unit,
      })),
      specifications: specFacts.map(f => ({
        key: f.property_key,
        label: humanize(f.property_key),
        value: formatFact(f.value, f.unit),
      })),
      media:deliveredMedia,
      heroMedia:deliveredMedia[0] ? {
        url:deliveredMedia[0].url,
        kind:deliveredMedia[0].kind,
        attribution:deliveredMedia[0].attribution,
      } : null,
      offersSummary: offer.rows[0]?.amount == null ? null : {
        fromAmount: Number(offer.rows[0].amount),
        currency: offer.rows[0].currency,
        observedAt: offer.rows[0].observed_at,
      },
      documents: await Promise.all(docs.rows.map(async d=>({
        id:d.id,title:d.attribution ?? 'Manual',url:await this.delivery.url(d.storage_key),
        mimeType:d.mime_type,byteSize:Number(d.byte_size ?? 0),
      }))),
      isSyntheticFixture:Boolean(row.is_synthetic_fixture),
    };
  }

  async facets(input:{productType?:string;manufacturer?:string}={}) {
    const typeFilter = input.productType
      ? input.productType.split(',').filter(Boolean)
      : [];
    const manufFilter = (input.manufacturer ?? '').trim();

    const typeParams:unknown[] = [];
    const typeWhere:string[] = [`lifecycle <> 'UNKNOWN'`];
    if (typeFilter.length) {
      typeParams.push(typeFilter);
      typeWhere.push(`product_type_key = ANY($${typeParams.length})`);
    }
    if (manufFilter) {
      typeParams.push(manufFilter);
      typeWhere.push(`manufacturer_id in (select id from catalog.manufacturer where slug=$${typeParams.length})`);
    }

    const brandParams:unknown[] = [];
    const brandWhere:string[] = [`p.lifecycle <> 'UNKNOWN'`];
    if (typeFilter.length) {
      brandParams.push(typeFilter);
      brandWhere.push(`p.product_type_key = ANY($${brandParams.length})`);
    }
    if (manufFilter) {
      brandParams.push(manufFilter);
      brandWhere.push(`m.slug = $${brandParams.length}`);
    }

    const [brands, types] = await Promise.all([
      this.pool.query(
        `select m.slug value,m.name label,count(p.id)::int count
           from catalog.manufacturer m
           join catalog.product_model p on p.manufacturer_id=m.id
          where ${brandWhere.join(' and ')}
          group by m.slug,m.name order by m.name`,
        brandParams,
      ),
      this.pool.query(
        `select product_type_key value,product_type_key label,count(*)::int count
           from catalog.product_model
          where ${typeWhere.join(' and ')}
          group by product_type_key order by product_type_key`,
        typeParams,
      ),
    ]);
    return {
      brands: brands.rows,
      types: types.rows.map((t:any)=>({...t,label:humanize(t.value)})),
      applications: [],
      priceBands: [],
    };
  }

  async compare(ids: string[]) {
    if (!ids.length) return { items: [] };
    const rows = await this.pool.query(
      `select slug from catalog.product_model where id=any($1::uuid[])
        order by array_position($1::uuid[],id)`,
      [ids],
    );
    const items = await Promise.all(rows.rows.map((row) => this.bySlug(row.slug)));
    return { items: items.filter(Boolean) };
  }
}

function mapSummary(r: any) {
  return {
    id:r.id, slug:r.slug, name:r.name,
    manufacturer:r.manufacturer_name,
    manufacturerSlug:r.manufacturer_slug,
    brand:r.brand_name
      ? {name:r.brand_name}
      : {name:r.manufacturer_name},
    type:r.product_type_key,
    productType:r.product_type_key,
    typeLabel:humanize(r.product_type_key),
    lifecycle:r.lifecycle,
  };
}

function formatFact(value: unknown, unit: string | null) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return unit ? `${text} ${unit}` : text;
}

const LABELS:Record<string,string>={
  power_supply:'Fonte',voltage_range:'Tensão',rpm:'RPM (velocidade)',
  motor_type:'Tipo de motor',stroke:'Curso',weight:'Peso',
  accessories:'Acessórios',summary:'Resumo',description:'Descrição',
  battery_capacity:'Capacidade da bateria',battery:'Bateria',
  material:'Material',drive:'Transmissão',stroke_type:'Ajuste do curso',
  screen:'Tela',connectivity:'Conectividade',runtime:'Autonomia',
  charge_time:'Tempo de carga',frequency:'Frequência',dimensions:'Dimensões',
  'operating-mode':'Modo de operação','input-voltage':'Tensão de entrada',
  'output-voltage':'Tensão de saída',
  colors:'Cores',volume:'Volume',base:'Base',vegan:'Vegano',sterile:'Esterilizado',
  needle_config:'Configuração da agulha',needle_diameter:'Diâmetro da agulha',
  quantity:'Quantidade',power:'Potência',charge_port:'Porta de carga',
  voltage:'Tensão',grip_protrusion:'Protrusão do grip',length:'Comprimento',
  diameter:'Diâmetro',transmission_type:'Sistema de transmissão',
  electrical_connection:'Conexão elétrica',motor_nominal_voltage:'Tensão nominal',
  motor_rpm:'RPM',motor_nominal_torque:'Torque nominal',motor_dimensions:'Medidas',
  motor_shaft_length:'Tamanho do eixo',motor_shaft_diameter:'Diâmetro do eixo',
  battery_connectivity:'Conectividade da bateria',capacity:'Capacidade',
  display_type:'Tipo de display',charging_current:'Corrente de carregamento',
  charging_input_voltage:'Tensão de entrada para carregamento',
  input_voltage:'Tensão de entrada',output_voltage:'Tensão de saída',
  protections:'Proteções',
  PEN:'Máquina pen',ROTARY:'Máquina rotativa',COIL:'Máquina de bobina',
  POWER_SUPPLY:'Fonte',
  BATTERY:'Bateria',CARTRIDGE:'Cartucho',ACCESSORY:'Acessório',
  INK:'Tinta',
};

function humanize(key: string | undefined | null) {
  if(!key)return '';
  return LABELS[key] ?? key.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
}
