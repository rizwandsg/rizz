# Team access

Owners create team members from **Users → +** using a Rizz ID, name and password. The suffix is fixed to `@Rizz.com`; IDs contain 3–40 letters, numbers, dots, underscores or hyphens. IDs are unique across the app. A full ID can also be pasted into the form.

Members sign in from **Team Member Login**. These IDs are login aliases and do not receive email. Owners use their real, verified email addresses and retain Firebase email recovery.

To reset a team password, the workspace owner opens **Users → Reset**, enters a new password and shares it securely with that member. Previous tokens lose database access immediately. A failed identity-service request leaves access locked; refresh and retry the reset. Deactivating an account retains its project and financial history.

Existing members with real email addresses keep their existing email recovery. No existing account is silently renamed or reactivated.

# Release validation

Backend contract **4** requires `202611090001_managed_rizz_ids.sql` after the Firebase identity migration. Deploy the updated `account` function before releasing the client. The migration adds managed-account fields without altering existing financial records. Back up and rehearse against the current data before applying it; an existing hosted installation must not rerun the initial cutover.

`npm run verify` checks types, lint, account authorization, PostgreSQL policies, role and screen simulations, export behavior, secrets and Android bundling. `npm run build:production:apk` runs the production gates and creates a signed installable APK with production services. It uses the existing Android signing key and increments the version code.

The pinned `expo-print` patch waits for Android's layout completion before writing and closes the print resources after completion. See the [Android print adapter lifecycle](https://developer.android.com/reference/android/print/PrintDocumentAdapter). `patch-package` applies it during installation; review or remove it when upgrading `expo-print`.

On Android, **PDF → Save to Device** opens the system document picker. Cancelling does not report success. A renderer failure offers the system print dialog's **Save as PDF** alternative. Verify saving, cancellation, sharing and reopening the exported file on an Android device before broad distribution; mocked native adapters and browser PDF rendering do not certify device behavior.
