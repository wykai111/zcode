#!/bin/bash

# --- 配置区 ---
PROJECT_NAME="PlotTV" # 与 app.json 中的 name 保持一致
SCHEME="PlotTV"
CONFIGURATION="Release"
EXPORT_PATH="./build-ios"

# --- 参数解析 ---
TEAM_ID="QJ7LZL9NFS"
PROVISIONING_PROFILE="./props/dev.mobileprovision" # 可以是 UUID 或名称
SIGNING_IDENTITY="./props/dev.p12"

usage() {
    echo "Usage: $0 -t <TEAM_ID> -p <PROVISIONING_PROFILE_NAME_OR_UUID> [-i <SIGNING_IDENTITY>]"
    echo "  -t: Apple Team ID (e.g., 12345ABCDE)"
    echo "  -p: Provisioning Profile Name or UUID"
    echo "  -i: Code Sign Identity (Defaults to 'Apple Distribution')"
    exit 1
}

while getopts "t:p:i:" opt; do
    case ${opt} in
        t ) TEAM_ID=$OPTARG ;;
        p ) PROVISIONING_PROFILE=$OPTARG ;;
        i ) SIGNING_IDENTITY=$OPTARG ;;
        * ) usage ;;
    esac
done

if [ -z "$TEAM_ID" ] || [ -z "$PROVISIONING_PROFILE" ]; then
    usage
fi

if [ -z "$SIGNING_IDENTITY" ]; then
    SIGNING_IDENTITY="Apple Distribution"
fi

echo ">>> Starting Build for $PROJECT_NAME"
echo ">>> Team ID: $TEAM_ID"
echo ">>> Profile: $PROVISIONING_PROFILE"

# 1. 清理
rm -rf "$EXPORT_PATH"
mkdir -p "$EXPORT_PATH"
rm -rf ios
npm run prebuild:ios

# 2. 生成 ExportOptions.plist
cat <<EOF > "$EXPORT_PATH/ExportOptions.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

# 3. Archive
echo ">>> Archiving..."
xcodebuild archive \
    -workspace "ios/$PROJECT_NAME.xcworkspace" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$EXPORT_PATH/$PROJECT_NAME.xcarchive" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    -allowProvisioningUpdates

# 4. Export IPA
echo ">>> Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath "$EXPORT_PATH/$PROJECT_NAME.xcarchive" \
    -exportOptionsPlist "$EXPORT_PATH/ExportOptions.plist" \
    -exportPath "$EXPORT_PATH" \
    -allowProvisioningUpdates

echo ">>> Build Finished! IPA location: $EXPORT_PATH"
