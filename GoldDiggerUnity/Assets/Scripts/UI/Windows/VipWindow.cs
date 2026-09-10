using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>VIP 页（对标原版 VipWindow/VipUpWindow）：等级进度 + 各级特权表 + 充值入口。</summary>
    public class VipWindow : UIWindowBase
    {
        private Text _curLevel;
        private Text _progress;
        private Slider _bar;
        private RectTransform _list;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 14, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "VIP 特权", Close);

            // 当前状态卡
            var card = UIFactory.VGroup(col, "Card", spacing: 10, padLeft: 28, padRight: 28, padTop: 24, padBottom: 24);
            var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            cardBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(cardBg.rectTransform);
            UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
            UIFactory.Flex(cardBg.rectTransform, 1, 1);

            var row = UIFactory.HGroup(card, "Row", spacing: 16);
            UIFactory.SetHeight(row, 56, 56);
            _curLevel = UIFactory.Text(row, "", 44, Theme.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.SetWidth(_curLevel.rectTransform, 200, 200);
            _progress = UIFactory.Text(row, "", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.Flex(_progress.rectTransform, 1);

            _bar = UIFactory.Progress(card, 0, Theme.Gold);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _list = scroll;

            var recharge = UIFactory.Button(col, "前往充值（模拟内购）", () =>
            {
                Close();
                UIManager.Open<StoreWindow>();
            }, Theme.BtnGold, 32, height: 100);

            EventBus.Subscribe<VipLevelChangedEvent>(OnData);
            EventBus.Subscribe<H2C_PurchaseCompletedPushFlag>(OnData2);
        }

        protected override void OnShow() => Rebuild();

        private void OnDestroy()
        {
            EventBus.Unsubscribe<VipLevelChangedEvent>(OnData);
            EventBus.Unsubscribe<H2C_PurchaseCompletedPushFlag>(OnData2);
        }

        private void OnData(VipLevelChangedEvent e) => Rebuild();
        private void OnData2(H2C_PurchaseCompletedPushFlag e) => Rebuild();

        private void Rebuild()
        {
            int lv = VipSystem.Level;
            var next = VipSystem.NextVip;
            _curLevel.text = "VIP" + lv;
            if (next != null)
            {
                double cur = PlayerModel.Data.totalRechargeUsd;
                double p = Mathf.Clamp01((float)((cur - Configs.Vips[lv].needRechargeUsd) /
                                                (next.needRechargeUsd - Configs.Vips[lv].needRechargeUsd)));
                _bar.value = p;
                _progress.text = $"累计充值 ${cur:0.##} / ${next.needRechargeUsd:0.#}  升级至 VIP{next.level}";
            }
            else
            {
                _bar.value = 1;
                _progress.text = $"累计充值 ${PlayerModel.Data.totalRechargeUsd:0.##}  已达最高等级";
            }

            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);
            foreach (var v in Configs.Vips) BuildVipRow(v, v.level == lv);
        }

        private void BuildVipRow(VipCfg v, bool current)
        {
            var card = UIFactory.VGroup(_list, "Vip" + v.level, spacing: 6, padLeft: 24, padRight: 24, padTop: 16, padBottom: 16);
            var bg = UIFactory.Panel(card, "Bg", current ? Theme.PanelHi : Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 140, 140);

            var row1 = UIFactory.HGroup(card, "R1", spacing: 12);
            UIFactory.SetHeight(row1, 44, 44);
            var name = UIFactory.Text(row1, v.name + (current ? "（当前）" : ""), 32,
                current ? Theme.Gold : Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.Flex(name.rectTransform, 1);
            var need = UIFactory.Text(row1, v.needRechargeUsd <= 0 ? "免费" : $"充值 ${v.needRechargeUsd:0.#}",
                24, Theme.TextSub, TextAnchor.MiddleRight);
            UIFactory.SetWidth(need.rectTransform, 260, 260);

            var row2 = UIFactory.Text(card,
                $"单笔提现上限 {PlayerModel.FmtBtc(v.withdrawMaxPerDay)} BTC · 每日 {DescribeCount(v)} · 全局算力 +{v.bonusHashPercent}%",
                24, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(row2.rectTransform, 36, 36);
        }

        private static string DescribeCount(VipCfg v)
            => v.withdrawCountPerDay < 0 ? "无限次" : v.withdrawCountPerDay + " 次";
    }
}
