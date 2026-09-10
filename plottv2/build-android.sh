#!/bin/bash

# 确保脚本在出错时停止
set -e

# ==========================================
# 默认配置
# ==========================================
BUILD_TYPE="aab"
KEYSTORE_PATH="./release.jks"
KEY_ALIAS="plottv-alias"
KEY_PASSWORD="61baffdb3da280c9067e0fabeefe0051"
GEN_KEYSTORE=false

# ==========================================
# 参数解析
# ==========================================
while [[ $# -gt 0 ]]; do
    case $1 in
        apk)
            BUILD_TYPE="apk"
            shift
            ;;
        aab)
            BUILD_TYPE="aab"
            shift
            ;;
        --gen-keystore)
            GEN_KEYSTORE=true
            shift
            ;;
        --keystore)
            KEYSTORE_PATH="$2"
            shift 2
            ;;
        --alias)
            KEY_ALIAS="$2"
            shift 2
            ;;
        --password)
            KEY_PASSWORD="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo ">>> 当前配置: 模式=$BUILD_TYPE, 证书路径=$KEYSTORE_PATH, 别名=$KEY_ALIAS"

# ==========================================
# 逻辑1: 生成证书 (如果指定了 --gen-keystore)
# ==========================================
if [ "$GEN_KEYSTORE" = true ]; then
    if [ -f "$KEYSTORE_PATH" ]; then
        echo "⚠️ 警告: $KEYSTORE_PATH 已存在，跳过生成步骤。"
    else
        echo ">>> 正在生成新的签名文件: $KEYSTORE_PATH..."
        keytool -genkey -v \
            -keystore "$KEYSTORE_PATH" \
            -alias "$KEY_ALIAS" \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass "$KEY_PASSWORD" \
            -keypass "$KEY_PASSWORD" \
            -dname "CN=PlotTV, OU=App, O=PlotTV, L=Cloud, S=Global, C=US" \
            -deststoretype pkcs12
        echo ">>> 签名文件生成成功！"
    fi
fi

# ==========================================
# 逻辑2: 准备原生环境 (Prebuild)
# ==========================================
echo ">>> 开始清理并生成 Android 原生工程..."
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录下运行此脚本"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "正在安装 Node 依赖..."
    npm install
fi

rm -rf android && npm run prebuild:android

# 自动生成 local.properties
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
fi

# ==========================================
# 逻辑3: 执行 Gradle 构建并注入签名
# ==========================================
GRADLE_ARGS=""
if [ -f "$KEYSTORE_PATH" ]; then
    # 将路径转为绝对路径供 Gradle 使用
    ABS_KEYSTORE_PATH=$(python3 -c "import os; print(os.path.abspath('$KEYSTORE_PATH'))")
    echo ">>> 检测到证书，正在注入签名信息: $ABS_KEYSTORE_PATH"

    GRADLE_ARGS="-Pandroid.injected.signing.store.file=$ABS_KEYSTORE_PATH \
                 -Pandroid.injected.signing.store.password=$KEY_PASSWORD \
                 -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
                 -Pandroid.injected.signing.key.password=$KEY_PASSWORD"
else
    echo "⚠️ 警告: 未找到签名文件 ($KEYSTORE_PATH)，将生成无签名或 Debug 签名的包。"
fi

echo ">>> 开始执行 Gradle 构建..."
cd android

if [ "$BUILD_TYPE" == "aab" ]; then
    echo ">>> 正在打包 AAB (Release)..."
    sh ./gradlew bundleRelease $GRADLE_ARGS
    echo "✅ 构建完成！"
    echo "文件位于: android/app/build/outputs/bundle/release/"
else
    echo ">>> 正在打包 APK (Release)..."
    sh ./gradlew assembleRelease $GRADLE_ARGS
    echo "✅ 构建完成！"
    echo "文件位于: android/app/build/outputs/apk/release/"
fi