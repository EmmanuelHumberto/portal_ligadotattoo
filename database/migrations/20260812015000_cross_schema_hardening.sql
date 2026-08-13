BEGIN;
ALTER TABLE knowledge.claim ADD CONSTRAINT claim_snapshot_fk
 FOREIGN KEY(source_snapshot_id) REFERENCES ingestion.snapshot(id);
ALTER TABLE knowledge.evidence_reference ADD CONSTRAINT evidence_snapshot_fk
 FOREIGN KEY(source_snapshot_id) REFERENCES ingestion.snapshot(id);
ALTER TABLE knowledge.evidence_reference ADD CONSTRAINT evidence_lab_run_fk
 FOREIGN KEY(laboratory_run_id) REFERENCES laboratory.processing_run(id);
ALTER TABLE knowledge.evidence_reference ADD CONSTRAINT evidence_technical_issue_fk
 FOREIGN KEY(technical_issue_id) REFERENCES service.technical_issue(id);
CREATE INDEX claim_subject_property_idx ON knowledge.claim(subject_type,subject_id,property_definition_id);
CREATE INDEX canonical_subject_property_idx ON knowledge.canonical_fact(subject_type,subject_id,property_definition_id);
CREATE INDEX ingestion_target_due_idx ON ingestion.crawl_target(status,next_run_at,priority DESC);
COMMIT;
