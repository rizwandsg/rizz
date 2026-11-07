# Production setup

The application is linked to [@rizwan-portfolio-07/RizzApp](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp), project ID `70871b7d-8e41-4657-901c-9c10f01e259e`. The previous project belonged to an account that the current Expo login could not access. This is a first store release; no old signing credential was replaced.

## Required hosted services

The existing local `.env` was checked against the providers: Clerk reports a **development** instance, and the configured Supabase backend returns `PGRST202` for `backend_contract_version`. Its public client key cannot apply database migrations. These values cannot be promoted to production by renaming the build profile.

1. Sign in locally with `npx supabase login`. Select a dedicated production project and keep a separate staging backend. Rehearse the migration in staging using the existing README and acceptance matrix before applying it to production. Existing databases require a backup, `supabase/preflight.sql`, and reconciliation of account mappings and financial data.
2. Create the Clerk production instance using a domain you control and complete its DNS setup. Enable email/password authentication and verified email recovery. Register the Android package and iOS bundle identifier `com.rizz.app` and the application's redirect URLs. See [Clerk's production instructions](https://clerk.com/docs/guides/development/deployment/production).
3. Configure Clerk third-party authentication in Supabase. Apply `supabase/migrations/202611070001_secure_workspaces.sql` to the explicitly selected, rehearsed backend. Store the production `CLERK_SECRET_KEY` in Supabase function secrets and deploy `supabase/functions/account` with the explicit project reference. Never store this secret in EAS, the app bundle, or a tracked file.
4. Copy `.env.production.example` to `.env.production.local` and fill in **public** production values. Use the live Clerk publishable key and the production Supabase publishable/anon key. The production URL fields must point to the same backend. `EXPO_PUBLIC_BACKEND_CONTRACT_VERSION=2` is checked against the server; setting the variable does not install the migration.
5. Rotate any real server secrets previously committed in Git history. Complete the device acceptance matrix in `PRODUCTION_READINESS.md`, including two workspace owners and a member, authentication, exports, and financial updates.

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
