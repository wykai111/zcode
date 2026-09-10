using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 模拟广告服务：全屏倒计时假广告（激励视频 5s / 插屏 3s / 开屏 2s）。
    /// 激励视频倒计时结束出现"领取奖励"，提前关闭视为放弃（回调 false）。
    /// 上报走 C2H_VerifyRewardedAdRequest（服务端校验）。
    /// </summary>
    public class MockAdService : IAdService
    {
        public static readonly MockAdService Instance = new MockAdService();

        public static void Install() { /* Net.Service 已注入，无需额外安装 */ }

        private bool _showing;

        public void ShowRewarded(string placement, System.Action<bool> onDone)
        {
            Show("激励视频广告", placement, GameCfg.RewardedAdSeconds, true, onDone);
        }

        public void ShowInterstitial(string placement)
        {
            Show("插屏广告", placement, GameCfg.InterstitialSeconds, false, null);
        }

        public void ShowAppOpen(System.Action onDone)
        {
            Show("开屏广告", "app_open", GameCfg.AppOpenSeconds, false, onDone);
        }

        private void Show(string title, string placement, int seconds, bool rewarded, System.Action<bool> onDone)
        {
            if (_showing) { onDone?.Invoke(false); return; }
            _showing = true;

            var layer = UIManager.TopLayer;
            var root = UIFactory.Panel(layer, "MockAd_" + placement, Theme.Bg);

            // 内容区
            var box = UIFactory.VGroup(root.rectTransform, "Box", spacing: 24, align: TextAnchor.MiddleCenter,
                padLeft: 60, padRight: 60, padTop: 60, padBottom: 60);
            UIFactory.StretchFull(box);

            var head = UIFactory.Text(box, title, 34, Theme.TextSub, TextAnchor.MiddleCenter, FontStyle.Bold);
            var body = UIFactory.Text(box,
                "【模拟广告】\n此处为广告展示位\n\n原版接入 AppLovin MAX 聚合\n（Pangle/Mintegral/Moloco/IronSource 等 20+ 网络）\n本工程以倒计时假广告代替",
                30, Theme.TextDim, TextAnchor.MiddleCenter);
            var counter = UIFactory.Text(box, seconds + "s", 64, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);

            // 倒计时结束才出现的按钮
            Button action = null;
            if (rewarded)
            {
                action = UIFactory.Button(box, "领取奖励", null, Theme.BtnGreen, 32, height: 96);
                action.gameObject.SetActive(false);
                var a = action;
                a.onClick.AddListener(() =>
                {
                    _showing = false;
                    Object.Destroy(root.gameObject);
                    ReportAdWatched(placement);
                    onDone?.Invoke(true);
                });
            }
            else
            {
                var btn = UIFactory.Button(box, "继续", null, Theme.BtnGreen, 32, height: 96);
                btn.gameObject.SetActive(false);
                btn.onClick.AddListener(() =>
                {
                    _showing = false;
                    Object.Destroy(root.gameObject);
                    onDone?.Invoke(true);
                });
            }

            // 关闭按钮（倒计时结束后出现）
            var closeBtn = UIFactory.CloseButton(root.rectTransform, null);
            closeBtn.gameObject.SetActive(false);
            closeBtn.onClick.AddListener(() =>
            {
                _showing = false;
                Object.Destroy(root.gameObject);
                if (rewarded)
                {
                    ReportAdWatched(placement);   // 原版：未看完也会上报曝光事件
                    onDone?.Invoke(false);
                }
                else onDone?.Invoke(true);
            });

            GameManager.Instance.StartCoroutine(Countdown(counter, seconds, () =>
            {
                closeBtn.gameObject.SetActive(true);
                if (action != null) action.gameObject.SetActive(true);
                counter.text = "0s";
            }));
        }

        private static IEnumerator Countdown(Text counter, int seconds, System.Action onEnd)
        {
            int left = seconds;
            while (left > 0)
            {
                counter.text = left + "s";
                yield return new WaitForSeconds(1);
                left--;
            }
            onEnd();
        }

        /// <summary>上报广告事件（原版 C2H_VerifyRewardedAdRequest / ReportAdEvent）。</summary>
        private static void ReportAdWatched(string placement)
        {
            Net.Call(new C2H_VerifyRewardedAdRequest { placement = placement, adEventId = System.Guid.NewGuid().ToString("N").Substring(0, 8) },
                (NetResult<H2C_VerifyRewardedAdResponse> r) => { });
        }
    }
}
