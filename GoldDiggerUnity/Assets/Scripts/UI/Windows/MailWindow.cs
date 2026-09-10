using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>邮件页（对标原版 MailWindow）：列表 + 详情 + 领取附件。</summary>
    public class MailWindow : UIWindowBase
    {
        private RectTransform _list;
        private System.Action<H2C_PurchaseCompletedPushFlag> _onPurchased;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 12, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "邮件", Close);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _list = scroll;

            EventBus.Subscribe<MailChangedEvent>(OnMailChanged);
            _onPurchased = e => Rebuild();
            EventBus.Subscribe(_onPurchased);
        }

        protected override void OnShow() => Rebuild();

        private void OnDestroy()
        {
            EventBus.Unsubscribe<MailChangedEvent>(OnMailChanged);
            EventBus.Unsubscribe(_onPurchased);
        }

        private void OnMailChanged(MailChangedEvent e) => Rebuild();

        private void Rebuild()
        {
            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);

            if (PlayerModel.Data.mails.Count == 0)
            {
                var empty = UIFactory.Text(_list, "暂无邮件", 28, Theme.TextDim, TextAnchor.MiddleCenter);
                UIFactory.SetHeight(empty.rectTransform, 120, 120);
                return;
            }
            foreach (var m in PlayerModel.Data.mails) BuildItem(m);
        }

        private void BuildItem(MailState m)
        {
            bool hasAttach = !m.claimed && (m.attachGold > 0 || m.attachBtc > 0);

            var card = UIFactory.VGroup(_list, "Mail_" + m.id, spacing: 8, padLeft: 24, padRight: 24, padTop: 18, padBottom: 18);
            var bg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 170, 170);

            var row1 = UIFactory.HGroup(card, "R1", spacing: 10);
            UIFactory.SetHeight(row1, 44, 44);
            if (!m.read || hasAttach) UIFactory.RedDot(row1);
            var title = UIFactory.Text(row1, m.title, 30, m.read ? Theme.TextSub : Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.Flex(title.rectTransform, 1);
            var time = UIFactory.Text(row1, GameClock.Format(m.time), 22, Theme.TextDim, TextAnchor.MiddleRight);
            UIFactory.SetWidth(time.rectTransform, 220, 220);

            var row2 = UIFactory.HGroup(card, "R2", spacing: 12);
            UIFactory.SetHeight(row2, 60, 60);

            var btnRead = UIFactory.Button(row2, m.read ? "查看" : "阅读", () =>
            {
                m.read = true;
                Storage.Save();
                Dialog.Show(m.title, m.body, null, "知道了", "");
                Rebuild();
            }, Theme.BtnDark, 24, height: 56);

            if (hasAttach)
            {
                UIFactory.Button(row2,
                    m.attachBtc > 0 ? $"领取 {PlayerModel.FmtBtc(m.attachBtc)} BTC" : $"领取 {PlayerModel.FmtGold(m.attachGold)} 金币",
                    () =>
                    {
                        Net.Call(new C2H_ClaimMailRequest { mailId = m.id }, (NetResult<H2C_ClaimMailResponse> r) =>
                        {
                            if (r.ok) Toast("附件已领取");
                            else Toast(r.msg);
                            Rebuild();
                        });
                    }, Theme.BtnGreen, 24, height: 56);
            }
            else
            {
                var done = UIFactory.Text(row2, m.claimed ? "附件已领" : "", 22, Theme.TextDim, TextAnchor.MiddleLeft);
            }
        }
    }
}
