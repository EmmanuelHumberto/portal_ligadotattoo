begin;

alter table editorial.story_candidate
  add column if not exists image_media_id uuid null
    references media.media_asset(id);

commit;
