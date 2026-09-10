#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace GD.EditorTools
{
    /// <summary>
    /// APK 批处理构建脚本（命令行调用）：
    /// Unity -batchmode -nographics -quit \
    ///   -projectPath ... -executeMethod GD.EditorTools.BuildScript.BuildAndroid
    /// 自动：确保场景存在 → 配置 PlayerSettings → 签名 → 出包 Builds/GoldDiggers.apk
    /// </summary>
    public static class BuildScript
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";
        private const string ApkPath = "Builds/GoldDiggers.apk";
        private const string KeystorePath = "Builds/golddiggers.keystore";
        private const string KeystorePass = "gd123456";
        private const string KeystoreAlias = "golddiggers";

        public static void BuildAndroid()
        {
            Debug.Log("[Build] 开始 Android 打包流程");

            // 1. 确保场景存在（与 SceneGenerator 相同逻辑）
            if (!File.Exists(ScenePath))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
                var boot = new GameObject("GameBootstrap");
                boot.AddComponent<GD.GameBootstrap>();
                Directory.CreateDirectory("Assets/Scenes");
                EditorSceneManager.SaveScene(scene, ScenePath);
                Debug.Log($"[Build] 已生成场景 {ScenePath}");
            }
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);

            // 2. 构建场景列表
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };

            // 3. PlayerSettings
            PlayerSettings.companyName = "GD Studio";
            PlayerSettings.productName = "Gold Diggers Miner";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.gd.golddigger");
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel25;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;

            // ARM64 + IL2CPP（2019+ 上架与真机兼容）
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;

            // 横竖屏：竖屏 App
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.resizableWindow = false;

            // 4. 签名（keystore 由 keytool 预先生成）
            var ksFull = Path.GetFullPath(KeystorePath);
            if (File.Exists(ksFull))
            {
                PlayerSettings.Android.keystoreName = ksFull;
                PlayerSettings.Android.keystorePass = KeystorePass;
                PlayerSettings.Android.keyaliasName = KeystoreAlias;
                PlayerSettings.Android.keyaliasPass = KeystorePass;
                Debug.Log($"[Build] 使用签名：{ksFull}");
            }
            else
            {
                Debug.LogWarning("[Build] 未找到 keystore，将使用 debug 签名（仅本机安装）");
            }

            // 5. 出包
            Directory.CreateDirectory("Builds");
            var report = BuildPipeline.BuildPlayer(
                new[] { ScenePath }, ApkPath, BuildTarget.Android, BuildOptions.None);

            var summary = report.summary;
            Debug.Log($"[Build] 结果：{summary.result}，大小 {summary.totalSize / 1024 / 1024}MB，输出 {summary.outputPath}");

            if (summary.result != BuildResult.Succeeded)
            {
                Debug.LogError($"[Build] 失败：{summary.result}，错误 {summary.totalErrors} 个");
                EditorApplication.Exit(1);
            }
            else
            {
                Debug.Log("[Build] APK 打包成功 ✓");
                EditorApplication.Exit(0);
            }
        }
    }
}
#endif
