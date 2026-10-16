# Dyad for Android and iOS

Capacitor 8 wraps the existing React app with bundled local assets. The native app includes the complete exercise library and works without the hosted website, even on its first launch. The website remains a separate PWA build.

## Current status

- Android project: `android/`; iOS project: `ios/` (Swift Package Manager).
- App name: **Dyad**; application/bundle ID: `io.github.gaptekman.dyad`.
- Local data: the existing IndexedDB schema, save queue, backup validation and training cycle. No account, API keys, analytics or sync service.
- Native backup export: app-private cached JSON shared through the OS share sheet. Restore uses the existing file picker and validation.
- Dyad launcher icons, dark splash assets and iOS file-access privacy manifest are included.
- Separate `dist-native/` output; PWA service worker registration is disabled inside Capacitor. No production `server.url`, remote navigation allowlist or cleartext HTTP override.
- Web builds, automated workout tests and bundle checks run on Windows. Android/iOS compilation and real-device testing have **not** been completed. No APK, IPA, store upload or signing identity is included.

## Prerequisites

Use Node.js 22+ and pnpm 10.17.1. Clone the repository, then run `pnpm install --frozen-lockfile` in its root directory.

For Android install Android Studio 2025.2.1 or newer, its bundled Java 21 runtime, Android SDK Platform 36, platform tools and an emulator or USB-connected phone. Let Android Studio install the SDK tools requested by the generated Gradle project. Set `JAVA_HOME` to Android Studio's `jbr` if command-line Gradle cannot find Java 21. Android Studio can create the ignored `android/local.properties` with your SDK path.

For iOS use a Mac with Xcode 26+ and its command-line tools. This project uses Swift Package Manager, so CocoaPods is not needed. The generated targets support Android 7+ (API 24) and iOS 15+.

Official requirements: https://capacitorjs.com/docs/getting-started/environment-setup

## Run on Android

```sh
pnpm native:sync android
pnpm native:open android
```

In Android Studio, allow Gradle to sync, select an emulator or connected phone, then press Run. On a physical phone enable Developer options and USB debugging, and accept the device's debugging prompt.

To build a debug APK from a configured command line:

```sh
cd android
./gradlew assembleDebug
```

On Windows use `gradlew.bat assembleDebug`. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. This is a development build, not a Play Store release. Android Studio manages a local debug signing key; keep release keys outside source control.

## Run on iPhone

On a Mac:

```sh
pnpm native:sync ios
pnpm native:open ios
```

Let Xcode resolve Swift packages. Select the App target and a simulator, then Run. To run on an iPhone, select your own development team under Signing & Capabilities and connect/select the phone. For TestFlight or App Store distribution, configure your Apple developer membership, signing and App Store Connect listing. No development team or credentials are preconfigured.

## Update the app

After changing web code, run `pnpm native:sync android` or `pnpm native:sync ios`, then rebuild in the relevant IDE. `pnpm native:sync` updates both projects. This always rebuilds and copies local assets. `pnpm build` still builds the website/PWA into `dist/`.

`pnpm build:native` builds just the native web bundle. `pnpm native:run android` or `pnpm native:run ios` invokes Capacitor's CLI runner after syncing. `node scripts/native-icons.mjs` regenerates launcher and splash images from Dyad's original mark.

Keep the app ID and Capacitor hostname/schemes stable after people begin logging workouts. Changing them can create a separate storage namespace. Increase Android versionCode and iOS build number before distributing a new store build.

## Move existing workouts from the website

1. Open the existing web/PWA journal and use **Settings → Export backup**.
2. Save that JSON file somewhere accessible to the phone.
3. In native Dyad use **Settings → Restore backup**, choose the file and confirm the restore. This replaces the native journal; export any native workouts first.
4. Check History and Next session before deleting any copies.

Web and native storage do not sync automatically. Updating the same installed app normally retains its data; uninstalling, clearing app data or losing the phone may remove it. Export regularly. A share sheet opening/closing does not prove that a file was saved: choose a save destination and verify the copy. Backups contain your workout history as readable JSON; share them only with destinations you choose.

## Verification

```sh
pnpm test
node scripts/service-worker-regression.mjs
pnpm native:sync
pnpm native:check
pnpm build
pnpm preview
```

Against that preview, run the existing browser suites in another terminal:

```sh
pnpm test:e2e
node scripts/quick-logging.e2e.mjs
node scripts/training-cycle.e2e.mjs
```

Set `BROWSER_CHANNEL=msedge` to use an installed Edge for the first two suites; the training-cycle suite already uses Edge. Set `CHECK_OFFLINE=1` for full PWA offline and failed-save recovery coverage. Shell syntax differs by OS.

`native:check` compares every bundled file against both copied platform bundles, checks all 44 illustrations, local origins, native plugin registration and privacy configuration. It does not compile Swift/Java or simulate a device.

Before distributing a build, test on actual devices: first launch in airplane mode; logging and force-close/reopen; Upper/Lower cycle advancement; native export, cancellation and restore; keyboard interaction; Android Back; safe areas/system bars; and the three-minute rest timer after background/resume. Rest alerts currently work while the app is open; native background notifications, haptics and cloud sync are later work. Store screenshots, privacy declarations, signing and review remain release tasks.
