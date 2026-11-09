# Production setup

Rizz uses Firebase Authentication, Supabase data, Vercel web hosting and EAS native builds. No purchased domain is required for Firebase's hosted email verification and password-reset links.

## Configured services

- Firebase project: `rizz-app-e4ec4`. Email/password and email enumeration protection are enabled. Web SDK app: `1:859116047631:web:327d31473e95f34055027a`.
- Supabase: `brakxnutybnobmbdssqt`. Firebase third-party integration is configured for `https://securetoken.google.com/rizz-app-e4ec4`.
- Firebase runtime service account has the `roles/firebaseauth.admin` role. Its credential is a Supabase function secret, excluded from Git, EAS and Vercel uploads.
- EAS: [@rizwan-portfolio-07/RizzApp](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp), ID `70871b7d-8e41-4657-901c-9c10f01e259e`. First release, package/bundle ID `com.rizz.app`.
- Website: https://rizzapp-sage.vercel.app. Public production configuration is installed in Vercel, and the hostname is authorized in Firebase. Deployment currently uses the CLI; the Vercel GitHub integration has not connected to this repository.

All four database migrations and reviewed account mappings have been applied. Hosted tests passed for both workspace roles, owner-managed Rizz IDs and password resets, cross-workspace isolation, financial totals, anonymous denial and immediate deactivation. All temporary hosted records were cleaned up and all pre-existing rows retained. Fuwad is inactive, with his financial history retained. Owners use real verified emails; [team IDs and recovery](MANAGED_RIZZ_IDS.md) are managed by their workspace owner.

## Rehearse before cutover

1. Back up the affected schema and application tables. For an initial cutover, restore into an isolated database and execute all migrations in version order: `202611070001_secure_workspaces.sql`, `202611080001_firebase_identity.sql`, `202611090001_managed_rizz_ids.sql`, then `202611090002_non_deliverable_rizz_logins.sql`. On an already migrated database, apply only pending migrations. Run the schema/data preflight and resolve violations. `supabase/schema.sql` is historical context, not an executable migration.
2. Prepare explicit mappings between existing `public.users.id` and Firebase UIDs. Never attach a legacy account using an email supplied by a client. Preserve user IDs and financial relationships. Existing owners need a password reset and fresh Firebase email verification. The user requested removal of Fuwad's access; deactivate his profile while retaining his financial records.
3. Install the migrations, reviewed mappings, and `private.identity_configuration` project pin in one controlled cutover. The new policies fail closed until the project is configured and identities are mapped. Record each migration version in migration history. Verify row preservation, anonymous denial, workspace isolation and balances before completing cutover.
4. Deploy `supabase/functions/account`. `verify_jwt = false` is deliberate: Firebase Admin verifies issuer, audience, signature, revocation, disabled state and verified-owner or provisioned-member claims before privileged access. Supabase independently verifies Firebase tokens for direct data requests. Workspace roles and active status are authoritative in PostgreSQL.
5. Store `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON` only in Supabase function secrets. Never upload a service account or Supabase service-role key to the browser, EAS or Vercel.

The baseline migration replaces permissive policies, disables anonymous access to tables/reports, normalizes only reviewed cascade relationships, protects creator IDs and validates ledger constraints. Unexpected relationships or invalid records abort migration. Firebase policies pin issuer/audience and require verified owner email or server-provisioned member claims with the current account version. Managed logins use non-deliverable internal aliases; only the owner resets their passwords. Tokens never grant workspace ownership.

The ignored application snapshot has been restored locally. It covers application tables, not Supabase Auth, Storage or a complete cluster backup. Direct CLI database login currently encounters a hosted login-role permission error; the authenticated Management API is available. Use transactionally verified migration operations and preserve recovery evidence. Physical device acceptance remains separate from SQL and screen simulation.

## Public runtime configuration

Copy `.env.production.example` to `.env.production.local` and populate its public settings. Firebase project and auth domain must match. The production Firebase project and Supabase URL pins prevent staging builds from connecting to production. Contract version `5` and the configured server Firebase project are checked remotely before release; setting an environment variable does not migrate a database.

Local development uses `.env.local` with a separate Firebase/Supabase staging pair. Keep legacy `.env` credentials out of release commands. Release scripts set `EXPO_NO_DOTENV=1` and accept only the public allowlist from the production file.

## Validate, build and deploy

```powershell
npm ci
npm run simulate
npm run verify
npm run bundle:check -- ios
npm run bundle:check -- web
$env:DENO_NO_PACKAGE_JSON='1'
npx deno@2 check --config supabase/functions/account/deno.json supabase/functions/account/index.ts
npm run production:check
```

For Vercel, configure the repository root directory as `RizzApp`, upload only the public production settings, and deploy using the checked-in `vercel.json`. `npm run build:web` verifies the backend before exporting `dist`. SPA rewrites preserve direct links. Add the deployed hostname to Firebase authorized domains; retain Firebase's default action-link domain.

The explicit static builder uses `vercel-build` to run that same gate. This prevents Vercel from interpreting the app's client-side `api/*.ts` modules as serverless endpoints. Account operations remain in the authenticated Supabase Edge Function.

```powershell
npm run build:production:android
# Installable Android APK:
npm run build:production:apk
# Requires Apple Developer access and signing:
npm run build:production:ios
```

EAS runs verification again before native compilation. Android signing is configured; Apple signing still needs the appropriate developer account. An AAB/IPA build is not an app-store publication. Listing metadata, privacy/support details, screenshots, signing and store review are additional requirements. Native PDF/sharing and push delivery need physical-device acceptance. The Firebase JS authentication SDK does not require placeholder native Google service files; push configuration is separate.

EAS archives this monorepo from the Git root. The authoritative exclusions are `../.easignore`; the app-level file alone does not protect a Windows monorepo archive. The extracted archive has been checked to exclude `.env` files, private test evidence, credentials and Git history. Archive regression tests preserve required source files and the app lockfile. The initial failed build was deleted after diagnosing the development-env override.

For a later iOS release, run `npm run configure:production:ios` in a local interactive terminal to configure Apple signing without sharing account credentials in chat. Android is the current release priority.

## Evidence and current limitations

Local regression tests cover both workspace roles, disabled accounts, wrong Firebase issuer/audience, unverified identities, financial operations, profile/session races, email-link flows and secure native persistence. Bundle checks use synthetic public settings and do not certify hosted behavior. See `SIMULATION_REPORT.md`, `PRODUCTION_READINESS.md` and the ignored test results for the precise boundaries. Final deployment status should be recorded after the hosted checks and build complete.
