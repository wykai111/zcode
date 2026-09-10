using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 新手引导（对标原版 Instruction/Guide）：4 步遮罩高亮 + 文案 + 点击继续。
    /// 简化实现：全屏半透明遮罩 + 中央说明卡，点击任意处进入下一步。
    /// </summary>
    public class GuideOverlay : UIWindowBase
    {
        public class Param { public bool firstEnter; }

        private static readonly string[] Steps =
        {
            "欢迎来到挖矿大厅！\n\n顶栏显示你的 BTC 余额、金币与总算力。",
            "解锁更多矿机可以提升算力，\n算力越高，每秒产出的 BTC 越多。\n\n广告矿机看广告即可免费开挖 24 小时。",
            "产出的 BTC 累计到最低额度后，\n可通过「提现」页提交闪电网络提现。",
            "每日签到、任务中心、邮件里都有金币奖励，\n金币用来解锁更强的矿机。\n\n祝您挖矿愉快！",
        };

        private int _step;
        private Text _text;
        private Text _stepLabel;

        protected override bool CloseOnMask => false;   // 必须走按钮完成引导，否则引导标记不会落盘

        protected override void OnBuild()
        {
            // 遮罩已在基类创建，加深一点
            var box = UIFactory.VGroup(Root, "Box", spacing: 18, align: TextAnchor.UpperCenter,
                padLeft: 56, padRight: 56, padTop: 44, padBottom: 40);
            box.anchorMin = box.anchorMax = new Vector2(0.5f, 0.5f);
            box.sizeDelta = new Vector2(860, 0);
            var fitter = box.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var bg = UIFactory.Panel(box, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);

            _stepLabel = UIFactory.Text(box, "新手引导 1/4", 26, Theme.Gold, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(_stepLabel.rectTransform, 36, 36);
            _text = UIFactory.Text(box, "", 32, Theme.TextMain, TextAnchor.UpperCenter);
            UIFactory.SetHeight(_text.rectTransform, 240, 240);

            var next = UIFactory.Button(box, "下一步", Next, Theme.BtnGold, 30, height: 92);
            var skip = UIFactory.Button(box, "跳过引导", Finish, Theme.BtnDark, 24, height: 72);
        }

        protected override void OnShow() => ShowStep();

        private void ShowStep()
        {
            _stepLabel.text = $"新手引导 {_step + 1}/{Steps.Length}";
            _text.text = Steps[_step];
        }

        private void Next()
        {
            _step++;
            if (_step >= Steps.Length) Finish();
            else ShowStep();
        }

        private void Finish()
        {
            PlayerModel.Data.guideDone = true;
            Storage.Save();
            Close();
        }
    }
}
