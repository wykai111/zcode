using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>离线收益弹窗（对标原版 offline income 流程）：展示离线时长与收益，看广告双倍。</summary>
    public class OfflineIncomeWindow : UIWindowBase
    {
        public class Param { public long seconds; public double btc; }

        private Param _p;

        protected override void OnBuild()
        {
            _p = param as Param ?? new Param();

            var box = UIFactory.VGroup(Root, "Box", spacing: 22, align: TextAnchor.UpperCenter,
                padLeft: 56, padRight: 56, padTop: 48, padBottom: 44);
            box.anchorMin = box.anchorMax = new Vector2(0.5f, 0.5f);
            box.sizeDelta = new Vector2(860, 0);
            var fitter = box.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var bg = UIFactory.Panel(box, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);

            var title = UIFactory.Text(box, "离线收益", 40, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(title.rectTransform, 52, 52);

            var time = UIFactory.Text(box, $"离线时长：{GameClock.FormatDuration(_p.seconds)}", 30, Theme.TextSub, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(time.rectTransform, 44, 44);
            var btc = UIFactory.Text(box, $"+{PlayerModel.FmtBtc(_p.btc)} BTC", 46, Theme.BtcOrange, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(btc.rectTransform, 64, 64);
            var cap = UIFactory.Text(box, $"（离线收益按在线产出结算，单次上限 {GameCfg.OfflineCapHours} 小时）",
                22, Theme.TextDim, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(cap.rectTransform, 34, 34);

            var adBtn = UIFactory.Button(box, "看广告双倍领取 +" + PlayerModel.FmtBtc(_p.btc) + " BTC", () =>
            {
                MockAdService.Instance.ShowRewarded("offline_income_double", ok =>
                {
                    if (ok)
                    {
                        PlayerModel.Data.btc += _p.btc;
                        PlayerModel.Data.totalMinedBtc += _p.btc;
                        Storage.Save();
                        ServerSimulator.Inst.PushPlayerData();
                        Toast("双倍奖励已入账！");
                        Close();
                    }
                });
            }, Theme.BtnOrange, 30, height: 96);

            UIFactory.Button(box, "收下", () => Close(), Theme.BtnDark, 30, height: 88);
        }
    }
}
