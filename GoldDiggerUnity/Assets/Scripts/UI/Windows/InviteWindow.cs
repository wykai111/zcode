using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>邀请页（对标原版 InviteWindow）：我的邀请码 + 绑定好友码 + 奖励说明。</summary>
    public class InviteWindow : UIWindowBase
    {
        private InputField _bindInput;
        private Button _bindBtn;
        private Text _myCode;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 16, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "邀请好友", Close);

            // 我的邀请码
            var card = UIFactory.VGroup(col, "MyCode", spacing: 10, padLeft: 28, padRight: 28, padTop: 24, padBottom: 24);
            var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            cardBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(cardBg.rectTransform);
            UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
            UIFactory.Flex(cardBg.rectTransform, 1, 1);

            var lb = UIFactory.Text(card, "我的邀请码", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(lb.rectTransform, 36, 36);
            var codeRow = UIFactory.HGroup(card, "CodeRow", spacing: 16);
            UIFactory.SetHeight(codeRow, 64, 64);
            _myCode = UIFactory.Text(codeRow, PlayerModel.Data.myInviteCode, 40, Theme.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.Flex(_myCode.rectTransform, 1);
            UIFactory.Button(codeRow, "复制", () =>
            {
                GUIUtility.systemCopyBuffer = PlayerModel.Data.myInviteCode;
                Toast("邀请码已复制");
            }, Theme.BtnDark, 26, height: 64);

            // 绑定
            var bindLabel = UIFactory.Text(col, "绑定好友邀请码（双方各得 300 金币）", 28, Theme.TextMain, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(bindLabel.rectTransform, 40, 40);
            var bindRow = UIFactory.HGroup(col, "BindRow", spacing: 12);
            UIFactory.SetHeight(bindRow, 88, 88);
            _bindInput = UIFactory.InputField(bindRow, "输入好友邀请码");
            UIFactory.Flex(_bindInput.GetComponent<RectTransform>(), 1);
            _bindBtn = UIFactory.Button(bindRow, "绑定", OnBind, Theme.BtnGreen, 28);
            UIFactory.SetWidth(_bindBtn.GetComponent<RectTransform>(), 180, 180);

            // 说明
            var tips = UIFactory.VGroup(col, "Tips", spacing: 6, padLeft: 28, padRight: 28, padTop: 22, padBottom: 22);
            var tipsBg = UIFactory.Panel(tips, "Bg", Theme.Panel, UIFactory.Round);
            tipsBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(tipsBg.rectTransform);
            UIFactory.SetHeight(tipsBg.rectTransform, 0, 0);
            UIFactory.Flex(tipsBg.rectTransform, 1, 1);

            var t1 = UIFactory.Text(tips, "邀请说明", 28, Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.SetHeight(t1.rectTransform, 40, 40);
            var t2 = UIFactory.Text(tips,
                "1. 将邀请码分享给好友；\n2. 好友在登录后绑定你的邀请码；\n3. 绑定成功双方立即各获得 300 金币；\n4. 每个账号仅可绑定一次。",
                26, Theme.TextSub, TextAnchor.UpperLeft);

            var sp = UIFactory.Node(col, "Spacer");
            UIFactory.Flex(sp, 1, 1);

            var stat = UIFactory.Text(col, $"已邀请好友：{PlayerModel.Data.invitedCount} 人", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetHeight(stat.rectTransform, 40, 40);
        }

        protected override void OnShow()
        {
            bool bound = !string.IsNullOrEmpty(PlayerModel.Data.boundInviteCode);
            _bindBtn.interactable = !bound;
            if (bound) _bindInput.text = PlayerModel.Data.boundInviteCode;
            _bindInput.interactable = !bound;
        }

        private void OnBind()
        {
            Net.Call(new C2H_BindInviteCodeRequest { code = _bindInput.text }, (NetResult<H2C_BindInviteCodeResponse> r) =>
            {
                Toast(r.ok ? r.data.msg : r.msg);
                if (r.ok) OnShow();
            });
        }
    }
}
