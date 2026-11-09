# Simulation and hosted verification

324 automated tests pass in 29 files. Run `npm run simulate` to produce `test-results/simulation.json` and a manifest with a source checksum. These files and all private hosted evidence are excluded from Git, EAS and Vercel uploads.

## Coverage

| Boundary | Executed checks |
| --- | --- |
| Route tree | Every one of the 29 screen routes and all 3 navigators has a simulation import; new unclassified business routes fail CI |
| Authentication | Owner/member login, signup, email-link verification, password reset, password change, sign-out, duplicate submissions, failures/retries and field validation |
| Session lifecycle | Unverified users cannot fetch workspace data; session switches and late foreground/profile responses cannot reveal another account; drafts survive valid foreground refresh |
| Native token storage | Chunk limits, Unicode, concurrent writes/sign-out, corrupt or missing chunks, capacity errors and preservation of prior state on failed writes |
| Account function | Trusted verified identity, editable-field allowlist, owner/member permissions, inactive workspace denial, concurrent sync and compensated member provisioning |
| Workspace roles | Two owners and their members, inactive users/workspaces, creator protection, cross-workspace reads/writes and report isolation |
| Database workflows | Real migrations, row-level security, financial precision, balances, foreign keys, safe deletion, legacy report grants and rollback on invalid relationships |
| Firebase policies | Pinned issuer/audience, verified email, unconfigured-project denial and protected server configuration |
| Cutover | Exact generated SQL preserves member-created records, deactivates access, records both versions, refuses stale snapshots and rejects invalid mappings |
| Screens and data | Project/expense/payment forms, summaries, analytics, profile/team actions, loading/error states, stale requests, navigation and CSV/PDF generation boundaries |
| Release/archive | Public environment allowlist, staging/production isolation, server credential rejection and Git-root archive exclusions while retaining build inputs |
| Browser dialogs | Destructive cancellation/confirmation, acknowledgement callbacks, queued messages, escaped record text, Escape handling and clearing private dialogs on account changes |

Screen simulations execute actual React components with mocked native controls, Firebase SDK boundaries and API responses. SQL tests execute real PostgreSQL policies through PGlite with synthetic JWT claims. These do not verify native rendering or Firebase signatures.

## Hosted checks

A separate live test exercised Firebase password sign-in, account synchronization, the deployed account function, Supabase token verification, SQL policies and authenticated browser flows. It passed 14 assertions: unverified denial, verified member synchronization, restricted team management, shared owner/member data, other-owner read/write denial, receipt/expense totals, report isolation, anonymous denial, owner/member browser workflows, owner deactivation, immediate revocation of data access and preservation of original table counts after cleanup.

Three temporary identities/profiles and their synthetic ledger records were removed. The application retained 3 user profiles, 3 projects, 52 expenses and 7 payments; customer/vendor payment counts returned to zero. Original owners retain their profile IDs. The removed member is inactive, preserving his original records.

The affected application snapshot was restored locally before cutover. The exact generated cutover passed preservation checks locally and in the hosted transaction. It is an application-scoped recovery artifact, not a full provider backup.

Eight browser checks passed on https://rizzapp-sage.vercel.app: owner login, member login, signup and password reset at 390px and 1440px widths. They check direct links, validation visibility, overflow and uncaught page errors. A real browser test found and fixed public deep links being lost during session restoration.

Authenticated browser checks also passed for both roles: actual sign-in, owner-created projects and member-created expenses, project details, analytics navigation, profiles, owner-only team visibility, logout cancellation and confirmed logout. There were no uncaught page errors. React Native Web's default Alert was replaced with accessible dialogs so confirmation-based actions execute on the website. Temporary browser-test identities and records were cleaned up.

## Build evidence and limits

Android/iOS Hermes bundles and the web export passed. Linux CI passed native configuration generation and Deno checking. The Android release compiled and signed successfully; its AAB passed bundletool and signature validation. Actual extracted EAS archives and final bundle entries were inspected after fixing Windows monorepo exclusions; environment files, private evidence, credentials and Git history are excluded.

Native PDF sharing/printing, push delivery, physical-device session persistence, accessibility and final signed binaries still require device acceptance. A cloud build is not a store publication. See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for remaining work.
