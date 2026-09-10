#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace GD.EditorTools
{
    /// <summary>
    /// 首次打开工程时自动生成 Main.unity（Camera + GameBootstrap）并打开。
    /// 工程所有 UI 均由代码构建，场景只需这一个挂载点。
    /// </summary>
    [InitializeOnLoad]
    public static class SceneGenerator
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";

        static SceneGenerator()
        {
            EditorApplication.delayCall += Generate;
        }

        private static void Generate()
        {
            if (File.Exists(ScenePath)) return;

            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            var boot = new GameObject("GameBootstrap");
            boot.AddComponent<GD.GameBootstrap>();

            Directory.CreateDirectory("Assets/Scenes");
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"[GD] 已生成场景：{ScenePath}");

            if (!EditorApplication.isPlaying)
                EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
        }
    }
}
#endif
