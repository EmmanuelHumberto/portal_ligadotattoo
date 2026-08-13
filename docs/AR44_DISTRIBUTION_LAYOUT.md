# Distribution Layout

Source distribution:
- apps/web
- apps/api
- apps/worker
- packages/contracts
- sql
- infra
- config
- scripts
- docs
- test

Release distribution references immutable images rather than copying node_modules
or local build output.

Required release metadata:
- release ID;
- Git SHA;
- Web image digest;
- API image digest;
- Worker image digest;
- migration set;
- staging evidence location.
