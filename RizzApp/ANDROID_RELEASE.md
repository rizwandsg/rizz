# Android production release

Version **1.0.0**, version code **3**, package **com.rizz.app**.

- [Download the signed AAB](https://expo.dev/artifacts/eas/z8cFrAQz10-CAUk2WRgM7xKLQVIRS5nXU4f9OKeE2zY.aab)
- [EAS build and logs](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp/builds/5a2b1381-5248-4013-9cac-5b76e0ef19ad)
- Build source: `fb6934d95a530cb7fbb07087a4a5296ab043a2aa`. Subsequent changes concern browser dialogs, static website hosting and release documentation; the native Firebase client is selected from `firebaseClient.native.ts`.

Completed on 2026-11-09. Size: **73,965,520 bytes**. Minimum Android API **24**; target API **36**.

SHA-256:

```text
f98e2931e720511bbe3588df3d173ff322d7494ad4eb83286699e08c233b7dae
```

Google bundletool 1.18.3 validated the bundle. JAR signature verification passed. The package and version were checked in the compiled manifest. Bundle entries exclude environment files, private snapshots/evidence, service-account files and Git history. The local artifact and detailed validation evidence are under ignored `test-results/releases/` and `test-results/auth-migration/`.

The website is live at https://rizzapp-sage.vercel.app. Supabase migrations, Firebase identity mappings and the account function are deployed. Existing owners should use Forgot password, then verify their email; Fuwad's access is inactive with financial history retained.

This AAB is ready for Google Play upload. AABs are distributed through Play testing/release tracks rather than installed directly. Play Console app setup and an authorized submission service-account key are required for upload. Physical-device acceptance and store listing/review remain separate steps; the app has not been published on Google Play.
