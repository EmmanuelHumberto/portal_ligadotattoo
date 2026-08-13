import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { Manufacturer } from './manufacturer.domain';

@Injectable()
export class ManufacturerRepository {
  async findBySlug(slug: string, tx: Tx): Promise<Manufacturer | null> {
    const r = await tx.query(
      `select id,name,slug,official_website,country_code,status,version
       from catalog.manufacturer where slug=$1`,
      [slug],
    );
    return r.rowCount ? Manufacturer.rehydrate(r.rows[0]) : null;
  }

  async insert(entity: Manufacturer, tx: Tx): Promise<void> {
    await tx.query(
      `insert into catalog.manufacturer
       (id,name,normalized_name,slug,official_website,country_code,status,version)
       values ($1,$2,lower($2),$3,$4,$5,$6,$7)`,
      [
        entity.id, entity.name, entity.slug, entity.officialWebsite,
        entity.countryCode, entity.status, entity.version,
      ],
    );
  }
}
