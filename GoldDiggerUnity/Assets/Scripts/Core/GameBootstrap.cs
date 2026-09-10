using UnityEngine;
using UnityEngine.EventSystems;

namespace GD
{
    /// <summary>
    /// 游戏唯一场景入口。挂在 Main.unity 的 GameObject 上。
    /// 负责初始化各系统并启动游戏流程：开屏 → 登录 → 大厅。
    /// </summary>
    [DisallowMultipleComponent]
    public class GameBootstrap : MonoBehaviour
    {
        private static bool _booted;

        private void Awake()
        {
            if (_booted) { Destroy(gameObject); return; }
            _booted = true;
            DontDestroyOnLoad(gameObject);

            // uGUI 事件系统（代码创建，避免场景依赖）
            if (Object.FindObjectOfType<EventSystem>() == null)
            {
                var esGo = new GameObject("EventSystem");
                esGo.transform.SetParent(transform);
                esGo.AddComponent<EventSystem>();
                esGo.AddComponent<StandaloneInputModule>();
            }

            // 主循环驱动器
            var gmGo = new GameObject("GameManager");
            gmGo.transform.SetParent(transform);
            GameManager.Instance = gmGo.AddComponent<GameManager>();

            // 数据与网络
            Storage.Load();
            MockNetworkService.Install();
            MockAdService.Install();

            // UI 根（Canvas/缩放/层级）
            UIManager.Install();
            ToastBridge.Install();

            // 游戏逻辑系统
            MiningSystem.Install();
            WithdrawSystem.Install();
            VipSystem.Install();
            TaskSystem.Install();
            SignInSystem.Install();

            Debug.Log("[GD] GameBootstrap 完成，开始游戏流程");
            GameManager.Instance.StartFlow();
        }
    }
}
