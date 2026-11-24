# Campus Route Finder for Android

A small Android app (about 5 MB) that shows the web page from `../web` in Android's own WebView.
The ready-to-install app is `../release/CampusRouteFinder.apk`.

The Java code in `app/src/main/java/edu/auc/campusroute/MainActivity.java` adds what a web page cannot do
on its own: it lets the page speak and listen (`window.AndroidVoice`, Android text to speech and speech
recognition for the voice guidance), and it sends the back button to the page so it closes one thing at a time.

## Build

Every build copies `../web` into the app, so the app always matches the website.

1. Install JDK 17 and the Android SDK (platform 36).
2. Create `local.properties` here with the SDK folder, for example `sdk.dir=D:/dev/android-sdk`.
3. Run, from this folder:

```
set JAVA_HOME=<your JDK 17 folder>
gradlew assembleRelease
```

The app is written to `app/build/outputs/apk/release/app-release.apk`.
It is signed with the Android debug key, so it can be installed directly but not published to a store.
