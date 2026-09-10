using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 窗口基类：由 UIManager 创建全屏 RectTransform 并挂载本组件，
    /// 子类在 OnBuild 里用 UIFactory 搭建界面，OnShow 里刷新数据。
    /// </summary>
    public abstract class UIWindowBase : MonoBehaviour
    {
        /// <summary>窗口参数（Open 时传入）。</summary>
        public object param;

        protected RectTransform Root => (RectTransform)transform;

        protected virtual void OnBuild() { }
        protected virtual void OnShow() { }
        protected virtual void OnClose() { }

        /// <summary>弹窗背景点击是否关闭（默认 true，主界面窗口为 false）。</summary>
        protected virtual bool CloseOnMask => true;

        private CanvasGroup _cg;
        private bool _closed;

        public void BuildAndShow(object p)
        {
            param = p;
            // 全屏背景遮罩（点击可关闭）
            var mask = Panel(Root, "Mask", Theme.Mask);
            UIFactory.StretchFull(mask.rectTransform);
            var maskBtn = mask.gameObject.AddComponent<Button>();
            maskBtn.transition = Button.Transition.None;
            maskBtn.onClick.AddListener(() => { if (CloseOnMask) Close(); });

            OnBuild();
            OnShow();

            // 入场动画：缩放 + 淡入
            _cg = gameObject.AddComponent<CanvasGroup>();
            _cg.alpha = 0;
            _cg.interactable = true;
            transform.localScale = Vector3.one * 0.92f;
            StartCoroutine(AnimIn());
        }

        private System.Collections.IEnumerator AnimIn()
        {
            float t = 0;
            while (t < 0.18f)
            {
                t += Time.unscaledDeltaTime;
                float k = Mathf.SmoothStep(0, 1, t / 0.18f);
                _cg.alpha = k;
                transform.localScale = Vector3.Lerp(Vector3.one * 0.92f, Vector3.one, k);
                yield return null;
            }
            _cg.alpha = 1;
            transform.localScale = Vector3.one;
        }

        public void Close()
        {
            if (_closed) return;
            _closed = true;
            OnClose();
            UIManager.Close(this);
        }

        protected static void Toast(string msg) => UIManager.Toast(msg);
    }

    /// <summary>
    /// UI 根管理：Canvas、分层（Normal/Popup/Top）、窗口注册表、Toast。
    /// 关闭窗口时按频控模拟插屏广告。
    /// </summary>
    public static class UIManager
    {
        private static RectTransform _normal;
        private static RectTransform _popup;
        private static RectTransform _top;

        private static readonly Dictionary<Type, UIWindowBase> _windows = new Dictionary<Type, UIWindowBase>();
        private static long _lastInterstitialTime;

        public static Canvas Canvas { get; private set; }

        public static void Install()
        {
            var go = new GameObject("UICanvas");
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            Canvas = canvas;
            go.AddComponent<GraphicRaycaster>();
            var scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            _normal = CreateLayer(go.transform, "Normal");
            _popup = CreateLayer(go.transform, "Popup");
            _top = CreateLayer(go.transform, "Top");

            UnityEngine.Object.DontDestroyOnLoad(go);
        }

        private static RectTransform CreateLayer(Transform parent, string name)
        {
            var rt = new GameObject(name, typeof(RectTransform)).GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            UIFactory.StretchFull(rt);
            return rt;
        }

        // ---------------- 窗口管理 ----------------

        /// <summary>打开窗口（同类窗口已打开则忽略）。isPopup=false 放入常驻层。</summary>
        public static T Open<T>(object winParam = null, bool isPopup = true) where T : UIWindowBase
        {
            var type = typeof(T);
            if (_windows.TryGetValue(type, out var exist) && exist != null) return (T)exist;

            var go = new GameObject(type.Name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(isPopup ? _popup : _normal, false);
            UIFactory.StretchFull(rt);

            var win = go.AddComponent<T>();
            _windows[type] = win;
            win.BuildAndShow(winParam);
            return win;
        }

        public static void Close(UIWindowBase win)
        {
            if (win == null) return;
            _windows.Remove(win.GetType());
            UnityEngine.Object.Destroy(win.gameObject);
            TryShowInterstitial();
        }

        public static void Close<T>() where T : UIWindowBase
        {
            if (_windows.TryGetValue(typeof(T), out var win) && win != null) win.Close();
        }

        public static T Get<T>() where T : UIWindowBase
        {
            return _windows.TryGetValue(typeof(T), out var w) ? (T)w : null;
        }

        public static bool IsOpen<T>() where T : UIWindowBase => _windows.ContainsKey(typeof(T));

        private static void TryShowInterstitial()
        {
            if (!GameCfg.InterstitialEnabled) return;
            if (GameManager.Instance == null || GameManager.Instance.State != GameManager.GameState.Hall) return;
            long now = GameClock.Now;
            if (now - _lastInterstitialTime < GameCfg.InterstitialIntervalSec) return;
            _lastInterstitialTime = now;
            MockAdService.Instance.ShowInterstitial("window_close");
        }

        // ---------------- 顶层弹层挂点（Toast/广告用） ----------------

        public static RectTransform TopLayer => _top;

        /// <summary>轻提示。</summary>
        public static void Toast(string msg) => GD.Toast.Show(msg);
    }
}
