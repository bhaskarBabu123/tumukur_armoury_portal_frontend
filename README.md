# Armoury Management System — updated issue/return workflow

This update preserves the existing React + Vite frontend and Express + MongoDB backend while improving officer selection, partial returns, consumption reporting, empty-case tracking and transaction reconciliation.

## Main changes

- Fingerprint enrollment is optional when creating an officer.
- Issue page supports manual officer selection. Fingerprint verification remains optional for officers who have a registered template and a working MFS100 service.
- Return page supports manual officer selection and loads outstanding items by the exact original issue transaction line.
- Multiple partial returns for the same inventory item are tracked against their original issue transaction, not just by inventory item ID.
- Arms can be physically returned or recorded as not returned with a reason and supporting documents. A non-return report remains pending approval and does not mark the arm as returned or release it to available stock.
- Ammunition and munition returns separately record unused quantity returned, consumed quantity, empty cases received and missing empty cases.
- Only unused ammunition/munition is added back to available stock.
- Consumed quantity reduces the usable stock total and is stored in a separate UsedMaterial ledger.
- Empty cases are counted in a separate field and UsedMaterial ledger; they never increase usable ammunition/munition stock.
- Documents are required for consumption, empty cases, missing cases and a declared arm non-return. Remarks are also required.
- Dashboard counters now include consumption and empty-case totals. Reports include a Used Items & Empty Cases tab.
- Return documents are served through an authenticated endpoint rather than the public static uploads directory.
- MFS100 client has timeout and network-error handling.
- Issue and return writes use MongoDB sessions/transactions to avoid partially updated stock records.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set your MongoDB Atlas connection string, a new JWT secret, and admin credentials.
2. Copy root `.env.example` to root `.env` and set `VITE_API_URL` if your API is not at `https://main-armoury-portal-backend.onrender.com/api`.
3. Install frontend dependencies in the project root: `npm install`.
4. Install backend dependencies: `cd backend && npm install`.
5. Start backend from the backend folder: `npm run dev`.
6. Start frontend from the project root in another terminal: `npm run dev`.

### MongoDB requirement

Issue and return operations use MongoDB multi-document transactions. MongoDB Atlas supports this. A local MongoDB server must be configured as a replica set; a standalone local MongoDB instance will reject transaction operations.

## Important migration and security notes

- The original source contained a hard-coded MongoDB connection string. It has been removed and the backend now reads `MONGODB_URI` from `backend/.env`. Rotate the database password/credentials that were present in the original source and rotate the JWT secret and admin password before deployment.
- The original `.env`, `.git` history, `node_modules`, and uploaded officer photos/documents were intentionally excluded from this ZIP. Restore approved profile images only if required. Do not put sensitive police reports or real fingerprint templates in source control.
- Historical return records created by the old code did not consistently retain the source issue transaction or consumed quantity. The new API uses a FIFO fallback for older unlinked return records so old returns remain visible, but old consumption/empty-case history cannot be reconstructed if it was never saved. Reconcile legacy physical stock and old records with the responsible armoury officer before using the new totals as an official ledger. After taking a backup, run `cd backend && npm run reconcile:issued` to rebuild current issued counters from the transaction ledger; it deliberately does not guess historical consumption or change total/available stock.
- Existing deployments may need a database backup and a controlled migration/reconciliation before the updated code is deployed.

## New/updated API endpoints

- `GET /api/transactions/officer/:officerId/outstanding` — exact outstanding issue lines for the officer.
- `POST /api/transactions/return` — partial return, consumption, empty-case and document submission.
- `GET /api/transactions/used-materials` — used-item and empty-case ledger.
- `GET /api/transactions/documents/:filename` — authenticated document download.

## Validation performed in this workspace

- Node syntax checks passed for backend JavaScript files.
- Frontend JavaScript/JSX syntax transpilation passed for all 21 source files.
- Backend model and route modules loaded successfully.
- Officer schema validation passed without fingerprint data.
- Issue and return transaction schema validation passed for partial returns, consumption, empty cases and pending arm non-return disposition.

A live MongoDB integration test, production Vite build, and MFS100 hardware test were not possible in this environment. Test on a database backup/staging database first and verify all counts before production use.
