using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>7 日签到页（对标原版 SevenDaySignIn）：每日一签，看广告双倍。</summary>
    public class SignInWindow : UIWindowBase
    {
        private RectTransform _grid;
        private Text _status;
        private Button _signBtn;
        private Button _adBtn;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 16, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "每日签到", Close);

            _status = UIFactory.Text(col, "", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(_status.rectTransform, 40, 40);

            // 7 天网格
            _grid = UIFactory.Node(col, "Grid");
            var grid = _grid.gameObject.AddComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(210, 210);
            grid.spacing = new Vector2(18, 18);
            grid.padding = new RectOffset(12, 12, 12, 12);
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 3;
            UIFactory.SetHeight(_grid, 210 * 3 + 18 * 2 + 24, 210 * 3 + 18 * 2 + 24);

            var sp = UIFactory.Node(col, "Spacer");
            UIFactory.Flex(sp, 1, 1);

            _adBtn = UIFactory.Button(col, "看广告签到（奖励双倍）", () =>
            {
                MockAdService.Instance.ShowRewarded("signin_double", ok =>
                {
                    if (ok) DoSign(true);
                    else Toast("需看完广告才能双倍");
                });
            }, Theme.BtnOrange, 30, height: 100);

            _signBtn = UIFactory.Button(col, "立即签到", () => DoSign(false), Theme.BtnGold, 32, height: 100);
        }

        protected override void OnShow() => Rebuild();

        private void DoSign(bool adDouble)
        {
            Net.Call(new C2H_SevenDaySignClaimRequest { adDouble = adDouble }, (NetResult<H2C_GetSevenDaySignInfoResponse> r) =>
            {
                if (r.ok)
                {
                    var cfg = Configs.SevenDays[SignInSystem.CurDayIndex == 0 ? 6 : SignInSystem.CurDayIndex - 1];
                    string reward = cfg.rewardBtc > 0
                        ? PlayerModel.FmtBtc(cfg.rewardBtc * (adDouble ? 2 : 1)) + " BTC"
                        : PlayerModel.FmtGold(cfg.rewardGold * (adDouble ? 2 : 1)) + " 金币";
                    Toast($"签到成功，获得 {reward}");
                    Rebuild();
                }
                else Toast(r.msg);
            });
        }

        private void Rebuild()
        {
            int cur = SignInSystem.CurDayIndex;
            bool signed = SignInSystem.SignedToday;
            int doneIndex = signed ? (cur == 0 ? 6 : cur - 1) : -1;

            _status.text = signed
                ? $"今日已签到 · 第 {PlayerModel.Data.signRounds + 1} 轮 · 明日可领第 {cur + 1} 天奖励"
                : $"今日可领取第 {cur + 1} 天奖励 · 已完成 {PlayerModel.Data.signRounds} 轮";

            for (int i = _grid.childCount - 1; i >= 0; i--) Destroy(_grid.GetChild(i).gameObject);
            foreach (var cfg in Configs.SevenDays) BuildDay(cfg, cfg.day - 1 <= doneIndex, cfg.day - 1 == (signed ? doneIndex : cur));

            _signBtn.interactable = !signed;
            _adBtn.interactable = !signed;
            var signTxt = _signBtn.GetComponentInChildren<Text>();
            if (signTxt != null) signTxt.text = signed ? "今日已签到" : "立即签到";
        }

        private void BuildDay(SevenDayCfg cfg, bool claimed, bool highlight)
        {
            var card = UIFactory.VGroup(_grid, "Day" + cfg.day, spacing: 6, align: TextAnchor.MiddleCenter,
                padTop: 16, padBottom: 16);
            var bg = UIFactory.Panel(card, "Bg",
                claimed ? Theme.Green : highlight ? Theme.PanelHi : Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);

            var d = UIFactory.Text(card, "第" + cfg.day + "天", 28, claimed ? Color.white : Theme.TextSub, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(d.rectTransform, 38, 38);

            var reward = cfg.rewardBtc > 0
                ? UIFactory.Text(card, PlayerModel.FmtBtc(cfg.rewardBtc) + "\nBTC", 26, Theme.BtcOrange, TextAnchor.MiddleCenter, FontStyle.Bold)
                : UIFactory.Text(card, PlayerModel.FmtGold(cfg.rewardGold) + "\n金币", 26, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(reward.rectTransform, 70, 70);

            var mark = UIFactory.Text(card, claimed ? "已领" : highlight ? "待领取" : "", 22,
                claimed ? Color.white : Theme.Gold, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(mark.rectTransform, 30, 30);
        }
    }
}
