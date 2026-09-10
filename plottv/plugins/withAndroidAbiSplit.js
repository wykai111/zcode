const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: 配置 Android ABI 分包 (ABI Split)
 * 允许针对不同架构（arm64, v7a, x86等）减小包体积，并支持 AAB 导出。
 */
module.exports = (config, options = {}) => {
  const {
    include = ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"],
    universalApk = false
  } = options;

  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') {
      cfg.modResults.contents = setAbiSplits(cfg.modResults.contents, include, universalApk);
      cfg.modResults.contents = addPackagingOptions(cfg.modResults.contents);
    }
    return cfg;
  });
};

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

function setAbiSplits(content, include, universalApk) {
  // 检查是否已经存在 splits 配置
  if (content.includes('splits {')) {
    console.log('⚠️ ABI Splits configuration already exists, skipping injection.');
    return content;
  }

  const abiIncludeString = include.map(i => `"${i}"`).join(", ");

  // 在 android block 中注入 splits 配置
  // 我们寻找 android { 并在其后注入
  const splitsConfig = `
    splits {
        abi {
            enable true
            reset()
            include ${abiIncludeString}
            universalApk ${universalApk}
        }
    }
`;

  return content.replace(/android\s*\{/, `android {${splitsConfig}`);
}
