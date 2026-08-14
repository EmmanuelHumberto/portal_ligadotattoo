begin;

create unique index if not exists uq_story_candidate_snapshot
  on editorial.story_candidate(source_snapshot_id)
  where source_snapshot_id is not null;

commit;
