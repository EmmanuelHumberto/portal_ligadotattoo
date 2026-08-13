export type StoredObject={
  storageKey:string;
  mimeType:string;
  byteSize:number;
  sha256:string;
};

export interface MediaStoragePort {
  put(input:{
    key:string;body:Buffer;mimeType:string;
  }):Promise<StoredObject>;
  signedUploadUrl?(input:{
    key:string;mimeType:string;expiresInSeconds:number;
  }):Promise<{url:string;headers?:Record<string,string>}>;
  delete(key:string):Promise<void>;
}
export const MEDIA_STORAGE=Symbol('MEDIA_STORAGE');

export interface MediaDeliveryPort {
  url(storageKey:string):Promise<string>;
}
export const MEDIA_DELIVERY=Symbol('MEDIA_DELIVERY');
