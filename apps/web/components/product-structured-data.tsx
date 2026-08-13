import {JsonLd} from './json-ld';
import {productJsonLd} from '../lib/structured-data';

export function ProductStructuredData({product,offers}:{product:any;offers:any[]}){
 return <JsonLd data={productJsonLd(product,offers)}/>;
}
