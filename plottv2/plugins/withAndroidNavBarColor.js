const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin: 在 Android 原生主题中设置导航栏颜色。
 * 解决 React Native Modal 弹窗底部系统导航栏显示白色的问题。
 * Modal 会创建独立的 Dialog 窗口，该窗口继承 AppTheme 的 navigationBarColor，
 * 而 expo-navigation-bar 的 JS API 只能控制主 Activity 窗口。
 */
module.exports = (config, { color = "#040404" } = {}) => {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const stylesPath = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "values",
        "styles.xml"
      );

      try {
        if (!fs.existsSync(stylesPath)) {
          console.warn("⚠️ styles.xml not found, skipping navigation bar color injection.");
          return cfg;
        }

        let contents = fs.readFileSync(stylesPath, "utf8");

        // 替换已有的 navigationBarColor 设置（不管原来是什么值）
        if (contents.includes("android:navigationBarColor")) {
          contents = contents.replace(
            /<item name="android:navigationBarColor">[^<]*<\/item>/,
            `<item name="android:navigationBarColor">${color}</item>`
          );
        } else {
          // 如果不存在，在 AppTheme style 的第一个 item 前插入
          contents = contents.replace(
            /(<style name="AppTheme"[^>]*>)/,
            `$1\n    <item name="android:navigationBarColor">${color}</item>`
          );
        }

        // 关闭 enforceNavigationBarContrast，防止系统自动加白色对比度
        if (contents.includes("android:enforceNavigationBarContrast")) {
          contents = contents.replace(
            /<item name="android:enforceNavigationBarContrast"[^>]*>[^<]*<\/item>/,
            `<item name="android:enforceNavigationBarContrast" tools:targetApi="29">false</item>`
          );
        } else {
          contents = contents.replace(
            /(<style name="AppTheme"[^>]*>)/,
            `$1\n    <item name="android:enforceNavigationBarContrast" tools:targetApi="29">false</item>`
          );
        }

        fs.writeFileSync(stylesPath, contents);
        console.log(`✅ Android navigation bar color set to ${color} in styles.xml`);
      } catch (error) {
        console.error("❌ Failed to inject navigation bar color:", error);
      }

      return cfg;
    },
  ]);
};
