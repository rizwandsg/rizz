# Rizz — project expenses and payments

Expo SDK 58 / React Native 0.88 app with Firebase Authentication and Supabase workspace data. Vercel hosts the web app; EAS builds native releases. The deployable application is this directory. `myClerkApp` is an excluded historical starter.

## Test before applying

Use Node 22.20 and npm 10 or newer:

```powershell
npm ci
npm run simulate
npm run verify
npm run bundle:check -- ios
npm run bundle:check -- web
```

The suite exercises screen handlers and navigation with mocked platform/API adapters, account lifecycle races, both workspace roles, SQL policies and financial constraints in disposable PGlite databases. `simulate` writes ignored JSON evidence and a source checksum. Bundle checks use synthetic public settings and do not contact production. Native-device and hosted acceptance are separate checks. See [SIMULATION_REPORT.md](SIMULATION_REPORT.md) for coverage boundaries.

The account function is checked with Deno 2:

```powershell
$env:DENO_NO_PACKAGE_JSON='1'
npx deno@2 check --config supabase/functions/account/deno.json supabase/functions/account/index.ts
```

## Authentication and data

Owners and team members sign in through Firebase email/password authentication. A verified email is required before workspace access. Firebase hosts verification and password-reset links on its default domain. Native sessions use encrypted SecureStore with chunked, serialized writes and corruption recovery. Browser persistence is managed by Firebase.

Supabase verifies Firebase tokens; SQL policies pin the Firebase issuer/audience and scope data to active workspaces. Only owners manage team members. Deactivation retains financial history. Creator IDs, ledger relationships, balances and numeric precision are validated by the database. Account synchronization uses Firebase Admin on the server and never links a legacy profile using a client-supplied email.

## Configuration and deployment

Follow [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for current service IDs, migration procedure, public environment settings and deployment commands. Development/staging require separate Firebase and Supabase projects. Copy `.env.example` to `.env.local` and populate staging settings before `npm start`.

Production uses `.env.production.local` with only the approved public fields in `.env.production.example`. Admin credentials belong only in Supabase function secrets. Environment files, private snapshots, credentials and local test evidence are excluded from Git and deployment archives.

```powershell
npm run production:check
npm run build:web
npm run build:production:android
# Installable Android APK:
npm run build:production:apk
# Requires Apple Developer access and signing:
npm run build:production:ios
```

Release checks verify backend contract version 5 and the configured Firebase project before a production bundle/build. Vercel uses the checked-in SPA rewrites and build configuration. EAS uploads only the public production settings. A successful native build still requires device acceptance and store submission/review. See [Rizz ID setup and owner-managed recovery](MANAGED_RIZZ_IDS.md).

For an initial database cutover, preserve profile IDs and provision reviewed Firebase mappings. Apply all four versioned migrations in order. Already migrated installations apply only pending migrations. `scripts/prepare-cutover.cjs` generates an atomic initial-cutover SQL file that locks the affected tables, rejects a stale snapshot, checks record preservation, installs mappings and records migration history. Rehearse the exact file before applying it. It contains private snapshot data and belongs under ignored `test-results/`, never source control.

`supabase/schema.sql` is a historical snapshot, not an executable migration. `scripts/cleanupClerkUsers.ts` is a legacy administration script and is not used by the app or release workflow.
