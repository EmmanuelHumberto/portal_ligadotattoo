begin;

drop index if exists uq_story_candidate_snapshot;

create unique index uq_story_candidate_snapshot
  on editorial.story_candidate(source_snapshot_id);

commit;
