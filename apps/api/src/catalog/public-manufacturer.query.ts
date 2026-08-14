import {Inject,Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class PublicManufacturerQuery {
 constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

 async list() {
  const result=await this.pool.query(
   `select m.id,m.name,m.slug,m.country_code,m.official_website,
           count(p.id) filter(where p.lifecycle<>'UNKNOWN')::int product_count
      from catalog.manufacturer m
      left join catalog.product_model p on p.manufacturer_id=m.id
     where m.status='ACTIVE'
     group by m.id,m.name,m.slug,m.country_code,m.official_website
     order by m.name`,
  );
  return {items:result.rows.map(mapManufacturer)};
 }

 async bySlug(slug:string) {
  const result=await this.pool.query(
   `select m.id,m.name,m.slug,m.country_code,m.official_website,
           count(p.id) filter(where p.lifecycle<>'UNKNOWN')::int product_count
      from catalog.manufacturer m
      left join catalog.product_model p on p.manufacturer_id=m.id
     where m.status='ACTIVE' and m.slug=$1
     group by m.id,m.name,m.slug,m.country_code,m.official_website`,[slug],
  );
  return result.rowCount ? mapManufacturer(result.rows[0]) : null;
 }
}

function mapManufacturer(row:any) {
 let logoUrl:null|string=null;
 if(row.official_website){
  try {
   const u=new URL(String(row.official_website));
   logoUrl=`https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {}
 }
 return {
  id:row.id,name:row.name,slug:row.slug,countryCode:row.country_code,
  officialWebsite:row.official_website,productCount:Number(row.product_count??0),
  logoUrl,
 };
}
