using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>登录页：游客登录 / Google 登录（mock）+ 用户协议勾选（对标原版 LoginWindow）。</summary>
    public class LoginWindow : UIWindowBase
    {
        protected override bool CloseOnMask => false;

        private Toggle _agree;
        private Button _guest;
        private Button _google;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 20, align: TextAnchor.MiddleCenter,
                padLeft: 80, padRight: 80, padTop: 320, padBottom: 60);
            UIFactory.StretchFull(col);

            var logo = UIFactory.Text(col, "BITCOIN MINER", 60, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(logo.rectTransform, 80, 80);
            var sub = UIFactory.Text(col, "Gold Diggers", 34, Theme.TextSub, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(sub.rectTransform, 46, 46);
            var slogan = UIFactory.Text(col, "挖矿 · 算力 · 赚取 BTC", 26, Theme.TextDim, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(slogan.rectTransform, 36, 36);

            // 弹性占位
            var spacer = UIFactory.Node(col, "Spacer");
            UIFactory.Flex(spacer, 1, 1);

            _agree = UIFactory.Toggle(col, "我已阅读并同意《用户协议》与《隐私政策》", PlayerModel.Data.agreementAccepted,
                v => PlayerModel.Data.agreementAccepted = v);
            UIFactory.SetHeight((RectTransform)_agree.transform, 52, 52);

            _guest = UIFactory.Button(col, "游客登录", OnGuest, Theme.BtnGreen, 34, height: 104);
            _google = UIFactory.Button(col, "Google 登录（模拟）", OnGoogle, Theme.BtnDark, 34, height: 104);

            var note = UIFactory.Text(col, "提示：本工程为前端复刻演示，账号数据仅保存在本地", 22, Theme.TextDim, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(note.rectTransform, 34, 34);
        }

        private void OnGuest()
        {
            if (!CheckAgree()) return;
            DoLogin(1);
        }

        private void OnGoogle()
        {
            if (!CheckAgree()) return;
            // 原版：GoogleSignIn → idToken → C2G_Login
            Dialog.Show("Google 登录", "此处模拟 Google Sign-In 拉起账号选择。\n继续将以模拟账号登录。", () => DoLogin(2));
        }

        private bool CheckAgree()
        {
            if (_agree.isOn) return true;
            Toast("请先勾选同意《用户协议》与《隐私政策》");
            return false;
        }

        private void DoLogin(int loginType)
        {
            _guest.interactable = false;
            _google.interactable = false;
            Net.Call(new C2G_LoginRequest { loginType = loginType, account = "", authToken = "mock_token" }, (NetResult<G2C_LoginResponse> r) =>
            {
                if (!r.ok)
                {
                    Toast("登录失败：" + r.msg);
                    _guest.interactable = true;
                    _google.interactable = true;
                    return;
                }
                Storage.Save();
                Close();
                GameManager.Instance.EnterHall();
            });
        }
    }
}
