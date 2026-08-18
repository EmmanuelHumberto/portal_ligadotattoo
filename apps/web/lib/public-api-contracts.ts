export type SearchParams=Record<string,string|string[]|undefined>;

export type PageMeta={
 hasMore?:boolean;nextCursor?:string|null;total?:number;
};

export type PublicMedia={
 id?:string;url:string;kind?:string;alt?:string|null;
 attribution?:string|null;variants?:Array<{url:string}>;
};

export type PublicSpecification={
 key:string;name?:string;label?:string;value:unknown;unit?:string|null;
};

export type ProductSummary={
 id:string;slug:string;name:string;manufacturer:string;
 manufacturerSlug:string;brand:{name:string};type:string;productType:string;
 typeLabel:string;lifecycle:string;heroMedia?:PublicMedia|null;
 offerFrom?:{amount:number;currency:string}|null;image?:string;
 badge?:string;
};

export type ProductDetail=ProductSummary&{
 machineType:string;machineTypeLabel:string;summary:string|null;
 description:string|null;canonicalSpecifications:PublicSpecification[];
 specifications:PublicSpecification[];media:PublicMedia[];
 offersSummary?:{fromAmount:number;currency:string;observedAt:string}|null;
 documents:Array<{
  id:string;title:string;url:string;mimeType:string;byteSize:number;
 }>;
 isSyntheticFixture:boolean;
};

export type ProductPage={items:ProductSummary[];meta:PageMeta};
export type ProductComparison={items:ProductDetail[]};

export type CatalogFacet={value:string;label:string;count?:number};
export type CatalogFacets={
 brands:CatalogFacet[];types:CatalogFacet[];
 applications:CatalogFacet[];priceBands:CatalogFacet[];
};

export type Manufacturer={
 id:string;name:string;slug:string;countryCode?:string|null;
 logoUrl?:string|null;productCount:number;officialWebsite?:string|null;
};
export type ManufacturerPage={items:Manufacturer[]};

export type PublicOffer={
 listingId:string;seller:string;amount:number|null;currency:string|null;
 availability:string;observedAt:string;outboundUrl:string;
 storeDomain?:string|null;
};
export type OfferFeedItem=Omit<PublicOffer,'amount'|'currency'>&{
 amount:number;currency:string;
 product:{
  id:string;slug:string;name:string;type:string;
  manufacturer:{name:string;slug:string};
 };
 amountUsd?:number;
};
export type OfferPage={items:OfferFeedItem[];meta:PageMeta};
export type ProductOffers={items:PublicOffer[]};

export type EditorialStep={title:string;body:string};
export type EditorialBlock=
 | {type:'paragraph'|'quote';text:string}
 | {type:'heading';text:string;level?:number}
 | {type:'image';url?:string;mediaId?:string;caption?:string;alt?:string}
 | {type:'callout';title?:string;text:string}
 | {type:'steps';items?:EditorialStep[]};
export type EditorialBody={version?:number;blocks:EditorialBlock[]};
export type EditorialEvent={
 startsAt:string;endsAt?:string|null;timezone?:string;venueName?:string|null;
 city?:string|null;countryCode?:string|null;officialUrl?:string|null;
 status:string;
};
export type EditorialContent={
 id:string;contentType:'NEWS'|'BLOG'|'EVENT';slug:string;title:string;
 subtitle?:string|null;summary?:string|null;body:EditorialBody;
 coverUrl?:string|null;publishedAt:string;updatedAt?:string|null;
 event?:EditorialEvent|null;media?:PublicMedia[];
};
export type EditorialPage={items:EditorialContent[];meta:PageMeta};

export type SearchResult={
 type:string;id:string;title:string;subtitle?:string|null;url:string;
};
export type SearchResultPage={items:SearchResult[];meta:PageMeta};
