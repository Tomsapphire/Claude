plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aivideodetector"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aivideodetector"
        minSdk = 26 // Android 8.0 (2017)
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // The model must be stored uncompressed so it can be memory-mapped.
    androidResources {
        noCompress += "tflite"
    }
}

dependencies {
    // LiteRT (formerly TensorFlow Lite) on-device inference.
    implementation("com.google.ai.edge.litert:litert:1.4.0")
}
