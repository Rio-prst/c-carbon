# c-carbon-mobile

Farm Risk & Carbon Platform mobile application.

## Stack

- React Native
- Expo
- TypeScript
- Expo Router

## Structure

Folder structure follows the conventions in `docs/ARCHITECTURE.md`:

- `app/` — routing (Expo Router) & screen composition
- `features/` — domain-specific UI and logic
- `components/` — reusable generic UI components
- `services/` — HTTP/API client
- `store/` — global state (auth/session)
- `lib/` — utilities, theme tokens, formatters
- `types/` — shared TypeScript contracts

## Running

Install dependencies from the workspace root:

```bash
pnpm install
```

Start the Expo dev server:

```bash
pnpm --filter c-carbon-mobile run start
```

or directly from this folder:

```bash
pnpm start
```

Open the app via Expo Go or an available emulator.

## Configuration

The mobile API base URL is configured through an environment file (`.env`). The exact variables will be completed together with the environment configuration task in `TASKS.md`.