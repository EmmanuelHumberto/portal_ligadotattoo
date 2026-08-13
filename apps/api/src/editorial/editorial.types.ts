export type EditorialType =
  | 'NEWS' | 'BLOG' | 'EVENT' | 'TECHNICAL_ARTICLE' | 'NOTICE';

export type EditorialStatus =
  | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SCHEDULED'
  | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type EditorialBlock =
  | { type:'paragraph'; text:string }
  | { type:'heading'; level:2|3; text:string }
  | { type:'image'; mediaId:string; caption?:string }
  | { type:'quote'; text:string; attribution?:string }
  | { type:'callout'; tone:'info'|'warning'; title?:string; text:string }
  | { type:'table'; columns:string[]; rows:string[][] }
  | { type:'steps'; items:Array<{title:string;body:string}> }
  | { type:'productReference'; productId:string }
  | { type:'technicalIssueReference'; issueId:string }
  | { type:'sourceList'; sourceIds:string[] };

export type EditorialDocument = {
  version:1;
  blocks:EditorialBlock[];
};
