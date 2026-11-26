# Building an Android APK for IbexProjectorsIndia

Because the AI Studio cloud preview runs in a Node.js web environment without the Android SDK / Java JDK, an `.apk` binary cannot be compiled directly inside this sandbox. However, the project is already fully packaged for Android in three ways:

## Option 1: Fastest Cloud APK (1 Minute — No Coding or Android Studio)
1. Copy your deployed **Shared App URL**.
2. Open [https://www.pwabuilder.com](https://www.pwabuilder.com) and paste the URL.
3. Click **Package for Stores → Android → Generate Package**.
4. Download the generated zip and install the `.apk` directly on your Android phone (enable *Install unknown apps* when prompted).

## Option 2: Automated Capacitor APK via GitHub Actions (Zero Local Setup)
1. Export or push this project to a GitHub repository.
2. Open the **Actions** tab in GitHub and run **Build Android Debug APK** (configured in `.github/workflows/android-apk.yml`).
3. Download **`ibexprojectorsindia-debug-apk`** (`app-debug.apk`) from the completed workflow artifacts and sideload it onto your Android phone.

## Option 3: Local Build with Android Studio
```bash
npm install
npm run android:sync
npx cap open android
```
Inside Android Studio, choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`
