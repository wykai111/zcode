using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>评分弹窗（对标原版 RateWindow + C2H_SubmitRateRequest）。</summary>
    public class RateWindow : UIWindowBase
    {
        private int _stars = 5;
        private readonly Text[] _starTexts = new Text[5];

        protected override void OnBuild()
        {
            var box = UIFactory.VGroup(Root, "Box", spacing: 20, align: TextAnchor.UpperCenter,
                padLeft: 56, padRight: 56, padTop: 44, padBottom: 40);
            box.anchorMin = box.anchorMax = new Vector2(0.5f, 0.5f);
            box.sizeDelta = new Vector2(820, 0);
            var fitter = box.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var bg = UIFactory.Panel(box, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);

            var title = UIFactory.Text(box, "喜欢这个游戏吗？", 38, Theme.TextMain, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(title.rectTransform, 50, 50);
            var sub = UIFactory.Text(box, "给个评分吧，帮助我们做得更好", 26, Theme.TextSub, TextAnchor.MiddleCenter);
            UIFactory.SetHeight(sub.rectTransform, 38, 38);

            var stars = UIFactory.HGroup(box, "Stars", spacing: 18, align: TextAnchor.MiddleCenter);
            UIFactory.SetHeight(stars, 80, 80);
            for (int i = 0; i < 5; i++)
            {
                int idx = i;
                var starBtn = UIFactory.Button(stars, "★", () => SetStars(idx + 1), Color.clear, 64, Theme.TextDim, 80);
                _starTexts[i] = starBtn.GetComponentInChildren<Text>();
            }
            SetStars(5);

            UIFactory.Button(box, "提交评分", () =>
            {
                Net.Call(new C2H_SubmitRateRequest { stars = _stars }, (NetResult<H2C_SubmitRateResponse> r) =>
                {
                    Toast("感谢您的评分！");
                    Close();
                });
            }, Theme.BtnGold, 30, height: 96);
            UIFactory.Button(box, "下次再说", () => Close(), Theme.BtnDark, 26, height: 80);
        }

        private void SetStars(int n)
        {
            _stars = n;
            for (int i = 0; i < 5; i++)
                _starTexts[i].color = i < n ? Theme.Gold : Theme.TextDim;
        }
    }
}
