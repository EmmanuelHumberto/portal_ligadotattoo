begin;

create temporary table quarantined_catalog_products on commit drop as
select distinct subject_id id
  from knowledge.canonical_fact
 where subject_type='PRODUCT_MODEL' and valid_to is null
   and decision_reason in ('CATALOG_IMPORT','CATALOG_TRANSLATED');

insert into knowledge.canonical_proposal(
  id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
  status,created_by,created_at,version
)
select gen_random_uuid(),f.subject_type,f.subject_id,f.property_key,f.value,
       p.evidence_ids,'PENDING','migration:086-authority-review',now(),1
  from knowledge.canonical_fact f
  join knowledge.canonical_proposal p on p.id=f.proposal_id
 where f.valid_to is null
   and f.decision_reason in ('CATALOG_IMPORT','CATALOG_TRANSLATED')
   and not exists (
     select 1 from knowledge.canonical_proposal pending
      where pending.subject_type=f.subject_type
        and pending.subject_id=f.subject_id
        and pending.property_key=f.property_key
        and pending.status='PENDING'
        and pending.proposed_value=f.value
   );

update knowledge.canonical_fact
   set valid_to=greatest(now(),valid_from+interval '1 microsecond')
 where valid_to is null
   and decision_reason in ('CATALOG_IMPORT','CATALOG_TRANSLATED');

update catalog.product_model product
   set lifecycle='UNKNOWN',version=version+1,updated_at=now()
 where product.id in (select id from quarantined_catalog_products)
   and not exists (
     select 1 from knowledge.canonical_proposal curated
      where curated.subject_type='PRODUCT_MODEL'
        and curated.subject_id=product.id and curated.status='APPROVED'
        and curated.created_by not in ('catalog','catalog-discovery')
   );

update commerce.listing listing
   set status='PAUSED',availability='UNKNOWN',version=version+1,updated_at=now()
 where listing.product_model_id in (
   select id from catalog.product_model where lifecycle='UNKNOWN'
 );

create temporary table quarantined_catalog_media on commit drop as
select rights.media_asset_id,rights.source_url
  from media.media_rights rights
 where rights.is_current=true and rights.status='PERMITTED'
   and rights.decided_by='system'
   and rights.basis in (
     'MANUFACTURER_PUBLIC_IMAGE','MANUFACTURER_PUBLIC_DOCUMENT'
   );

update media.media_rights rights
   set is_current=false
 where rights.is_current=true
   and rights.media_asset_id in (
     select media_asset_id from quarantined_catalog_media
   );

insert into media.media_rights(
  id,media_asset_id,status,basis,source_url,is_current,decided_by,decided_at
)
select gen_random_uuid(),media_asset_id,'PENDING','REVIEW_REQUIRED',source_url,
       true,'migration:086-authority-review',now()
  from quarantined_catalog_media;

update media.media_asset asset
   set rights_status='PENDING',version=version+1,updated_at=now()
 where asset.id in (select media_asset_id from quarantined_catalog_media);

commit;
