using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>商店页（对标原版 StoreWindow）：金币礼包模拟内购，充值总额决定 VIP。</summary>
    public class StoreWindow : UIWindowBase
    {
        private RectTransform _list;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 14, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "商店", Close);

            var tip = UIFactory.Text(col, "金币用于解锁矿机；充值额度累计升级 VIP（本工程为模拟支付，不产生真实扣费）",
                24, Theme.TextDim, TextAnchor.UpperLeft);
            UIFactory.SetHeight(tip.rectTransform, 64, 64);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _list = scroll;

            EventBus.Subscribe<H2C_PurchaseCompletedPushFlag>(OnPurchased);
        }

        protected override void OnShow() => Rebuild();

        private void OnDestroy() => EventBus.Unsubscribe<H2C_PurchaseCompletedPushFlag>(OnPurchased);

        private void OnPurchased(H2C_PurchaseCompletedPushFlag e)
        {
            Toast($"购买成功，获得 {PlayerModel.FmtGold(e.gold)} 金币");
            Rebuild();
        }

        private void Rebuild()
        {
            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);
            foreach (var cfg in Configs.Shop) BuildItem(cfg);
        }

        private void BuildItem(ShopCfg cfg)
        {
            bool firstGift = cfg.firstGift && PlayerModel.Data.totalRechargeUsd <= 0;

            var card = UIFactory.VGroup(_list, cfg.productId, spacing: 8, padLeft: 24, padRight: 24, padTop: 18, padBottom: 18);
            var bg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 140, 140);

            var row = UIFactory.HGroup(card, "Row", spacing: 12);
            UIFactory.SetHeight(row, 96, 96);

            var info = UIFactory.VGroup(row, "Info", spacing: 4);
            UIFactory.Flex(info, 1);
            var name = UIFactory.Text(info, cfg.name + (firstGift ? "（首充双倍）" : ""), 30,
                firstGift ? Theme.Gold : Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.SetHeight(name.rectTransform, 42, 42);
            var gold = UIFactory.Text(info, $"金币 × {PlayerModel.FmtGold(firstGift ? cfg.gold * 2 : cfg.gold)}",
                26, Theme.Gold, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(gold.rectTransform, 36, 36);

            UIFactory.Button(row, $"${cfg.priceUsd:0.##}", () =>
            {
                Dialog.Show("确认购买", $"模拟支付 {cfg.priceUsd:0.##} 美元购买「{cfg.name}」？\n（演示工程，不会真实扣费）", () =>
                {
                    Net.Call(new C2H_BuyShopItemRequest { productId = cfg.productId, orderId = System.Guid.NewGuid().ToString("N").Substring(0, 12) },
                        (NetResult<H2C_PurchaseSuccessResponse> r) => { if (!r.ok) Toast(r.msg); });
                }, "支付");
            }, Theme.BtnGreen, 30, height: 80);
        }
    }
}
