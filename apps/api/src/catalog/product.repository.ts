import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { ProductModel } from './product-model.domain';

@Injectable()
export class ProductRepository {
  async insert(p: ProductModel, tx: Tx) {
    await tx.query(
      `insert into catalog.product_model
       (id,manufacturer_id,product_type_key,name,normalized_name,slug,brand_id,model_code,lifecycle,version)
       values ($1,$2,$3,$4,lower($4),$5,$6,$7,$8,$9)`,
      [
        p.id,p.manufacturerId,p.productTypeKey,p.name,p.slug,
        p.brandId,p.modelCode,p.lifecycle,p.version,
      ],
    );
  }

  async list(_limit = 50) {
    throw new Error('Bind read pool/query service in application composition');
  }
}
