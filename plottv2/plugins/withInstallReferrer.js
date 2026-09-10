const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: 添加 Google Play Install Referrer 依赖
 * Adjust SDK 需要此库来读取引荐来源数据
 */
module.exports = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    const dependency = "implementation 'com.android.installreferrer:installreferrer:2.2'";

    if (!cfg.modResults.contents.includes(dependency)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${dependency}`
      );
      console.log('✅ Install Referrer dependency added to build.gradle');
    }

    return cfg;
  });
};
