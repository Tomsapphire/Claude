#!/usr/bin/env bash
# Prepares a fresh Linux machine (for example a Claude Code cloud container) to build DocScan.
#
#   bash docscan-android/scripts/cloud-setup.sh
#
# Safe to re-run: every step is skipped when already done. Needs JDK 17+ and network
# access to dl.google.com (Android SDK). Optional overrides: ANDROID_HOME (default
# /opt/android-sdk) and GRADLE_USER_HOME (default ~/.gradle).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SDK_DIR="${ANDROID_HOME:-/opt/android-sdk}"
GRADLE_HOME_DIR="${GRADLE_USER_HOME:-$HOME/.gradle}"
CMDLINE_TOOLS_ZIP="commandlinetools-linux-16111833_latest.zip"
SDK_PACKAGES=("platform-tools" "platforms;android-37.0" "build-tools;37.0.0" "build-tools;36.0.0")

log() { printf '[docscan-setup] %s\n' "$*"; }

if ! command -v java >/dev/null 2>&1; then
  log "JDK 17 or newer is required but 'java' is not on PATH." >&2
  exit 1
fi

# 1. Android SDK command-line tools.
SDKMANAGER="$SDK_DIR/cmdline-tools/latest/bin/sdkmanager"
if [ ! -x "$SDKMANAGER" ]; then
  log "Installing Android command-line tools into $SDK_DIR"
  tmp="$(mktemp -d)"
  curl -fsSL --retry 3 -o "$tmp/tools.zip" "https://dl.google.com/android/repository/$CMDLINE_TOOLS_ZIP"
  unzip -q "$tmp/tools.zip" -d "$tmp"
  mkdir -p "$SDK_DIR/cmdline-tools"
  rm -rf "$SDK_DIR/cmdline-tools/latest"
  mv "$tmp/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"
  rm -rf "$tmp"
fi

# 2. Licences and the SDK packages the build uses (AGP would otherwise fetch build-tools 36 mid-build).
yes | "$SDKMANAGER" --sdk_root="$SDK_DIR" --licenses >/dev/null 2>&1 || true
missing=()
for package in "${SDK_PACKAGES[@]}"; do
  [ -d "$SDK_DIR/${package//;//}" ] || missing+=("$package")
done
if [ "${#missing[@]}" -gt 0 ]; then
  log "Installing SDK packages: ${missing[*]}"
  "$SDKMANAGER" --sdk_root="$SDK_DIR" --install "${missing[@]}" >/dev/null
fi

# 3. Point Gradle at the SDK (local.properties is git-ignored).
echo "sdk.dir=$SDK_DIR" > "$PROJECT_DIR/local.properties"

# 4. Cloud containers share egress IPs that Maven Central rate-limits (HTTP 429), so resolve
#    Maven Central artifacts from Google's official mirror first. Machine-level only; the
#    project itself keeps the standard mavenCentral() repository.
mkdir -p "$GRADLE_HOME_DIR/init.d"
cat > "$GRADLE_HOME_DIR/init.d/maven-central-mirror.gradle" <<'EOF'
// Written by docscan-android/scripts/cloud-setup.sh. Resolve Maven Central artifacts from
// Google's official mirror first, because Maven Central rate-limits shared cloud IPs.
def mirror = 'https://maven-central.storage-download.googleapis.com/maven2/'
beforeSettings { settings ->
    settings.pluginManagement.repositories.maven { name = 'MavenCentralMirror'; url = mirror }
    settings.dependencyResolutionManagement.repositories.maven { name = 'MavenCentralMirror'; url = mirror }
}

// Robolectric downloads android-all jars with its own client; send it to the mirror too.
allprojects {
    tasks.withType(Test).configureEach {
        systemProperty 'robolectric.dependency.repo.url', mirror
    }
}
EOF

props="$GRADLE_HOME_DIR/gradle.properties"
touch "$props"
grep -q '^systemProp.org.gradle.internal.repository.max.retries=' "$props" ||
  echo 'systemProp.org.gradle.internal.repository.max.retries=12' >> "$props"
grep -q '^systemProp.org.gradle.internal.repository.initial.backoff=' "$props" ||
  echo 'systemProp.org.gradle.internal.repository.initial.backoff=3000' >> "$props"

log "Done. Build with: cd $PROJECT_DIR && ./gradlew assembleDebug testDebugUnitTest :core:domain:test"
