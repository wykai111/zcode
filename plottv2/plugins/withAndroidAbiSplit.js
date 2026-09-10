const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

/**
 * Expo Config Plugin: Android ABI 分包 (ABI Split) 与 AAB 体积优化
 *
 * AGP 不允许 abiFilters 与 splits 同时存在，因此按构建任务分流：
 * - AAB (bundleRelease)：使用 ndk.abiFilters 仅保留 arm 架构（AAB 不受 splits
 *   控制），并设置 debugSymbolLevel 'none' 去除原生调试符号元数据
 *   (BUNDLE-METADATA/...debugsymbols/*.sym)，可显著减小 AAB 体积。
 * - APK (assembleRelease)：保留按 ABI 分包 (splits)，与旧行为一致。
 *
 * 同时将 reactNativeArchitectures 覆盖为 AAB 架构列表：当 splits 被禁用时
 * （即 AAB 构建），React Native Gradle 插件会自动把它写入 abiFilters，
 * 与上面的显式 abiFilters 保持一致，防止 x86 库被打入 AAB。
 */
module.exports = (config, options = {}) => {
  const {
    include = ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"],
    universalApk = false,
    bundleInclude = ["armeabi-v7a", "arm64-v8a"],
    bundleDebugSymbolLevel = "none",
  } = options;

  // 覆盖 reactNativeArchitectures（AAB 构建时 RN 插件据此设置 abiFilters；
  // APK 构建因启用了 splits，RN 插件会跳过，不影响 APK 的 x86 分包）
  config = withGradleProperties(config, (cfg) => {
    const key = "reactNativeArchitectures";
    const existing = cfg.modResults.find((p) => p.key === key);
    const value = bundleInclude.join(",");
    if (existing) {
      existing.value = value;
    } else {
      cfg.modResults.push({ type: "property", key, value });
    }
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') {
      cfg.modResults.contents = setAbiStrategy(
        cfg.modResults.contents,
        include,
        universalApk,
        bundleInclude,
        bundleDebugSymbolLevel
      );
      cfg.modResults.contents = addPackagingOptions(cfg.modResults.contents);
    }
    return cfg;
  });

  return config;
};

/**
 * 按构建任务注入互斥的 ABI 策略（splits vs abiFilters）。
 */
function setAbiStrategy(content, include, universalApk, bundleInclude, bundleDebugSymbolLevel) {
  if (content.includes('plotTvIsBundleBuild')) {
    console.log('⚠️ ABI strategy already exists, skipping injection.');
    return content;
  }

  const abiIncludeString = include.map(i => `"${i}"`).join(", ");
  const bundleAbiString = bundleInclude.map(i => `"${i}"`).join(", ");

  const strategyConfig = `
    // AAB 与 APK 的 ABI 策略互斥（AGP 不允许 abiFilters 与 splits 共存）：
    // - bundleRelease (AAB)：abiFilters 仅保留 ${bundleAbiString}，并关闭原生调试符号
    // - assembleRelease (APK)：按 ABI 分包（splits）
    def plotTvIsBundleBuild = gradle.startParameter.taskNames.any { it.toLowerCase().contains('bundle') }
    if (plotTvIsBundleBuild) {
        defaultConfig {
            ndk {
                abiFilters ${bundleAbiString}
                debugSymbolLevel '${bundleDebugSymbolLevel}'
            }
        }
    } else {
        splits {
            abi {
                enable true
                reset()
                include ${abiIncludeString}
                universalApk ${universalApk}
            }
        }
    }
`;

  return content.replace(/android\s*\{/, `android {${strategyConfig}`);
}

function addPackagingOptions(content) {
  if (content.includes('pickFirst "**/libc++_shared.so"')) {
    return content;
  }

  const packagingConfig = `
    packagingOptions {
        pickFirst "**/libc++_shared.so"
        pickFirst "**/libfbjni.so"
        pickFirst "**/libjsi.so"
        pickFirst "**/libhermes.so"
        pickFirst "**/libreactnativejni.so"
    }
`;

  // 注入到 android block 中
  return content.replace(/android\s*\{/, `android {${packagingConfig}`);
}
