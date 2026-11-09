# Release verification

The website is deployed at https://rizzapp-sage.vercel.app with Firebase Authentication and Supabase data. Android is the current store-build priority. iOS signing is deferred.

## Completed

- The initial identity cutover and subsequent managed-login migrations were rehearsed against current application snapshots, then applied with atomic record-preservation checks and migration history. The live backend contract is version 5.
- Existing owner mappings preserve profile IDs. Owners need a password reset and fresh Firebase email verification. Fuwad's access is disabled; his transaction history remains.
- Anonymous table/report reads are denied. Active owners and members share their workspace; other workspaces are isolated. Tokens from an incorrect Firebase project and unverified, unprovisioned identities fail closed.
- Hosted smoke tests passed 25 checks covering real password login, verified owner accounts, provisioned Rizz IDs, owner-managed password resets and revocation, owner/member data visibility, team permissions, ledger totals, report isolation, immediate deactivation and authenticated browser workflows. All temporary identities and records were removed, restoring original table counts.
- 398 local tests pass across 32 files. The suite covers SQL constraints and permissions, authentication/session races, screen handlers and navigation, secure persistence, data validation, exports, build-archive exclusions and browser confirmation dialogs.
- Browser checks passed on the deployed authentication forms at phone and desktop sizes, with visible validation and no horizontal overflow or uncaught page errors.
- Android, iOS and web bundle exports passed. GitHub Actions also passed Linux native configuration generation and Deno function checking for the Firebase migration commit.
- Dependency audit has no high/critical production findings. Five moderate Expo tooling findings remain; forcing the suggested SDK downgrade would be incompatible.
- The actual EAS archive excludes private environment/evidence/credential files and Git history. A root-level ignore file fixes Windows monorepo archive handling; required source and lockfiles are retained.
- The Android production AAB and installable APK finished successfully. Bundletool validation passed for the AAB. The latest APK passed signature/certificate, package/version, production-setting and private-file checks. See [ANDROID_RELEASE.md](ANDROID_RELEASE.md) for the artifact and checksum.
- Both roles passed live browser sign-in, project/expense/profile visibility, team restrictions and logout cancellation/confirmation. Vercel now publishes only static output; the client API modules are not deployed as serverless endpoints.
- Project Details uses inline navigation/actions and a prominent received-amount entry. Both roles saved numbered payments and reconciled received totals. Profile no longer loads or displays ledger summaries.
- Metro caches are keyed by public configuration, and final web exports must contain the expected production settings. A phone-size preview caught and verified this fix before publication.

## Remaining acceptance and distribution work

Install and test the signed Android release on a device using the signed APK linked in ANDROID_RELEASE.md. Verify native session persistence across restart/sign-out, email verification/recovery, PDF sharing/printing and push delivery on actual hardware. Bundle validation and mocked native controls do not certify those behaviors.

Google Play publication needs the developer account, listing, privacy/support information, screenshots and store review. A production AAB build is separate from publication. iOS additionally needs Apple signing; `npm run configure:production:ios` loads the correct public production settings for an interactive local setup.

Vercel deployment currently uses the CLI because the GitHub integration could not connect to the repository. Future website releases use `vercel deploy --prod` from `RizzApp`; `vercel.json` invokes the backend readiness gate before export. EAS builds run verification and the production backend check before compilation.

## Recovery and evidence

The snapshot and cutover SQL are private, ignored local files. They cover the affected application tables and reviewed schema; they are not a complete Supabase Auth/Storage/cluster backup. The exact cutover refused stale data and verified every record before commit. Direct CLI database login still has a hosted login-role permission issue; authenticated Management API operations were used.

See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for service IDs and commands, and [SIMULATION_REPORT.md](SIMULATION_REPORT.md) for test boundaries. Do not deploy historical `supabase/schema.sql` or run the legacy Clerk cleanup script.
