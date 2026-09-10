using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>提现记录页（对标原版 WithdrawRecordWindow），实时刷新状态机流转。</summary>
    public class WithdrawRecordWindow : UIWindowBase
    {
        private RectTransform _list;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 12, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "提现记录", Close);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _list = scroll;

            EventBus.Subscribe<WithdrawStatusChangedEvent>(OnStatusChanged);
        }

        protected override void OnShow() => Rebuild();

        private void OnDestroy()
        {
            EventBus.Unsubscribe<WithdrawStatusChangedEvent>(OnStatusChanged);
        }

        private void OnStatusChanged(WithdrawStatusChangedEvent e) => Rebuild();

        private void Rebuild()
        {
            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);

            var records = PlayerModel.Data.withdrawRecords;
            if (records.Count == 0)
            {
                var empty = UIFactory.Text(_list, "暂无提现记录\n\n去大厅挖矿赚取 BTC 吧", 28, Theme.TextDim, TextAnchor.MiddleCenter);
                UIFactory.SetHeight(empty.rectTransform, 160, 160);
                return;
            }

            for (int i = records.Count - 1; i >= 0; i--) BuildItem(records[i]);
        }

        private void BuildItem(WithdrawRecordState r)
        {
            var card = UIFactory.VGroup(_list, "Rec_" + r.recordId, spacing: 8, padLeft: 24, padRight: 24, padTop: 18, padBottom: 18);
            var bg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 150, 150);

            var row1 = UIFactory.HGroup(card, "Row1", spacing: 12);
            UIFactory.SetHeight(row1, 50, 50);
            var amt = UIFactory.Text(row1, $"-{PlayerModel.FmtBtc(r.amount)} BTC", 34, Theme.BtcOrange, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.Flex(amt.rectTransform, 1);
            var status = UIFactory.Text(row1, WithdrawSystem.StatusText(r.status), 28,
                WithdrawSystem.StatusColor(r.status), TextAnchor.MiddleRight, FontStyle.Bold);
            UIFactory.SetWidth(status.rectTransform, 200, 200);

            var row2 = UIFactory.HGroup(card, "Row2", spacing: 10);
            UIFactory.SetHeight(row2, 40, 40);
            var sats = UIFactory.Text(row2, $"{r.sats} 聪", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetWidth(sats.rectTransform, 260, 260);
            var time = UIFactory.Text(row2, GameClock.Format(r.createTime), 24, Theme.TextDim, TextAnchor.MiddleLeft);
            UIFactory.Flex(time.rectTransform, 1);

            var addr = UIFactory.Text(card, "地址：" + r.address, 22, Theme.TextDim, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(addr.rectTransform, 32, 32);
        }
    }
}
