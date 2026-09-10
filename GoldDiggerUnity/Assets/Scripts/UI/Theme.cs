using UnityEngine;

namespace GD
{
    /// <summary>全局主题：深色矿洞 + 金色货币配色。</summary>
    public static class Theme
    {
        // —— 背景层级 ——
        public static readonly Color Bg        = new Color32(0x14, 0x18, 0x1F, 255);   // 页面底
        public static readonly Color Panel     = new Color32(0x1E, 0x24, 0x30, 255);   // 卡片
        public static readonly Color PanelHi   = new Color32(0x28, 0x30, 0x3F, 255);   // 卡片高亮
        public static readonly Color Divider   = new Color32(0x33, 0x3B, 0x4A, 255);

        // —— 品牌/货币色 ——
        public static readonly Color Gold      = new Color32(0xF0, 0xB9, 0x0B, 255);   // 金币/强调
        public static readonly Color BtcOrange = new Color32(0xF7, 0x93, 0x1A, 255);   // BTC 橙
        public static readonly Color Green     = new Color32(0x4C, 0xD9, 0x64, 255);   // 成功
        public static readonly Color Red       = new Color32(0xE5, 0x4D, 0x4D, 255);   // 失败/红点
        public static readonly Color Blue      = new Color32(0x4D, 0x8F, 0xE5, 255);   // 链接/次强调

        // —— 文字 ——
        public static readonly Color TextMain  = new Color32(0xF2, 0xF4, 0xF8, 255);
        public static readonly Color TextSub   = new Color32(0x9A, 0xA3, 0xB2, 255);
        public static readonly Color TextDim   = new Color32(0x66, 0x6E, 0x7D, 255);

        // —— 按钮 ——
        public static readonly Color BtnGold   = new Color32(0xE0, 0xA5, 0x08, 255);
        public static readonly Color BtnGreen  = new Color32(0x3D, 0xB8, 0x50, 255);
        public static readonly Color BtnDark   = new Color32(0x3A, 0x42, 0x52, 255);
        public static readonly Color BtnOrange = new Color32(0xE6, 0x7E, 0x22, 255);

        /// <summary>半透明遮罩（弹窗背景）。</summary>
        public static readonly Color Mask      = new Color32(0x00, 0x00, 0x00, 160);

        private static Font _font;
        public static Font Font
        {
            get
            {
                if (_font == null) _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                return _font;
            }
        }
    }
}
