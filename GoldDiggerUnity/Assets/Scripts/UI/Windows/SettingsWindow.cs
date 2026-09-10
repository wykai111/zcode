using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>设置页（对标原版 SettingWindow）：音效/协议/评分/退出登录/删除账号。</summary>
    public class SettingsWindow : UIWindowBase
    {
        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 14, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "我的 / 设置", Close);

            // 账号信息
            var card = UIFactory.VGroup(col, "Account", spacing: 8, padLeft: 28, padRight: 28, padTop: 22, padBottom: 22);
            var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            cardBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(cardBg.rectTransform);
            UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
            UIFactory.Flex(cardBg.rectTransform, 1, 1);

            var d = PlayerModel.Data;
            var nameRow = UIFactory.Text(card,
                $"昵称：{d.nickname}\nUID：{d.uid}\n累计挖矿：{PlayerModel.FmtBtc(d.totalMinedBtc)} BTC\n累计提现：{PlayerModel.FmtBtc(d.totalWithdrawBtc)} BTC\n累计充值：${d.totalRechargeUsd:0.##}（VIP{VipSystem.Level}）",
                27, Theme.TextMain, TextAnchor.UpperLeft);
            UIFactory.SetHeight(nameRow.rectTransform, 200, 200);

            // 音效开关
            var soundRow = UIFactory.HGroup(col, "Sound", spacing: 12, padLeft: 28, padRight: 28, padTop: 18, padBottom: 18);
            var soundBg = UIFactory.Panel(soundRow, "Bg", Theme.Panel, UIFactory.Round);
            soundBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(soundBg.rectTransform);
            UIFactory.SetHeight(soundBg.rectTransform, 0, 0);
            UIFactory.Flex(soundBg.rectTransform, 1, 1);
            UIFactory.SetHeight(soundRow, 88, 88);
            var soundLabel = UIFactory.Text(soundRow, "游戏音效", 28, Theme.TextMain, TextAnchor.MiddleLeft);
            UIFactory.Flex(soundLabel.rectTransform, 1);
            UIFactory.Toggle(soundRow, "", d.soundOn, v => { d.soundOn = v; Storage.Save(); });

            var sp = UIFactory.Node(col, "Spacer");
            UIFactory.Flex(sp, 1, 1);

            // 功能按钮
            UIFactory.Button(col, "给我们评分", () => UIManager.Open<RateWindow>(), Theme.BtnDark, 30, height: 96);
            UIFactory.Button(col, "用户协议", () => Dialog.Show("用户协议",
                "本工程为 Unity 前端学习复刻项目（对标 Bitcoin Miner - Gold Diggers）。\n不提供任何真实金融服务，数据仅存于本地。", null, "知道了", ""), Theme.BtnDark, 30, height: 96);
            UIFactory.Button(col, "隐私政策", () => Dialog.Show("隐私政策",
                "演示应用不上传任何个人数据。\n所有账号/资产数据保存在设备本地（PlayerPrefs），卸载即清除。", null, "知道了", ""), Theme.BtnDark, 30, height: 96);
            UIFactory.Button(col, "退出登录", () =>
            {
                Dialog.Show("退出登录", "退出后进度保留在本机，下次登录可继续。", () =>
                {
                    Storage.Save();
                    UIManager.Close<HallWindow>();
                    Close();
                    GameManager.Instance.BackToLogin();
                });
            }, Theme.BtnDark, 30, height: 96);
            UIFactory.Button(col, "删除账号（清空本地数据）", () =>
            {
                Dialog.Show("删除账号", "将清空本机全部进度，且不可恢复。确定删除？", () =>
                {
                    Net.Call(new C2G_RequestDeleteAccountRequest(), (NetResult<G2C_RequestDeleteAccountResponse> r) =>
                    {
                        UIManager.Close<HallWindow>();
                        Close();
                        GameManager.Instance.BackToLogin();
                        Toast("账号已删除");
                    });
                }, "删除");
            }, Theme.Red, 30, height: 96);
        }
    }
}
