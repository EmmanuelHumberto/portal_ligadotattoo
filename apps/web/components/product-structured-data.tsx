import {JsonLd} from './json-ld';
import {productJsonLd} from '../lib/structured-data';
import type {
 ProductDetail,PublicOffer,
} from '../lib/public-api-contracts';

export function ProductStructuredData({product,offers}:{
 product:ProductDetail;offers:PublicOffer[];
}){
 return <JsonLd data={productJsonLd(product,offers)}/>;
}
