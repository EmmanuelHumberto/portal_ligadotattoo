import type {
  EditorialDocument, EditorialStatus, EditorialType,
} from './editorial.types';

export class EditorialContent {
  private constructor(
    readonly id:string,
    readonly contentType:EditorialType,
    private _title:string,
    readonly slug:string,
    private _subtitle:string|null,
    private _summary:string|null,
    private _body:EditorialDocument,
    private _status:EditorialStatus,
    readonly origin:'HUMAN'|'AI_ASSISTED'|'INGESTION_ASSISTED',
    private _version:number,
  ) {}

  static draft(input:{
    id:string;contentType:EditorialType;title:string;slug:string;
    subtitle?:string;summary?:string;body:EditorialDocument;
    origin?:'HUMAN'|'AI_ASSISTED'|'INGESTION_ASSISTED';
  }) {
    if (!input.title.trim()) throw new Error('Editorial title is required');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))
      throw new Error('Invalid editorial slug');
    validateDocument(input.body);
    return new EditorialContent(
      input.id,input.contentType,input.title.trim(),input.slug,
      input.subtitle?.trim() || null,input.summary?.trim() || null,
      input.body,'DRAFT',input.origin ?? 'HUMAN',1,
    );
  }

  submitForReview() {
    if (this._status !== 'DRAFT')
      throw new Error('Only draft content can enter review');
    this._status='IN_REVIEW';
  }

  get title(){return this._title;}
  get subtitle(){return this._subtitle;}
  get summary(){return this._summary;}
  get body(){return this._body;}
  get status(){return this._status;}
  get version(){return this._version;}
}

function validateDocument(doc:EditorialDocument) {
  if (doc.version !== 1 || !Array.isArray(doc.blocks))
    throw new Error('Invalid editorial document');
  for (const block of doc.blocks) {
    if (!block || typeof block !== 'object' || !('type' in block))
      throw new Error('Invalid editorial block');
  }
}
