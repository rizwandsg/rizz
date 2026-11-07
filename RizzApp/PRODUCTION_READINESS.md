# Production readiness review — 7 November 2026

The source is prepared for staging and production setup. A new EAS project was created and linked under `rizwan-portfolio-07`. Supabase login, read-only hosted inspection, and a local application-snapshot restore/migration rehearsal are complete. No hosted application schema, account mappings, Edge Functions, or app-store release has been deployed. This is not a production acceptance certificate. See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md).

## Findings and implemented changes

| Finding | Prepared correction | Verification |
| --- | --- | --- |
| Login fetched users and compared unsalted hashes on the device; reset returned temporary passwords | Clerk sign-in for owners and members; verified email recovery; legacy password entry points fail closed | Session and account-handler regression tests |
| A user ID in AsyncStorage acted as a session; route guard stopped checking after redirect | Clerk token required for queries; profile cache cannot authenticate; route policy reevaluates login/logout; stale sync responses discarded | Session/navigation tests |
| Data isolation depended on JavaScript filtering | Migration replaces permissive policies with workspace RLS, protects creator identity, restricts profile writes to the account function, and denies hash access | Real PostgreSQL engine tests using PGlite with anon/authenticated roles |
| Team expenses and payments could disappear from owner/member summaries | All workspace reads rely on the same server policy; authoritative summary includes both existing receipt tables | RLS and aggregate tests |
| Queries could silently stop at backend row limits; decimal/email filters lost periods | Paginated reads with stable ordering; validated filter parser | Pagination/filter tests |
| Repeated saves and lost responses could duplicate transactions; edits could overwrite other changes | Immediate form guards, stable UUIDs across retries, identical-insert recovery, version checks on edits | Database request tests; device acceptance still required |
| Invalid amounts, reversed dates, forged expense/project links, and overpayments were possible | Client validation plus database constraints and payment balance triggers; no financial cascades accepted | Input, FK, balance, migration tests |
| Reports named text files `.pdf`; CSV text was not escaped | Expo PDF renderer and file sharing; CSV quote/formula escaping; filename validation | Export tests with mocked native APIs; physical file inspection remains required |
| Analytics invented a default budget and used overlapping circles as pie slices | Real budget values, spending/unspent distribution, actual pie chart, explicit error states | Budget calculation tests and native bundle checks |
| Builds mixed test and production settings; `.env` was tracked | Environment checks, separate app identifiers, backend version check, CI and EAS checks; `.env` removed from Git tracking | Configuration/secret checks |

## Local results

The latest simulation run passed 269 tests in 23 test files, including seven regressions against a schema-only fixture from the hosted backend. TypeScript, lint errors, and secret checks passed. Android/iOS Hermes exports, Expo Doctor (20/20), and the unchanged Deno Edge Function passed the preceding SDK release checks. Expo was upgraded incrementally from SDK 54 through SDK 58 with regression tests at each stage. The production dependency audit passes its configured gate: zero critical/high and five moderate findings remain in the Expo CLI/fingerprint glob/minimatch chain. See [SIMULATION_REPORT.md](SIMULATION_REPORT.md) for the limits of these checks.

Run `npm run verify` for the current result; tests do not use your `.env` or contact a backend. Android/iOS bundle checks use fake public configuration and produce verification artifacts, not usable signed app releases. Deno checks the deployable Edge Function separately.

Automated coverage includes every screen route, new-database setup, migration of the checked-in legacy schema, transaction rollback on invalid legacy data, owner isolation, shared member access, deactivation, profile privileges, payment relationships/balances, totals, retry handling, edit version checks, exports, route decisions, and real AuthProvider lifecycle behavior with mocked Clerk. Screen tests execute React components/effects/actions with mocked native/API adapters. They do not emulate a real Clerk session, concurrent network connections, native rendering, push delivery, or app-store signing.

## Release blockers

1. Review the five remaining moderate Expo tooling findings (`glob`/`minimatch` and their dependents). The former high-severity findings were removed by the SDK 58 upgrade; `npm run audit:release` now passes. Do not force npm's suggested downgrade to Expo 52. Native and hosted acceptance are still required.
2. The hosted schema has now been inspected. A local application-table snapshot restored successfully; after sanitization, the revised migration preserved every stored record. This is not a complete Supabase backup or hosted staging rehearsal. Complete a hosted recovery procedure and staging acceptance, reconcile payment-status data, and rerun `supabase/preflight.sql` immediately before rollout. CLI commands needing direct database access currently fail during login-role initialization with a hosted role-permission error; read-only Management API inspection works.
3. Existing team accounts authenticated by the old local password hash must be provisioned in Clerk and mapped to the same `public.users.id`. Do not automatically link by email or generate new owner records. Real deliverable email addresses are required for password recovery; former synthetic `@rizz.com` accounts need reviewed address changes. Reconcile unmapped, duplicate, orphaned, inactive, or invalid-role records before rollout.
4. Rotate any real secret previously committed in `.env`, including the Clerk secret setting. Untracking does not remove Git history or revoke credentials. The new account function needs `CLERK_SECRET_KEY` in server-side Supabase secrets only.
5. Configure Clerk third-party authentication on the staging Supabase project and deploy the account function there. The app deliberately blocks access when account synchronization fails.
6. Run the device acceptance matrix below. No emulator/device was connected; no signed APK/AAB or native iOS build was compiled here. Native PDF output and push delivery have not been observed.
7. Review hosted Realtime publication settings. Run `supabase/preflight.sql` before release: its tested safety check refuses private-table DELETE events in `supabase_realtime`. Custom publication names need administrator review too. Removing app DELETE listeners alone cannot prevent a malicious client subscription. The public backend-version RPC checks compatibility only. No hosted settings were changed.
8. Provide approved support contact details and applicable legal/license documents before public distribution. Existing dummy contacts, generic social links, and dead document buttons were removed or clearly marked unavailable. Email notifications, scheduled payment reminders, and weekly delivery are not implemented and are disabled in settings.

## Device acceptance matrix

Use two isolated staging owners A/B and a member of A. Never use customer data.

| Scenario | Required result |
| --- | --- |
| Cold launch, login, logout, relaunch, expired token, protected deep link | Protected data is shown only after a valid session and profile; logout cannot recover cached data |
| Create member using a real staging mailbox; member login/reset/change password | Correct workspace; reset requires email proof; no hash or temporary password appears |
| Member deactivated while signed in; workspace owner deactivated | Next server operation is denied; foreground refresh blocks the account |
| Owner B requests A's record IDs through direct API calls | No rows returned or access denied, including summaries and writes |
| Create project with/without scopes; create/edit expenses | Both project types work; editing amount preserves the category; date stays the selected calendar day |
| Rapid repeated save; network interruption after commit; retry same form | One record; identical request recovers the existing record; changed retry requires reload |
| A/B edit the same loaded record | First succeeds; stale edit gets a reload message instead of overwriting |
| Customer and legacy receipt entries; vendor payments | Received totals reconcile across both receipt tables without duplicate business receipts; vendor totals reconcile to actual payments |
| Two simultaneous vendor payments for one expense | Total cannot exceed the expense; verify against hosted PostgreSQL using separate connections |
| Delete project/expense with dependent transactions | Operation fails and records remain; use an explicit reviewed cleanup process |
| More than 1,000 expenses, equal sort dates, decimal values | Counts and totals match SQL; pagination loses no rows in a stable dataset |
| Offline load/refresh | An error is shown; no false zero balance or save success is reported |
| CSV quote/comma/newline/formula names; PDF save/open/share | Valid files, correct totals, legible text/rupee glyphs, escaped text, no traversal |
| Notifications denied/enabled; foreground/background; two workspace devices | App remains usable; delivery and event freshness meet the intended behavior |

The Maestro owner smoke flow in `.maestro/smoke.yaml` is prepared but has not run. Test account MFA/challenge requirements must match the app's supported password flow; additional verification currently produces an explicit message. Verify Clerk's production instance configuration before enabling a policy that requires a new challenge screen.

## Rollout and recovery

Take a database backup and rehearse restoring it. Deploy to a new staging backend, run the automated and device checks, then review the exact migration and mapped identities against the production snapshot. Schedule a coordinated backend/client cutover: the old local-password client is incompatible with the new policies. Restrict access during identity migration and verify that both anonymous requests and old clients fail closed.

The migration runs in one transaction and refuses invalid legacy financial records. It converts only reviewed account/financial relationships from cascading deletion to non-cascading deletion, validates retained links, and adds missing links; unexpected references and other cascading relationships stop rollout. It retains legacy hashes under restricted grants for a separate reviewed disposal process. The two canonical views are recreated without `CASCADE`, so unexpected dependencies stop the transaction instead of being dropped. Other dependent views retain their definitions and execute with the caller's permissions; dependent materialized views require separate review and stop the transaction. It is a one-time migration, not an idempotent script.

For application regressions, stop distribution and fix forward using the secured backend. Do not restore permissive RLS or return to local password checking to make an old client work. A database restore requires the reviewed backup/maintenance procedure and must retain access restrictions. Record the tested revision, migration checksum, test results, staging account mappings, device results, and operator sign-off before production release.

Implementation references: [Clerk third-party authentication](https://supabase.com/docs/guides/auth/third-party/clerk), [Supabase row-level security and views](https://supabase.com/docs/guides/database/postgres/row-level-security), [Expo SDK 54 platform defaults](https://expo.dev/changelog/sdk-54).
