# AR-27 Test Matrix

## Editorial domain
- valid structured draft
- invalid slug rejected
- invalid document rejected
- draft enters review only from DRAFT

## Workflow
- write capability required
- approve capability required
- publish capability required
- approval reason required
- expected version enforced
- only approved content publishes
- approved content schedules
- scheduled content publishes when due
- audit written
- publication outbox written

## Media
- permitted media publishes
- unknown/pending/restricted/expired/takedown media blocks publication

## AI
- editorial code calls Provider Hub port
- provider/model provenance persisted
- AI result remains suggestion
- AI draft does not create canonical fact
- failed provider routing does not create published content

## Public
- drafts invisible
- review content invisible
- approved but unpublished invisible
- published news visible
- published blog visible
- published technical article visible
- published event visible
- slug 404 for unpublished content

## Search/cache
- publication queues search projection
- editorial search route is correct
- feed cache invalidation created

## Security
- public editorial GET does not require auth
- admin editorial endpoints require auth/capabilities
