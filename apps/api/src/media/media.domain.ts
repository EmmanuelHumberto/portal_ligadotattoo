export type MediaRightsStatus =
  | 'UNKNOWN' | 'PENDING' | 'PERMITTED' | 'RESTRICTED' | 'EXPIRED' | 'TAKEDOWN';

export class MediaAsset {
  private constructor(
    readonly id: string,
    readonly kind: string,
    readonly storageKey: string,
    readonly mimeType: string,
    readonly byteSize: number,
    readonly sha256: string,
    private _rightsStatus: MediaRightsStatus,
    private _status: 'ACTIVE'|'INACTIVE',
    private _version: number,
  ) {}

  static register(input: {
    id:string; kind:string; storageKey:string; mimeType:string;
    byteSize:number; sha256:string;
  }) {
    if (input.byteSize < 0) throw new Error('Invalid media size');
    return new MediaAsset(
      input.id,input.kind,input.storageKey,input.mimeType,input.byteSize,
      input.sha256,'UNKNOWN','ACTIVE',1,
    );
  }

  setRights(status: MediaRightsStatus) {
    this._rightsStatus = status;
  }

  canPublish() {
    return this._status === 'ACTIVE' && this._rightsStatus === 'PERMITTED';
  }

  get rightsStatus(){ return this._rightsStatus; }
  get status(){ return this._status; }
  get version(){ return this._version; }
}
