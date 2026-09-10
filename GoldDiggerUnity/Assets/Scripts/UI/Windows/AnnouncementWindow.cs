using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>公告页（对标原版 AnnouncementWindow，含本地快照）。</summary>
    public class AnnouncementWindow : UIWindowBase
    {
        private readonly List<string> _items = new List<string>(Configs.Announcements);

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 12, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "公告", Close);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);

            for (int i = 0; i < _items.Count; i++)
            {
                var card = UIFactory.VGroup(scroll, "Ann" + i, spacing: 10, padLeft: 28, padRight: 28, padTop: 24, padBottom: 24);
                var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
                cardBg.transform.SetAsFirstSibling();
                UIFactory.StretchFull(cardBg.rectTransform);
                UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
                UIFactory.Flex(cardBg.rectTransform, 1, 1);

                var title = UIFactory.Text(card, "公告 " + (i + 1), 32, Theme.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);
                UIFactory.SetHeight(title.rectTransform, 44, 44);
                var body = UIFactory.Text(card, _items[i], 28, Theme.TextMain, TextAnchor.UpperLeft);
            }
        }
    }
}
