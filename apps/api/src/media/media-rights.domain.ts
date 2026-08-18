export type RightsStatus=
  'UNKNOWN'|'PENDING'|'PERMITTED'|'RESTRICTED'|'EXPIRED'|'TAKEDOWN';

export class MediaRights {
  static create(input:{
    id:string;mediaAssetId:string;status:RightsStatus;basis?:string;
    licenseName?:string;sourceUrl?:string;expiresAt?:Date;notes?:string;
  }) {
    if (!input.mediaAssetId) throw new Error('mediaAssetId required');
    if (input.status==='PERMITTED' && !input.basis)
      throw new Error('Rights basis required for publication permission');
    const expiresAt=input.expiresAt??null;
    if (expiresAt && Number.isNaN(expiresAt.getTime()))
      throw new Error('Invalid rights expiry');
    return {
      id:input.id,mediaAssetId:input.mediaAssetId,status:input.status as RightsStatus,
      basis:input.basis ?? null,licenseName:input.licenseName ?? null,
      sourceUrl:input.sourceUrl ?? null,expiresAt,
      notes:input.notes ?? null,
    };
  }
}
