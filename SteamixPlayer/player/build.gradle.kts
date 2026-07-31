import java.util.Properties

plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.streamvault.player"
    compileSdk = 36

    defaultConfig {
        minSdk = 27
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

val ffmpegAarFile = layout.projectDirectory.file("libs/media3-decoder-ffmpeg-1.9.2.aar").asFile
val ffmpegManifestFile = layout.projectDirectory.file("libs/media3-decoder-ffmpeg-1.9.2.properties").asFile

val verifyLocalFfmpegArtifact by tasks.registering {
    group = "verification"
    description = "Verifies the bundled Media3 FFmpeg artifact, metadata, and supported ABIs."

    inputs.file(ffmpegAarFile)
    inputs.file(ffmpegManifestFile)

    doLast {
        check(ffmpegAarFile.isFile) {
            "Required FFmpeg artifact missing: ${ffmpegAarFile.absolutePath}"
        }
        check(ffmpegManifestFile.isFile) {
            "Required FFmpeg manifest missing: ${ffmpegManifestFile.absolutePath}"
        }

        val manifest = Properties().apply {
            ffmpegManifestFile.inputStream().use(::load)
        }
        check(manifest.getProperty("media3Version") == "1.9.2") {
            "FFmpeg manifest media3Version must be 1.9.2"
        }
    }
}

tasks.named("preBuild").configure {
    dependsOn(verifyLocalFfmpegArtifact)
}

dependencies {
    api(project(":domain"))

    // Media3
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.exoplayer.hls)
    implementation(libs.media3.exoplayer.dash)
    implementation(libs.media3.exoplayer.smoothstreaming)
    implementation(libs.media3.exoplayer.rtsp)
    implementation(libs.media3.datasource.okhttp)
    implementation(libs.media3.session)
    implementation(libs.media3.ui)

    // Bundled Media3 FFmpeg extension (audio codecs missing on device)
    implementation(files(ffmpegAarFile))

    // OkHttp (for custom data source)
    api(libs.okhttp)

    // Hilt annotations (only @Inject / @ApplicationContext are used)
    implementation(libs.hilt.android)

    // Coroutines
    implementation(libs.coroutines.core)
    implementation(libs.coroutines.android)

    // Core
    implementation(libs.core.ktx)
}
