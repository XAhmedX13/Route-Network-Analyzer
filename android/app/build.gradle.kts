plugins {
    id("com.android.application")
}

// The app shows the web page from the repository's web/ folder. Every build copies it into the app,
// so the phone app and the website are always the same code (nothing is kept twice in the repository).
val webAssets: File = layout.buildDirectory.dir("generated/webAssets").get().asFile
val copyWeb by tasks.registering(Copy::class) {
    from(rootProject.file("../web")) {
        include("index.html", "style.css", "app.js", "engine.js", "data.js", "plans.js", "logo.svg", "plans/**")
    }
    into(File(webAssets, "web"))
}
tasks.named("preBuild") { dependsOn(copyWeb) }

android {
    namespace = "edu.auc.campusroute"
    compileSdk = 36

    defaultConfig {
        // same id as the first (Flutter) version, so it installs over it
        applicationId = "edu.auc.campus_route_finder"
        minSdk = 24
        targetSdk = 34
        versionCode = 4
        versionName = "2.2"
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(webAssets)
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // signed with the debug key for now, like the first version, so it can be installed directly
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    androidResources {
        // the pictures are already compressed, store them as they are
        noCompress += listOf("webp")
    }
}
