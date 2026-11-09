# Release verification

The website is deployed at https://rizzapp-sage.vercel.app with Firebase Authentication and Supabase data. Android is the current store-build priority. iOS signing is deferred.

## Completed

- Both SQL migrations were rehearsed against a restored application snapshot, then applied in one transaction with exact record-preservation checks and migration history.
- Existing owner mappings preserve profile IDs. Owners need a password reset and fresh Firebase email verification. Fuwad's access is disabled; his transaction history remains.
- Anonymous table/report reads are denied. Active owners and members share their workspace; other workspaces are isolated. Tokens from an incorrect Firebase project and unverified identities fail closed.
- Hosted smoke tests passed 13 checks covering real password login, verified/unverified accounts, owner/member data visibility, team permissions, ledger totals, report isolation and immediate deactivation. All temporary identities and records were removed, restoring original table counts.
- 319 local tests pass across 28 files. The suite covers SQL constraints and permissions, authentication/session races, screen handlers and navigation, secure persistence, data validation, exports and build-archive exclusions.
- Browser checks passed on the deployed authentication forms at phone and desktop sizes, with visible validation and no horizontal overflow or uncaught page errors.
- Android, iOS and web bundle exports passed. GitHub Actions also passed Linux native configuration generation and Deno function checking for the Firebase migration commit.
- Dependency audit has no high/critical production findings. Five moderate Expo tooling findings remain; forcing the suggested SDK downgrade would be incompatible.
- The actual EAS archive excludes private environment/evidence/credential files and Git history. A root-level ignore file fixes Windows monorepo archive handling; required source and lockfiles are retained.

## Remaining acceptance and distribution work

Complete signed Android compilation and install the resulting build on a device. Verify native session persistence across restart/sign-out, email verification/recovery, PDF sharing/printing and push delivery on actual hardware. Bundle exports and mocked native controls do not certify those behaviors.

Google Play publication needs the developer account, listing, privacy/support information, screenshots and store review. A production AAB build is separate from publication. iOS additionally needs Apple signing; `npm run configure:production:ios` loads the correct public production settings for an interactive local setup.

Vercel deployment currently uses the CLI because the GitHub integration could not connect to the repository. Future website releases use `vercel deploy --prod` from `RizzApp`; `vercel.json` invokes the backend readiness gate before export. EAS builds run verification and the production backend check before compilation.

## Recovery and evidence

The snapshot and cutover SQL are private, ignored local files. They cover the affected application tables and reviewed schema; they are not a complete Supabase Auth/Storage/cluster backup. The exact cutover refused stale data and verified every record before commit. Direct CLI database login still has a hosted login-role permission issue; authenticated Management API operations were used.

See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for service IDs and commands, and [SIMULATION_REPORT.md](SIMULATION_REPORT.md) for test boundaries. Do not deploy historical `supabase/schema.sql` or run the legacy Clerk cleanup script.
