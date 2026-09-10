const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: 自动配置 Proguard 混淆规则
 */
module.exports = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      // 确定 proguard-rules.pro 的路径
      const proguardRulesFile = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      // 这里定义针对本项目的混淆规则
      const customRules = `
# PlotTV 业务逻辑混淆保护
# keep react-native-iap
#-keep class com.dooboolab.RNIap.** { *; }
#-keep class com.android.vending.billing.** { *; }

# 确保 React Native 的资源在资源混淆后依然能被找到
# 这对于从非 assets 路径加载加密 Bundle 后的图片显示至关重要
-keep class **.R { *; }
-keep class **.R$* { *; }
-keepclassmembers class **.R$* {
    public static <fields>;
}
`;

      try {
        if (fs.existsSync(proguardRulesFile)) {
          const contents = fs.readFileSync(proguardRulesFile, 'utf8');
          // 避免重复添加
          if (!contents.includes('PlotTV 业务逻辑混淆保护')) {
            const newContents = contents + `\n${customRules}`;
            fs.writeFileSync(proguardRulesFile, newContents);
            console.log('✅ Android Proguard rules have been injected into existing file.');
          }
        } else {
          // 如果文件不存在（虽然很少见），则创建一个
          fs.writeFileSync(proguardRulesFile, customRules);
          console.log('✅ Android Proguard rules file has been created.');
        }
      } catch (error) {
        console.error('❌ Failed to inject Proguard rules:', error);
      }

      return cfg;
    },
  ]);
};