# Role and screen simulation — 7 November 2026

**269 tests passed in 23 test files; zero failures or skipped tests.** All 28 screen routes and three navigators are included. This is local simulation evidence, not approval to deploy or a guarantee against every possible failure.

Run from `RizzApp`:

```powershell
npm run simulate
npm run verify
npm run bundle:check -- ios
```

The simulation creates disposable fixture data only. It does not sign in to Clerk, contact the hosted database, deploy migrations, or modify customer records. Results are saved in `test-results/simulation.json`; `simulation-manifest.json` records the run time, Node version and SHA-256 of source/test/configuration files. These generated files are ignored by Git.

Final verification also passed: TypeScript, lint errors, secret checks, Git whitespace checks, Expo Doctor (20/20), and both Android and iOS Hermes bundle exports. Bundle logs are retained in `test-results/dependency-review/sdk58-android.log` and `test-results/dependency-review/sdk58-ios.log`. No signed native build was produced.

## What was exercised

Screen simulations execute the actual React screen components, state, effects and action handlers. Native controls, routing adapters, Clerk and business API calls are mocked. Focus is simulated by re-entering the focus effect; screen dimensions and native layout are not measured. Separate tests mount the actual AuthProvider, retaining mocked Clerk/storage/token boundaries.

Database simulations execute the checked-in migration in isolated PostgreSQL through PGlite. They set test identities and database roles explicitly; they verify SQL policies, grants, constraints and totals, but do not verify JWT signatures or the hosted Supabase gateway. Screen fixture visibility and SQL isolation are separate checks, not an end-to-end hosted test.

Seven additional migration regressions use the actual hosted schema with synthetic records. They cover the existing role constraint, preservation of records and relationships, non-cascading deletion, the missing payment creator foreign key, anonymous denial (including column grants), all ten legacy report views, nested reports in another schema, and rollback for unknown cascades, materialized reports, and orphaned payment creators. Separately, an ignored local snapshot of the existing application tables was restored, sanitized, and migrated with every stored record unchanged. No hosted migration was executed, and this snapshot excludes Supabase Auth, Storage, secrets, and full cluster configuration.

| Role/state | Verified behavior |
| --- | --- |
| Workspace A/B owners | Own workspace rows/views visible; financial create/edit/delete works; foreign workspace IDs cannot be read, changed, deleted or reparented |
| Active members of A/B | Same workspace financial data visible and writable; forged creator/record identity denied; member administration unavailable |
| Anonymous, empty or unmapped identity | Private data denied or invisible; no financial writes |
| Inactive member, inactive owner, member of inactive owner | Data access revoked; historical rows retained; restoration tested |
| Loading/failed/changed session | Private routes blocked; old response/token/cache cannot restore the previous account |
| Foreground/resume | Email verification state and valid unsaved forms preserved; failed account revalidation blocks access |

Financial workflows reconcile projects, expenses, both receipt tables and vendor payments. Tests also cover decimal precision, invalid input, overpayment, unsafe dependent deletion, profile privilege escalation, more-than-one-page reads, stable retry IDs and stale edit versions.

## Screen coverage

All rows below passed within the simulation boundaries above. Owners and members render each applicable business screen; Users is owner-only. Public forms and redirect routes are exercised as guests, with authenticated navigation separately guarded.

| Route(s) | Exercised behavior |
| --- | --- |
| `index`, root `_layout` | Loading, account failure/retry, sign-out, guest/owner/member protected route selection; visible native headers and Back fallback for direct links |
| `(auth)/_layout`, `login`, `signup`, `reset-password` | Signed-in redirect and legacy redirect destinations |
| `(auth)/clerk-signin`, `team-login` | Required fields, complete/incomplete authentication, rejection/retry, duplicate taps, recovery/navigation |
| `(auth)/clerk-signup` | Create, numeric email verification, resend without recreating account, failed delivery/retry, duplicate submission |
| `(auth)/forgot-password` | Email/code/password validation, incomplete/failed reset, repeated taps, completed reset and separate logout retry |
| `(tabs)/_layout` | Owner/member tab sets; Users excluded for members |
| `(tabs)/home` | Project visibility/navigation, empty workspace, failed load/retry, focus refresh |
| `(tabs)/expense` | Project expense totals/navigation, empty workspace, failed load, focus refresh |
| `(tabs)/analytics` | Populated/empty summaries, failed load, focus refresh |
| `(tabs)/profile` | Identity and precise totals, all menu destinations, empty workspace, failed load, refresh, failed/successful logout |
| `(tabs)/users` | Team visibility, member deep-link denial before loading, empty workspace, create/edit modal, deactivate/disable, verified recovery guidance |
| `AddProject` | Owner/member create/edit, repeated save, retry ID, cleared fields, failed/stale loads, date preservation |
| `AddExpense` | Create/edit, strict amounts, scoped/unscoped projects, saved category, project-loading race, retry, version checks |
| `AddPayment`, `AddCustomerPayment` | Create/edit, original payer/project, mismatched/inaccessible/versionless records, cleared fields, retry, stale edits |
| `ProjectDetails` | Project/expense/receipt visibility, both receipt types and correct edit destinations, missing ID, failure, refresh and stale route responses |
| `ExpenseDetails` | Expense visibility, missing ID, failure, refresh and stale route responses |
| `ProjectAnalytics`, `IndividualProjectAnalytics` | Data rendering, missing ID, failure, refresh, stale response protection; PDF totals exclude unspent budget from expenses |
| `EditProfile`, `ChangePassword` | Editable field whitelist, failed/successful writes, validation, Clerk password change for both roles, cleared password fields |
| `Notifications` | Safe saved settings, rollback after failed persistence, unavailable delivery options disabled, no push-token display |
| `Theme` | Render, preference save and failed persistence |
| `HelpSupport`, `About` | Render, explicit support fallback, no inert controls or fabricated contact destinations; missing documents clearly disclosed |
| `ClerkConditionalExample` | Authenticated content renders for owner/member behind private route guard |

Financial form tests also passed in `America/Los_Angeles` to catch date-only timezone shifts. A route inventory test fails when a new route has no simulation import; it does not replace behavioral assertions for new features.

## SDK and release setup verification

The app now uses Expo SDK 58, React Native 0.88.1, React 19.3, and TypeScript 6. The SDK 55, 56, and 57 stages each passed TypeScript and the regression suite before advancing. The final SDK 58 run passed 262 tests and both platform bundles. The release audit passes with five moderate tooling findings and no high/critical findings.

New production-configuration tests verify that development `.env` values are never used as a production fallback, public production settings override inherited development values, server keys cannot enter the upload file, and placeholder/test keys are rejected. EAS metadata discovery works without runtime keys; Metro and release checks still reject incomplete application configuration.

Native configuration generation is checked separately in Linux CI with synthetic public settings. A local Windows prebuild stalled in Expo's Android package-refactoring plugin: its backslash-based glob timed out while the same forward-slash path returned immediately. The cloud build uses Linux for Android and macOS for iOS. This configuration check does not compile or sign either application. The upgraded iOS minimum is 16.4.

## Defects corrected during this pass

- Returning to lists/details after edits left stale data; load failures could look like empty/zero balances.
- Hidden navigator headers removed Back/Edit/Delete controls from screens relying on native headers; those headers and direct-link fallback navigation are restored and tested.
- Project totals included customer receipts while the transaction list omitted them.
- A direct member link could render Users administration despite the hidden tab.
- Form loading could overwrite the selected project, expense category or saved payer; clearing optional fields did not persist.
- Failed/missing edit loads could leave a save path open without a record version.
- Repeated auth/form submissions could race; signup resend could attempt another account creation.
- Foreground refresh could destroy email verification or unsaved forms; delayed profile/cache/token responses could cross session changes.
- Old route responses could replace the currently selected record; realtime listeners could outlive their session.
- PDF category data included unspent budget; some financial values rounded away paise or displayed small spending as zero.
- Notification settings accepted malformed saved values; several settings/support/document controls promised unavailable behavior.

## Acceptance still required

No browser runtime or Android device was connected. Native UI layout, keyboard/date picker behavior, true Expo navigation, signed APK/AAB/iOS builds, real email/MFA policies, PDF appearance/sharing, push delivery and simultaneous hosted payment connections remain unverified. The audit now has zero high/critical findings and five moderate tooling findings. Migration/credential/account-mapping prerequisites remain in [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

Hosted Realtime publication settings require a separate check. The prepared `supabase/preflight.sql` rejects private-table DELETE publication in `supabase_realtime`; its failure/success behavior is tested. Custom publications also require review. Supabase documents that DELETE events do not enforce RLS, so the client removing DELETE handlers is insufficient by itself. [Supabase Realtime documentation](https://supabase.com/docs/guides/realtime/postgres-changes#receiving-old-records).

The app still retains legacy manual expense payment-status labels. Those labels are not vendor ledger payments; existing data must be reconciled before relying on vendor-balance summaries. Both receipt tables can also contain business duplicates that require staging reconciliation.

Production data access depends on actually applying the reviewed migration and account integration to the correct backend. This pass changed only local code and tests.
