# Android installable release

Version **1.0.0**, version code **5**, package **com.rizz.app**.

- [Download the signed APK](https://expo.dev/artifacts/eas/6V1wH6lqHDHCpKXaqqZnBlMBZ7X3wXyz-2hIEJIuEM4.apk)
- [EAS build and logs](https://expo.dev/accounts/rizwan-portfolio-07/projects/RizzApp/builds/4bbd3559-b606-4a09-907c-a2b3a207bf85)
- Build source: `58913de500b685dcfff1d1e8dbb605ca1053393c`.
- Website: https://rizzapp-sage.vercel.app

This release removes the duplicate project edit/analytics headers, uses Rizz IDs with a fixed `@Rizz.com` suffix for owner-managed team accounts, and fixes the Android print adapter layout/write ordering. Saving a PDF opens the Android document picker; cancellation does not report success. Failed rendering offers the system print dialog.

The APK was downloaded and its package, version, signature and certificate checked. The signing certificate matches the previous release, so it can update the existing app. Private environment files, service-account keys, credentials, test evidence and Git history are absent from the artifact.

Size: **108,554,332 bytes**. SHA-256:

```text
7778e5fa6ac238f3f7184dd90c0cbe2b1973a174f99b5ed47721a75d62f02379
```

Validation: **358 automated tests**, successful GitHub CI, **23 live backend/browser checks**, public login screens at phone and desktop widths, and a visually checked three-page PDF fixture. Both workspace owners and managed members signed in and saw their workspace data; password resets revoked old access and all temporary records were cleaned up. Both managed-login migrations and the account function are deployed, using backend contract **5**.

Native compilation and signature checks passed. A physical Android device was unavailable: installation, PDF save/share/reopen and the system document picker still need device acceptance. The local emulator could not start without working acceleration. These checks do not certify device behavior.

Install the APK, open an existing project and its analytics, create a test Rizz ID from Users, reset its password as owner, and save/open a PDF in Downloads. Existing owners continue to use real email accounts; team recovery stays with the owner. See [team access and release checks](MANAGED_RIZZ_IDS.md).

The previous version-code-3 AAB remains historical. This APK has not been submitted to Google Play; no Play developer account is configured.
