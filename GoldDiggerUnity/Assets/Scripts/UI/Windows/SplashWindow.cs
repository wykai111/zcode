using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>启动页：Logo + 假加载条，完成后进登录页。</summary>
    public class SplashWindow : UIWindowBase
    {
        protected override bool CloseOnMask => false;

        private Slider _bar;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 28, align: TextAnchor.MiddleCenter);
            UIFactory.StretchFull(col);

            var logo = UIFactory.Text(col, "BITCOIN MINER", 72, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(logo.rectTransform, 90, 90);
            var sub = UIFactory.Text(col, "Gold Diggers · Unity 复刻版", 30, Theme.TextSub, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(sub.rectTransform, 40, 40);

            _bar = UIFactory.Progress(col, 0f, Theme.Gold);
            ((RectTransform)_bar.transform).sizeDelta = new Vector2(560, 20);
            var tip = UIFactory.Text(col, "正在加载配置…", 24, Theme.TextDim, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(tip.rectTransform, 36, 36);

            var copy = UIFactory.Text(col, "仅供技术学习 · 数据仅存本地 · 广告与内购均为模拟", 22, Theme.TextDim, TextAnchor.MiddleCenter);
            copy.rectTransform.anchorMin = copy.rectTransform.anchorMax = new Vector2(0.5f, 0);
            copy.rectTransform.anchoredPosition = new Vector2(0, 80);
        }

        protected override void OnShow()
        {
            StartCoroutine(Loading());
        }

        private IEnumerator Loading()
        {
            float t = 0;
            while (t < 1.2f)
            {
                t += Time.unscaledDeltaTime;
                _bar.value = Mathf.Clamp01(t / 1.2f);
                yield return null;
            }
            Close();
            GameManager.Instance.BackToLogin();
        }
    }
}
