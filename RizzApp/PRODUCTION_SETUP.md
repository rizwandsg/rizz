# Production setup

Rizz uses Firebase Authentication, Supabase data, Vercel web hosting and EAS native builds. No purchased domain is required for Firebase's hosted email verification and password-reset links.

## Configured services

- Firebase project: `rizz-app-e4ec4`. Email/password and email enumeration protection are enabled. Web SDK app: `1:859116047631:web:327d31473e95f34055027a`.
- Supabase: `brakxnutybnobmbdssqt`. Firebase third-party integration is configured for `https://securetoken.google.com/rizz-app-e4ec4`.
- Firebase runtime service account has the `roles/firebaseauth.admin` role. Its credential is a Supabase function secret, excluded from Git, EAS and Vercel uploads.
- EAS: [@rizwan-portfolio-07/RizzApp](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp), ID `70871b7d-8e41-4657-901c-9c10f01e259e`. First release, package/bundle ID `com.rizz.app`.

## Rehearse before cutover

1. Back up the affected schema and application tables. Restore into an isolated database and execute both migrations in order: `202611070001_secure_workspaces.sql`, then `202611080001_firebase_identity.sql`. Run the existing schema/data preflight and resolve violations. `supabase/schema.sql` is historical context, not an executable migration.
2. Prepare explicit mappings between existing `public.users.id` and Firebase UIDs. Never attach a legacy account using an email supplied by a client. Preserve user IDs and financial relationships. Existing owners need a password reset and fresh Firebase email verification. The user requested removal of Fuwad's access; deactivate his profile while retaining his financial records.
3. Install the migrations, reviewed mappings, and `private.identity_configuration` project pin in one controlled cutover. The new policies fail closed until the project is configured and identities are mapped. Record both migration versions in migration history. Verify row preservation, anonymous denial, workspace isolation and balances before completing cutover.
4. Deploy `supabase/functions/account`. `verify_jwt = false` is deliberate: Firebase Admin verifies issuer, audience, signature, revocation, disabled state and email verification before privileged access. Supabase independently verifies Firebase tokens for direct data requests. Workspace roles and active status are authoritative in PostgreSQL.
5. Store `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON` only in Supabase function secrets. Never upload a service account or Supabase service-role key to the browser, EAS or Vercel.

The baseline migration replaces permissive policies, disables anonymous access to tables/reports, normalizes only reviewed cascade relationships, protects creator IDs and validates ledger constraints. Unexpected relationships or invalid records abort migration. The Firebase migration pins issuer/audience and requires verified email. The account function installs only the `authenticated` custom claim; it does not grant an owner role through a token.

The ignored application snapshot has been restored locally. It covers application tables, not Supabase Auth, Storage or a complete cluster backup. Direct CLI database login currently encounters a hosted login-role permission error; the authenticated Management API is available. Use transactionally verified migration operations and preserve recovery evidence. Physical device acceptance remains separate from SQL and screen simulation.

## Public runtime configuration

Copy `.env.production.example` to `.env.production.local` and populate its public settings. Firebase project and auth domain must match. The production Firebase project and Supabase URL pins prevent staging builds from connecting to production. Contract version `3` and the configured server Firebase project are checked remotely before release; setting an environment variable does not migrate a database.

Local development uses `.env.local` with a separate Firebase/Supabase staging pair. Keep legacy `.env` credentials out of release commands. Release scripts set `EXPO_NO_DOTENV=1` and accept only the public allowlist from the production file.

## Validate, build and deploy

```powershell
npm ci
npm run simulate
npm run verify
npm run bundle:check -- ios
npm run bundle:check -- web
npx deno@2 check --node-modules-dir=none supabase/functions/account/index.ts
npm run production:check
```

For Vercel, configure the repository root directory as `RizzApp`, upload only the public production settings, and deploy using the checked-in `vercel.json`. `npm run build:web` verifies the backend before exporting `dist`. SPA rewrites preserve direct links. Add the deployed hostname to Firebase authorized domains; retain Firebase's default action-link domain.

```powershell
npm run build:production:android
# Requires Apple Developer access and signing:
npm run build:production:ios
```

EAS runs verification again before native compilation. Android signing is configured; Apple signing still needs the appropriate developer account. An AAB/IPA build is not an app-store publication. Listing metadata, privacy/support details, screenshots, signing and store review are additional requirements. Native PDF/sharing and push delivery need physical-device acceptance. The Firebase JS authentication SDK does not require placeholder native Google service files; push configuration is separate.

## Evidence and current limitations

Local regression tests cover both workspace roles, disabled accounts, wrong Firebase issuer/audience, unverified identities, financial operations, profile/session races, email-link flows and secure native persistence. Bundle checks use synthetic public settings and do not certify hosted behavior. See `SIMULATION_REPORT.md`, `PRODUCTION_READINESS.md` and the ignored test results for the precise boundaries. Final deployment status should be recorded after the hosted checks and build complete.
