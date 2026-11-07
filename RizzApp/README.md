# Rizz — project expenses and payments

Expo SDK 58 / React Native 0.88 app with Clerk authentication and Supabase workspace data. The deployable application is this directory. `myClerkApp` is a separate starter example and is excluded from the application's checks.

## Test before applying anything

Use Node 22.20 and npm 10 or newer. From `RizzApp`:

```powershell
npm ci
npm run simulate
npm run verify
npm run bundle:check -- ios
```

These checks run TypeScript, lint errors, regression tests, secret checks, and Android/iOS JavaScript/Hermes bundle exports. The database tests use a disposable in-process PostgreSQL engine. Bundle checks use fake public configuration. They do not deploy or use your real backend.

`npm run simulate` executes the complete automated suite, including all 28 screen routes and three navigators, actual authentication-provider lifecycle tests, and two-workspace SQL permission/workflow tests. It writes `test-results/simulation.json` and `test-results/simulation-manifest.json` with results, timestamp, and source checksum. Native controls, Clerk, and API responses are mocked in screen tests; SQL policy tests execute the actual migration in PGlite. See [SIMULATION_REPORT.md](SIMULATION_REPORT.md) for coverage and limits. These are executable simulations, not a device or hosted-backend acceptance certificate.

For continuous regression tests, run `npm run test:watch`. For the Edge Function, install Deno 2 and run `deno check supabase/functions/account/index.ts`. GitHub Actions repeats these checks. The production dependency audit now passes its high-severity gate; five moderate tooling findings remain. See [the review and acceptance matrix](PRODUCTION_READINESS.md) for current blockers and test limits.

## Create a staging backend

1. Create a dedicated Supabase staging project and a Clerk test instance. Enable Clerk as a third-party auth provider in that Supabase project. Configure verified email sign-up and password recovery. Owners and members now both use Clerk; the old local-password workflow is disabled.
2. For existing data, restore a sanitized copy into staging, run `supabase/preflight.sql`, and resolve invalid records. Review the existing schema against `supabase/migrations/202611070001_secure_workspaces.sql`. `supabase/schema.sql` is an old context snapshot and cannot be executed as a migration.
3. Apply the versioned migration to staging only. For a new empty staging project it also creates the tables. For existing Clerk users, retain the stored Clerk IDs. For legacy team users, provision verified identities and map each to the existing profile ID using a reviewed administrator procedure. There is deliberately no client-side email-based account linking.
4. Store the staging Clerk secret as `CLERK_SECRET_KEY` using Supabase Edge Function secrets. Never put a Clerk secret or Supabase service-role key in Expo configuration. Deploy the `account` function to the staging project. Its `verify_jwt = false` configuration is deliberate: every request must successfully call `request_identity` through the Supabase gateway with its Clerk bearer token before privileged operations occur.
5. If Realtime is needed, have the database administrator review publication settings before enabling it. The app uses INSERT/UPDATE events; `supabase/preflight.sql` rejects DELETE publication for private tables in `supabase_realtime`, because DELETE events do not enforce row-level security. Custom publications also require review. The app's backend-version check does not certify publication safety. Push delivery additionally requires Firebase/APNs credentials and platform-specific staging configuration; it is not verified by local tests.

With a Supabase CLI installation, use an explicit staging project reference for deployment:

```powershell
supabase functions deploy account --project-ref YOUR_STAGING_PROJECT_REF
```

Do not paste production connection strings into test commands. Do not run the legacy snapshot against any database. Keep server secrets out of source control and terminal transcripts.

## Run the app against staging

Copy `.env.example` to `.env.local` and replace the public placeholders with staging values. A previous local `.env` may still exist; remove obsolete secret settings and confirm the effective environment. Set `EXPO_PUBLIC_APP_ENV=staging` to use the separate `com.rizz.app.staging` application identifier. Test environments require a Clerk test publishable key.

```powershell
npm start
```

Use a native development build for full PDF/sharing/notification support. Existing native builds must be rebuilt after the native dependency changes; updating JavaScript alone is insufficient.

## Build an installable preview

Configure the EAS `preview` environment with the staging public settings, `EXPO_PUBLIC_BACKEND_CONTRACT_VERSION=2`, and the real production Supabase URL in `EXPO_PUBLIC_PRODUCTION_SUPABASE_URL`. The latter is only an isolation guard: a preview is rejected if its backend URL matches production. The preview backend must have the version 2 contract installed.

```powershell
npx eas-cli build --platform android --profile preview
```

The result is an internal APK named `Rizz (staging)` with a separate package ID. No build or deployment is triggered by the verification commands. Preview builds run automated checks and a read-only backend contract check. Production additionally runs `npm run audit:release`, which now passes with zero high/critical findings and five moderate tooling findings. Production uses store distribution and an Android App Bundle.

After installing the preview on a staging device, run the prepared Maestro smoke flow with staging-only credentials and a unique project name:

```powershell
maestro test -e TEST_OWNER_EMAIL=$env:TEST_OWNER_EMAIL -e TEST_OWNER_PASSWORD=$env:TEST_OWNER_PASSWORD -e TEST_PROJECT_NAME=$env:TEST_PROJECT_NAME .maestro/smoke.yaml
```

The flow creates a project in staging. Complete the two-owner/member acceptance matrix before release; a successful bundle export is not a native device acceptance result.

## Production build

The app is linked to [@rizwan-portfolio-07/RizzApp](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp). Complete [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md), including live Clerk settings, the migrated Supabase backend, and signing. Run `npm run production:check`, then `npm run build:production:android` or `npm run build:production:ios`. These commands run local checks before requesting a cloud build. Production uses a separate `.env.production.local`; the existing `.env` is development-only.

## Data and permission rules

Owners and active members can read and modify project/expense/payment data in their own workspace. Only owners can manage members. Deactivation retains financial history and revokes data access. User ID, record ID, and creation timestamp cannot be reassigned by clients. Updates from forms compare the loaded record timestamp and require reload after a conflict.

Projects/expenses with dependent financial rows cannot be deleted automatically. Vendor payments must reference the same expense/project and cannot exceed the remaining expense amount. Financial input accepts finite, positive amounts with at most two decimal places; project budgets may be zero. Backend constraints also enforce these rules when the UI is bypassed.

Both `payments` (legacy receipts) and `customer_payments` contribute to received totals. Existing business duplicates must be reconciled during staging migration. Manual expense payment-status labels do not substitute for actual vendor payment rows; reconcile old labels with the ledger before relying on vendor-balance summaries.

`npm run check:secrets` checks working files and tracking status. It does not erase Git history or rotate credentials. Rotate any real credentials previously committed in `.env` before release. The complete deployment/recovery procedure and known limitations are in [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).
