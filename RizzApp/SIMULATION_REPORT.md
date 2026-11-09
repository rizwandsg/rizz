# Simulation and hosted verification

398 automated tests pass in 32 files. Run `npm run simulate` to produce `test-results/simulation.json` and a manifest with a source checksum. These files and all private hosted evidence are excluded from Git, EAS and Vercel uploads.

## Coverage

| Boundary | Executed checks |
| --- | --- |
| Route tree | Every one of the 29 screen routes and all 3 navigators has a simulation import; new unclassified business routes fail CI |
| Authentication | Owner/member login, signup, email-link verification, password reset, password change, sign-out, duplicate submissions, failures/retries and field validation |
| Session lifecycle | Unverified owners and unprovisioned identities cannot fetch workspace data; session switches and late foreground/profile responses cannot reveal another account; drafts survive valid foreground refresh |
| Native token storage | Chunk limits, Unicode, concurrent writes/sign-out, corrupt or missing chunks, capacity errors and preservation of prior state on failed writes |
| Account function | Trusted verified owner or provisioned member identity, editable-field allowlist, owner/member permissions, inactive workspace denial, concurrent sync and compensated member provisioning |
| Workspace roles | Two owners and their members, inactive users/workspaces, creator protection, cross-workspace reads/writes and report isolation |
| Database workflows | Real migrations, row-level security, financial precision, balances, foreign keys, safe deletion, legacy report grants and rollback on invalid relationships |
| Firebase policies | Pinned issuer/audience, verified owner email or provisioned managed-member claims, unconfigured-project denial and protected server configuration |
| Cutover | Exact generated SQL preserves member-created records, deactivates access, records all four versions, refuses stale snapshots and rejects invalid mappings |
| Screens and data | Project/expense/payment forms, summaries, analytics, profile/team actions, loading/error states, stale requests, navigation and CSV/PDF generation boundaries |
| Release/archive | Public environment allowlist, staging/production isolation, server credential rejection and Git-root archive exclusions while retaining build inputs |
| Browser dialogs | Destructive cancellation/confirmation, acknowledgement callbacks, queued messages, escaped record text, Escape handling and clearing private dialogs on account changes |
| Received amounts | Both roles save numbered stages, reject invalid installment numbers, preserve later-stage edits and reconcile totals with existing customer receipts |
| Header and Profile layout | Project Details has inline back/edit/delete controls; Profile omits ledger summaries and their data requests; long project names fit phone screens |
| Build configuration | Different public environments use different Metro caches; a mixed production/verification web export is rejected before deployment |

Screen simulations execute actual React components with mocked native controls, Firebase SDK boundaries and API responses. SQL tests execute real PostgreSQL policies through PGlite with synthetic JWT claims. These do not verify native rendering or Firebase signatures.

## Hosted checks

A separate live test exercised Firebase password sign-in, account synchronization, the deployed account function, Supabase token verification, SQL policies and authenticated browser flows. It passed 25 assertions, including non-deliverable Rizz ID logins, owner-only password reset, old-token revocation, stale-reset rejection, and: unverified denial, verified member synchronization, restricted team management, shared owner/member data, other-owner read/write denial, receipt/expense totals, report isolation, anonymous denial, owner/member browser workflows, owner deactivation, immediate revocation of data access and preservation of original table counts after cleanup.

Three temporary identities/profiles and their synthetic ledger records were removed. All pre-existing application rows were preserved. The test fixtures and their Firebase identities were removed.

The affected application snapshot was restored locally before cutover. The exact generated cutover passed preservation checks locally and in the hosted transaction. It is an application-scoped recovery artifact, not a full provider backup.

Eight browser checks passed on https://rizzapp-sage.vercel.app: owner login, member login, signup and password reset at 390px and 1440px widths. They check direct links, validation visibility, overflow and uncaught page errors. A real browser test found and fixed public deep links being lost during session restoration.

Authenticated browser checks also passed for both roles: actual sign-in, owner-created projects and member-created expenses, project details, analytics navigation, profiles, owner-only team visibility, logout cancellation and confirmed logout. There were no uncaught page errors. React Native Web's default Alert was replaced with accessible dialogs so confirmation-based actions execute on the website. Temporary browser-test identities and records were cleaned up.

The received-amount changes were exercised in a local production preview before publication, then repeated on the deployed website at phone width. Both roles recorded numbered receipts; the resulting total and payment count matched the hosted summary. Project edit/back, delete cancellation and Profile card removal passed. Preview testing also found and fixed an overlapping back-button hit area and cached verification settings leaking into a web export.

## Build evidence and limits

Android/iOS Hermes bundles and the web export passed. Linux CI passed native configuration generation and Deno checking. Android releases compiled and signed successfully: the AAB passed bundletool validation, and the latest APK passed signature/certificate, package/version and production-setting checks. Actual extracted EAS archives and final artifact entries were inspected after fixing Windows monorepo exclusions; environment files, private evidence, credentials and Git history are excluded.

Native PDF sharing/printing, push delivery, physical-device session persistence, accessibility and final signed binaries still require device acceptance. A cloud build is not a store publication. See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for remaining work.
