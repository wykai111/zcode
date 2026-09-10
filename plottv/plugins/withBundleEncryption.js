const {
  withAppBuildGradle,
  withMainApplication,
  withDangerousMod,
  withXcodeProject,
  withAppDelegate,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const pluginPath = __dirname;

/**
 * Bundle Encryption Plugin
 *
 * 本插件为 React Native 应用提供 JavaScript 包加密功能
 *
 * ⚠️ 严格模式：
 * 插件必须从 app.json 中读取 android.package 和 ios.bundleIdentifier。
 * 如果配置缺失，将直接停止构建，不生成默认包名。
 *
 * 🔄 插件会输出当前使用的配置，帮助调试
 */

const withBundleEncryption = (config, options = {}) => {
  // --- 实时读取 app.json 配置 ---
  let androidPackage = null;
  let iosBundleId = null;

  try {
    const projectRoot = path.resolve(__dirname, '..');
    const appJsonPath = path.join(projectRoot, 'app.json');

    if (fs.existsSync(appJsonPath)) {
      const content = fs.readFileSync(appJsonPath, 'utf8');
      const parsed = JSON.parse(content);
      androidPackage = parsed.expo?.android?.package;
      iosBundleId = parsed.expo?.ios?.bundleIdentifier;
    }
  } catch (err) {
    throw new Error(`❌ withBundleEncryption fatal error: 无法解析 app.json. ${err.message}`);
  }

  // 严格模式：如果从 app.json 中获取不到包名，直接停止
  if (!androidPackage || !iosBundleId) {
    throw new Error('❌ withBundleEncryption Error: 无法从 app.json 中获取包名配置 (android.package 或 ios.bundleIdentifier)。加密过程已停止。');
  }

  // 输出当前使用的配置
  console.log('🔐 BundleEncryption Plugin 配置状态:');
  console.log(`  • Android 包名: ${androidPackage}`);
  console.log(`  • iOS Bundle ID: ${iosBundleId}`);
  console.log('');

  // --- Android ---
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') {
      cfg.modResults.contents = addAndroidEncryptionTask(cfg.modResults.contents);
    }
    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    cfg.modResults.contents = addAndroidDecryptionHook(cfg.modResults.contents, androidPackage);
    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const androidPackagePath = androidPackage.replace(/\./g, '/'); // com.plottv.atv -> com/plottv/atv
      const folder = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/java', androidPackagePath);
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'BundleDecryptor.kt'), getAndroidHelperCode(androidPackage));
      return cfg;
    },
  ]);

  // --- iOS ---
  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName;

    const filesToAdd = [
      'BundleDecryptor.swift',
      'AssetPathModule.swift',
      'AssetPathModule.m',
    ];

    // 检查文件是否已添加
    const pbxFileDiff = project.pbxFileReferenceSection();

    // 尝试找到主 Project Group (通常与项目同名)
    const pbxGroupDiff = project.hash.project.objects.PBXGroup;
    let targetGroupKey = null;

    for (const [key, value] of Object.entries(pbxGroupDiff)) {
      if (value.name === projectName || value.path === projectName) {
        targetGroupKey = key;
        break;
      }
    }

    // 如果没找到，退而求其次找根 Group
    if (!targetGroupKey) {
      targetGroupKey = project.getFirstProject().firstProject.mainGroup;
    }

    // 添加所有文件到项目
    for (const fileName of filesToAdd) {
      const isFileAlreadyInProject = Object.values(pbxFileDiff).some(
        (file) => file.path === fileName || file.path === `"${fileName}"`
      );

      if (!isFileAlreadyInProject && targetGroupKey) {
        project.addSourceFile(fileName, null, targetGroupKey);
      }
    }

    cfg.modResults = addIosEncryptionBuildPhase(project);
    return cfg;
  });

  config = withAppDelegate(config, (cfg) => {
    cfg.modResults.contents = addIosDecryptionHook(cfg.modResults.contents, iosBundleId);
    return cfg;
  });

  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      // 确保解密辅助类文件在 ios 项目根目录中
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const bundleDecryptorPath = path.join(iosRoot, 'BundleDecryptor.swift');
      const assetPathModuleSwiftPath = path.join(iosRoot, 'AssetPathModule.swift');
      const assetPathModuleMPath = path.join(iosRoot, 'AssetPathModule.m');

      console.log(`Writing BundleDecryptor.swift to: ${bundleDecryptorPath}`);

      // 确保目录存在
      if (!fs.existsSync(iosRoot)) {
        throw new Error(`iOS platform project root does not exist: ${iosRoot}`);
      }

      // 写入或覆盖文件
      fs.writeFileSync(bundleDecryptorPath, getIosHelperSwiftCode(), { encoding: 'utf8' });
      fs.writeFileSync(assetPathModuleSwiftPath, getAssetPathModuleSwiftCode(), { encoding: 'utf8' });
      fs.writeFileSync(assetPathModuleMPath, getAssetPathModuleMCode(), { encoding: 'utf8' });

      // 验证文件已写入
      if (!fs.existsSync(bundleDecryptorPath)) {
        throw new Error(`Failed to write BundleDecryptor.swift to ${bundleDecryptorPath}`);
      }

      console.log(`Successfully wrote BundleDecryptor.swift (${fs.statSync(bundleDecryptorPath).size} bytes)`);
      console.log(`Successfully wrote AssetPathModule.swift (${fs.statSync(assetPathModuleSwiftPath).size} bytes)`);
      console.log(`Successfully wrote AssetPathModule.m (${fs.statSync(assetPathModuleMPath).size} bytes)`);
      return cfg;
    },
  ]);

  return config;
};

// --- iOS Helpers ---

function addIosEncryptionBuildPhase(project) {
  const buildPhaseName = 'Bundle Encryption (AES)';
  const shellScript = `
# iOS Bundle 路径
BUNDLE_PATH="\${CONFIGURATION_BUILD_DIR}/\${UNLOCALIZED_RESOURCES_FOLDER_PATH}/main.jsbundle"
if [ -f "$BUNDLE_PATH" ]; then
  echo ">>> Encrypting iOS Bundle with AES: $BUNDLE_PATH"
  /opt/homebrew/bin/node -e "const fs=require('fs');const crypto=require('crypto');const p='$BUNDLE_PATH';const buffer=fs.readFileSync(p);if(buffer.slice(0,4).toString()!=='DRMA'){const key=crypto.randomBytes(16);const iv=crypto.randomBytes(16);const cipher=crypto.createCipheriv('aes-128-cbc',key,iv);const encrypted=Buffer.concat([cipher.update(buffer),cipher.final()]);const output=Buffer.concat([Buffer.from([0x44,0x52,0x4D,0x41]),Buffer.from([16]),key,iv,encrypted]);fs.writeFileSync(p,output);console.log('>>> iOS Encryption Done');}else{console.log('>>> Already encrypted');}"
fi
`;

  const buildPhases = project.hash.project.objects.PBXShellScriptBuildPhase;
  for (const key in buildPhases) {
    if (buildPhases[key].name === `"${buildPhaseName}"`) return project;
  }

  project.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    buildPhaseName,
    null,
    { shellPath: '/bin/sh', shellScript }
  );
  return project;
}

function addIosDecryptionHook(content) {
  if (content.includes('BundleDecryptor')) return content;

  // 检查是否为 Swift
  const isSwift = content.includes('func bundleURL()');

  if (isSwift) {
    const oldBundleUrl = 'return Bundle.main.url(forResource: "main", withExtension: "jsbundle")';
    const newBundleUrl = 'return BundleDecryptor.getDecryptedBundleURL()';

    if (content.includes(oldBundleUrl)) {
      return content.replace(oldBundleUrl, newBundleUrl);
    }
    return content.replace(/return\s+Bundle\.main\.url\(forResource:\s*"main",\s*withExtension:\s*"jsbundle"\)/, 'return BundleDecryptor.getDecryptedBundleURL()');
  } else {
    // 兼容 Objective-C
    if (!content.includes('#import "BundleDecryptor-Swift.h"')) {
      // 占位
    }

    const oldBundleUrl = 'return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];';
    const newBundleUrl = 'return [BundleDecryptor getDecryptedBundleURL];';

    if (content.includes(oldBundleUrl)) {
      return content.replace(oldBundleUrl, newBundleUrl);
    }
    return content.replace(/URLForResource:@"main" withExtension:@"jsbundle"];/, '[BundleDecryptor getDecryptedBundleURL];');
  }
}

function getIosHelperSwiftCode() {
  return fs.readFileSync(path.join(pluginPath, 'ios', 'BundleDecryptor.swift'), 'utf8');
}

function getAssetPathModuleSwiftCode() {
  return fs.readFileSync(path.join(pluginPath, 'ios', 'AssetPathModule.swift'), 'utf8');
}

function getAssetPathModuleMCode() {
  return fs.readFileSync(path.join(pluginPath, 'ios', 'AssetPathModule.m'), 'utf8');
}

// --- Android Helpers ---

function addAndroidEncryptionTask(content) {
  if (content.includes('encryptBundle')) return content;

  // 将复杂的 Node 脚本转为 Base64，彻底避免 Gradle/Groovy 里的转义地狱
  const nodeScript = `
const fs = require('fs');
const p = process.argv[1];
try {
  const b = fs.readFileSync(p);
  const crypto = require('crypto');
  const key = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(b), cipher.final()]);
  const output = Buffer.concat([Buffer.from([0x44, 0x52, 0x4D, 0x41]), Buffer.from([16]), key, iv, encrypted]);
  fs.writeFileSync(p, output);
  console.log('>>> Encryption Done');
} catch (e) {
  console.error(e);
  process.exit(1);
}
  `.trim();
  const base64Script = global.Buffer.from(nodeScript).toString('base64');

  return content + `
// --- Bundle Encryption Task (AES) ---
tasks.register("encryptBundle") {
    doLast {
        def possiblePaths = [
            "src/main/assets/index.android.bundle",
            "build/generated/assets/react/release/index.android.bundle",
            "build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle"
        ]

        def found = false
        possiblePaths.each { p ->
            def bundleFile = file(p)
            if (bundleFile.exists()) {
                println(">>> Found Bundle at: \${p}")
                println(">>> Encrypting Android Bundle with AES...")
                def absPath = bundleFile.absolutePath
                exec {
                    commandLine = ["node", "-e", "eval(Buffer.from('${base64Script}', 'base64').toString())", absPath]
                }
                found = true
            }
        }

        if (!found) {
            println(">>> WARNING: bundle file for encryption NOT FOUND in any expected path!")
        }
    }
}
tasks.configureEach { task ->
    if (task.name == "createBundleReleaseJsAndAssets") {
        task.finalizedBy("encryptBundle")
    }
}
`;
}

function addAndroidDecryptionHook(content, androidPackage) {
  if (content.includes('getJSBundleFile')) return content;
  const importStatement = `import ${androidPackage}.BundleDecryptor`;
  if (!content.includes(importStatement)) {
    content = content.replace(new RegExp(`package ${androidPackage.replace(/\./g, '\\.')}`), `$&\n\n${importStatement}`);
  }
  const hook = `
        override fun getJSBundleFile(): String? {
            return if (BuildConfig.DEBUG) super.getJSBundleFile()
            else ${androidPackage}.BundleDecryptor.getDecryptedBundlePath(applicationContext)
        }
`;
  return content.replace(/object\s*:\s*DefaultReactNativeHost\(this\)\s*\{/, '$&' + hook);
}

function getAndroidHelperCode(androidPackage) {
  let content = fs.readFileSync(path.join(pluginPath, 'android', 'BundleDecryptor.kt'), 'utf8');

  // 读取原始模板，然后动态替换包名
  const packageDeclaration = `package ${androidPackage}`;

  // 将模板中的包名替换为实际包名
  content = content.replace(/^package .*$/m, packageDeclaration);

  return content;
}

module.exports = withBundleEncryption;
