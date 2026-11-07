# Production setup

The application is linked to [@rizwan-portfolio-07/RizzApp](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp), project ID `70871b7d-8e41-4657-901c-9c10f01e259e`. The previous project belonged to an account that the current Expo login could not access. This is a first store release; no old signing credential was replaced.

## Required hosted services

The existing local `.env` was checked against the providers: Clerk reports a **development** instance, and the configured Supabase backend returns `PGRST202` for `backend_contract_version`. Its public client key cannot apply database migrations. These values cannot be promoted to production by renaming the build profile.

1. Supabase CLI login and linking to the backend configured in `.env` are complete. Keep a separate staging backend and rehearse the migration there using the existing README and acceptance matrix before applying it to production. Existing databases require a full backup, `supabase/preflight.sql`, and reconciliation of account mappings and financial data. The local application snapshot described below does not replace a complete hosted recovery procedure.
2. Create the Clerk production instance using a domain you control and complete its DNS setup. Enable email/password authentication and verified email recovery. Register the Android package and iOS bundle identifier `com.rizz.app` and the application's redirect URLs. See [Clerk's production instructions](https://clerk.com/docs/guides/development/deployment/production).
3. Configure Clerk third-party authentication in Supabase. Apply `supabase/migrations/202611070001_secure_workspaces.sql` to the explicitly selected, rehearsed backend. Store the production `CLERK_SECRET_KEY` in Supabase function secrets and deploy `supabase/functions/account` with the explicit project reference. Never store this secret in EAS, the app bundle, or a tracked file.
4. Copy `.env.production.example` to `.env.production.local` and fill in **public** production values. Use the live Clerk publishable key and the production Supabase publishable/anon key. The production URL fields must point to the same backend. `EXPO_PUBLIC_BACKEND_CONTRACT_VERSION=2` is checked against the server; setting the variable does not install the migration.
5. Rotate any real server secrets previously committed in Git history. Complete the device acceptance matrix in `PRODUCTION_READINESS.md`, including two workspace owners and a member, authentication, exports, and financial updates.

## Hosted inspection and migration rehearsal

Read-only inspection of the configured backend found disabled table RLS, permissive policies, legacy reports running with their owner's permissions, cascading financial relationships, an existing role constraint, and a missing payment creator foreign key. The revised migration preserves the role-enum constraint, adds the workspace relationship check separately, converts only the reviewed relationships to non-cascading deletion, validates existing links, and installs missing links. Unexpected references, unreviewed cascades, invalid records, and materialized reports stop the transaction. Reports depending on the application tables, including nested reports in other schemas, now execute with the caller's permissions and lose anonymous grants.

The schema-only fixture in `tests/fixtures/hosted-legacy-schema.sql` contains no customer records. Regression tests use synthetic identities and verify record preservation, legacy report visibility/isolation, anonymous denial, delete protection, and rollback. A separate local application-data snapshot was restored into an isolated database, sanitized, and migrated successfully with every stored record preserved. Sensitive snapshots and local evidence remain under ignored `test-results/hosted-audit/`, excluded from Git and EAS uploads.

No hosted migration or Edge Function deployment has been applied. Remaining cutover work includes production Clerk setup (no owned domain is available yet), reviewed mappings for existing account IDs and placeholder email addresses, secret rotation, a complete hosted backup/recovery path, and staging/device acceptance. The CLI's direct database login-role initialization currently fails with a role-permission error; read-only Management API queries work. Resolve that hosted role issue before using CLI commands requiring a direct database connection. The local snapshot covers application tables only, not Auth, Storage, secrets, or cluster configuration.

## Build and distribution

Use Node 22.20 and EAS CLI 27.5 or newer. From this directory:

```powershell
npm run production:check
npm run build:production:android
# For the Apple App Store, with an Apple Developer membership:
npm run build:production:ios
```

The build commands require a complete `.env.production.local`, validate the backend contract and dependency audit, run the tests and Android/iOS bundle exports, then upload only the approved public settings to EAS's production environment. Only after these checks pass do they request an EAS build. Each platform's first build will require signing credentials. EAS manages version increments remotely. The local `.env` and server secrets are excluded from build archives.

An Android store build creates an AAB; an iOS store build creates an IPA. A successful build does not mean the app is listed publicly. Store submission still requires the appropriate developer accounts, app records, signing, privacy/support information, screenshots, and store review. Verify the exact build before submitting it. Firebase/APNs push credentials and actual delivery need separate verification.

SDK 58 requires iOS 16.4 or later for this app. Use the EAS cloud build commands above on Windows: local native generation encountered an upstream Windows path-globbing stall. CI checks native configuration generation on Linux; signed compilation and device testing are still required.
