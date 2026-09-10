using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 提现页（对标原版 WithdrawWindow）：
    /// 金额输入 + 闪电网络地址 + VIP 限额展示 + 每日次数。
    /// </summary>
    public class WithdrawWindow : UIWindowBase
    {
        private Text _balance;
        private Text _limitText;
        private Text _countText;
        private InputField _amount;
        private InputField _address;
        private Button _submit;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 16, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "提现", Close);

            // 余额卡
            var card = UIFactory.VGroup(col, "Balance", spacing: 8, padLeft: 28, padRight: 28, padTop: 24, padBottom: 24);
            var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            cardBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(cardBg.rectTransform);
            UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
            UIFactory.Flex(cardBg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 140, 140);

            var lb = UIFactory.Text(card, "可提余额（BTC）", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(lb.rectTransform, 36, 36);
            _balance = UIFactory.Text(card, "", 44, Theme.BtcOrange, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.SetHeight(_balance.rectTransform, 60, 60);

            // 限额说明
            _limitText = UIFactory.Text(col, "", 24, Theme.TextSub, TextAnchor.UpperLeft);
            UIFactory.SetHeight(_limitText.rectTransform, 66, 66);
            _countText = UIFactory.Text(col, "", 24, Theme.TextSub, TextAnchor.UpperLeft);
            UIFactory.SetHeight(_countText.rectTransform, 36, 36);

            // 输入区
            var amtLabel = UIFactory.Text(col, "提现金额（BTC）", 28, Theme.TextMain, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(amtLabel.rectTransform, 40, 40);
            var amtRow = UIFactory.HGroup(col, "AmtRow", spacing: 12);
            UIFactory.SetHeight(amtRow, 88, 88);
            _amount = UIFactory.InputField(amtRow, $"最小 {GameCfg.WithdrawMin}");
            UIFactory.Flex(_amount.GetComponent<RectTransform>(), 1);
            var all = UIFactory.Button(amtRow, "全部", () =>
            {
                _amount.text = PlayerModel.Data.btc.ToString("0.00000000");
            }, Theme.BtnDark, 26);
            UIFactory.SetWidth(all.GetComponent<RectTransform>(), 130, 130);

            var addrLabel = UIFactory.Text(col, "闪电网络收款地址", 28, Theme.TextMain, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(addrLabel.rectTransform, 40, 40);
            _address = UIFactory.InputField(col, "格式：name@domain.com 或 lnbc 开头的付款请求");
            _address.text = PlayerModel.Data.lastWithdrawAddress;

            var tip = UIFactory.Text(col,
                "请确认闪电网络地址正确，提现提交后由系统自动审核处理。\n状态流转：已提交 → 审核通过 → 处理中 → 打款成功",
                22, Theme.TextDim, TextAnchor.UpperLeft);
            UIFactory.SetHeight(tip.rectTransform, 70, 70);

            var sp = UIFactory.Node(col, "Spacer");
            UIFactory.Flex(sp, 1, 1);

            _submit = UIFactory.Button(col, "提交提现", OnSubmit, Theme.BtnGold, 34, height: 104);

            var record = UIFactory.Button(col, "查看提现记录", () => UIManager.Open<WithdrawRecordWindow>(), Theme.BtnDark, 28, height: 88);
        }

        protected override void OnShow()
        {
            Refresh();
        }

        private void Refresh()
        {
            var vip = VipSystem.CurVip;
            _balance.text = PlayerModel.FmtBtc(PlayerModel.Data.btc);
            _limitText.text = $"单笔限额：{PlayerModel.FmtBtc(GameCfg.WithdrawMin)} ~ {PlayerModel.FmtBtc(vip.withdrawMaxPerDay)} BTC（升级 VIP 提升额度）";
            int left = WithdrawSystem.TodayLeftCount();
            _countText.text = left < 0
                ? "今日剩余次数：不限（VIP 特权）"
                : $"今日剩余次数：{left} 次";
        }

        private void OnSubmit()
        {
            double amt;
            if (!double.TryParse(_amount.text.Trim(), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out amt))
            {
                Toast("请输入正确的金额");
                return;
            }
            string addr = _address.text == null ? "" : _address.text.Trim();
            if (string.IsNullOrEmpty(addr)) { Toast("请输入收款地址"); return; }

            _submit.interactable = false;
            Net.Call(new C2H_WithdrawRequest { amountBtc = amt, address = addr }, (NetResult<H2C_WithdrawResponse> r) =>
            {
                _submit.interactable = true;
                if (r.ok)
                {
                    Toast("提现申请已提交，请到记录页查看进度");
                    Close();
                }
                else Toast(r.msg);
            });
        }
    }
}
