# Local Bootstrap

Prerequisites:
- Node.js 22;
- npm with workspace support;
- Docker/Compose.

Procedure:
1. copy `.env.example` to `.env`;
2. `docker compose -f infra/compose.yml up -d`;
3. `npm install`;
4. export/load `.env`;
5. `npm run db:migrate`;
6. `npm run bootstrap`;
7. `npm run dev`.

Expected endpoints:
- Web: http://localhost:3000
- Web health: http://localhost:3000/api/health
- API live: http://localhost:3001/health/live
- API ready: http://localhost:3001/health/ready
- MinIO console: http://localhost:9001

AI keys are optional until an AI workload is exercised.
