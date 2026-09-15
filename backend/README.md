# c-carbon-backend

Farm Risk & Carbon Platform REST API.

## Stack

- NestJS
- Node.js
- TypeScript
- PostgreSQL

## Structure

Domain structure follows the conventions in `docs/ARCHITECTURE.md`:

```
backend/
└── src/
    ├── app.module.ts
    ├── main.ts
    ├── common/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── farms/
    │   ├── farm-data/
    │   ├── insurance/
    │   ├── scoring/
    │   ├── rewards/
    │   ├── carbon/
    │   ├── corporate/
    │   └── admin/
    └── config/
```

Controllers handle transport, services handle business logic, and the persistence layer handles database access.

## Running

Install dependencies from the workspace root:

```bash
pnpm install
```

Start the development server:

```bash
pnpm --filter c-carbon-backend run start:dev
```

or directly from this folder:

```bash
pnpm run start:dev
```

The server listens on the `PORT` variable (default 3000).

## Configuration

Copy `.env.example` to `.env` and fill in the variables:

```env
DATABASE_URL=
JWT_SECRET=
PORT=3000
```

Details will be completed during the backend initialization and environment configuration tasks in `TASKS.md`.