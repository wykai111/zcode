using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 代码构建 uGUI 控件的工厂。全部界面运行时生成，无预制体依赖。
    /// 设计分辨率 1080x1920。
    /// </summary>
    public static class UIFactory
    {
        // ==================== 运行时生成的 Sprite ====================

        private static Sprite _circle;
        private static Sprite _round;

        /// <summary>圆形（金币/圆点）。</summary>
        public static Sprite Circle
        {
            get
            {
                if (_circle == null)
                {
                    int s = 128;
                    var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
                    float c = (s - 1) * 0.5f, r = c;
                    for (int y = 0; y < s; y++)
                        for (int x = 0; x < s; x++)
                        {
                            float d = Mathf.Sqrt((x - c) * (x - c) + (y - c) * (y - c));
                            float a = Mathf.Clamp01((r - d) / 1.5f);
                            tex.SetPixel(x, y, new Color(1, 1, 1, a));
                        }
                    tex.Apply();
                    _circle = Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 100f);
                }
                return _circle;
            }
        }

        /// <summary>九宫格圆角矩形（卡片/按钮底）。</summary>
        public static Sprite Round
        {
            get
            {
                if (_round == null)
                {
                    int s = 128, r = 28;
                    var tex = new Texture2D(s, s, TextureFormat.RGBA32, false);
                    for (int y = 0; y < s; y++)
                        for (int x = 0; x < s; x++)
                        {
                            float dx = Mathf.Max(0, r - x - 0.5f, x - (s - 1 - r) + 0.5f);
                            float dy = Mathf.Max(0, r - y - 0.5f, y - (s - 1 - r) + 0.5f);
                            float d = Mathf.Sqrt(dx * dx + dy * dy);
                            float a = Mathf.Clamp01((r - d) / 1.5f);
                            tex.SetPixel(x, y, new Color(1, 1, 1, a));
                        }
                    tex.Apply();
                    _round = Sprite.Create(tex, new Rect(0, 0, s, s), new Vector2(0.5f, 0.5f), 100f,
                        0, SpriteMeshType.FullRect, new Vector4(r, r, r, r));
                }
                return _round;
            }
        }

        // ==================== 基础元素 ====================

        /// <summary>创建空节点（RectTransform）。</summary>
        public static RectTransform Node(RectTransform parent, string name)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            return rt;
        }

        /// <summary>面板：带底色的 Image。</summary>
        public static Image Panel(RectTransform parent, string name, Color color, Sprite sprite = null)
        {
            var rt = Node(parent, name);
            var img = rt.gameObject.AddComponent<Image>();
            img.color = color;
            img.sprite = sprite;
            if (sprite != null) img.type = Image.Type.Sliced;
            img.raycastTarget = true;
            return img;
        }

        /// <summary>文字。align 决定对齐与换行。</summary>
        public static Text Text(RectTransform parent, string content, int size,
            Color? color = null, TextAnchor align = TextAnchor.MiddleLeft,
            FontStyle style = FontStyle.Normal)
        {
            var rt = Node(parent, "Text");
            var t = rt.gameObject.AddComponent<Text>();
            t.font = Theme.Font;
            t.text = content;
            t.fontSize = size;
            t.fontStyle = style;
            t.color = color ?? Theme.TextMain;
            t.alignment = align;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            t.resizeTextForBestFit = false;
            return t;
        }

        /// <summary>按钮（圆角底 + 居中文字）。</summary>
        public static Button Button(RectTransform parent, string label, Action onClick,
            Color? bg = null, int fontSize = 30, Color? labelColor = null, float? height = null)
        {
            var rt = Node(parent, "Btn_" + label);
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = Round;
            img.type = Image.Type.Sliced;
            img.color = bg ?? Theme.BtnGold;

            var btn = rt.gameObject.AddComponent<Button>();
            btn.targetGraphic = img;
            var cb = btn.colors;
            cb.normalColor = Color.white;
            cb.highlightedColor = new Color(1.08f, 1.08f, 1.08f, 1f);
            cb.pressedColor = new Color(0.85f, 0.85f, 0.85f, 1f);
            cb.disabledColor = new Color(0.5f, 0.5f, 0.5f, 0.5f);
            cb.fadeDuration = 0.08f;
            btn.colors = cb;
            if (onClick != null) btn.onClick.AddListener(() => { if (btn.interactable) onClick(); });

            var txt = Text(rt, label, fontSize, labelColor ?? Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
            Stretch(txt.rectTransform, 8, 8, 8, 8);

            if (height.HasValue) SetHeight(rt, height.Value, height.Value);
            return btn;
        }

        /// <summary>单行输入框。</summary>
        public static InputField InputField(RectTransform parent, string placeholder, int fontSize = 28)
        {
            var rt = Node(parent, "Input");
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = Round;
            img.type = Image.Type.Sliced;
            img.color = Theme.Bg;
            img.raycastTarget = true;

            var txt = Text(rt, "", fontSize, Theme.TextMain, TextAnchor.MiddleLeft);
            Stretch(txt.rectTransform, 20, 12, 20, 12);
            var ph = Text(rt, placeholder, fontSize, Theme.TextDim, TextAnchor.MiddleLeft);
            Stretch(ph.rectTransform, 20, 12, 20, 12);

            var input = rt.gameObject.AddComponent<InputField>();
            input.textComponent = txt;
            input.placeholder = ph;
            input.caretColor = Theme.Gold;
            input.selectionColor = new Color(Theme.Gold.r, Theme.Gold.g, Theme.Gold.b, 0.5f);
            SetHeight(rt, 88, 88);
            return input;
        }

        /// <summary>开关。</summary>
        public static Toggle Toggle(RectTransform parent, string label, bool init, Action<bool> onChange = null)
        {
            var rt = Node(parent, "Toggle");
            var tg = rt.gameObject.AddComponent<Toggle>();

            var box = Panel(rt, "Box", init ? Theme.Green : Theme.Bg, Round);
            SetSize(box.rectTransform, 44, 44);
            var mark = Panel(box.rectTransform, "Mark", Color.white, Circle);
            Stretch(mark.rectTransform, 10, 10, 10, 10);
            tg.targetGraphic = box;
            tg.graphic = mark;
            tg.isOn = init;
            if (onChange != null) tg.onValueChanged.AddListener(v => onChange(v));
            if (!string.IsNullOrEmpty(label))
            {
                var txt = Text(rt, label, 26, Theme.TextMain, TextAnchor.MiddleLeft);
                Stretch(txt.rectTransform, 56, 0, 4, 0);
            }
            return tg;
        }

        /// <summary>进度条。</summary>
        public static Slider Progress(RectTransform parent, float value01, Color? fill = null)
        {
            var rt = Node(parent, "Progress");
            var bg = Panel(rt, "Bg", Theme.Bg, Round);
            Stretch(bg.rectTransform, 0, 0, 0, 0);
            var fillArea = Node(rt, "FillArea");
            Stretch(fillArea, 0, 0, 0, 0);
            var fillImg = Panel(fillArea, "Fill", fill ?? Theme.Gold, Round);
            var slider = rt.gameObject.AddComponent<Slider>();
            slider.fillRect = fillImg.rectTransform;
            slider.targetGraphic = bg;
            slider.direction = Slider.Direction.LeftToRight;
            slider.minValue = 0;
            slider.maxValue = 1;
            slider.value = Mathf.Clamp01(value01);
            slider.interactable = false;
            SetHeight(rt, 20, 20);
            return slider;
        }

        /// <summary>红点。</summary>
        public static Image RedDot(RectTransform parent, Vector2? anchor = null)
        {
            var a = anchor ?? new Vector2(1, 1);
            var rt = Node(parent, "RedDot");
            rt.anchorMin = a; rt.anchorMax = a;
            rt.pivot = a;
            rt.anchoredPosition = Vector2.zero;
            SetSize(rt, 26, 26);
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = Circle;
            img.color = Theme.Red;
            img.raycastTarget = false;
            return img;
        }

        /// <summary>右上角关闭按钮（×）。</summary>
        public static Button CloseButton(RectTransform parent, Action onClick)
        {
            var rt = Node(parent, "CloseBtn");
            rt.anchorMin = rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(1, 1);
            rt.anchoredPosition = new Vector2(-16, -16);
            SetSize(rt, 72, 72);
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = Circle;
            img.color = Theme.BtnDark;
            var btn = rt.gameObject.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.onClick.AddListener(() => onClick?.Invoke());
            var txt = Text(rt, "×", 40, Theme.TextMain, TextAnchor.MiddleCenter);
            Stretch(txt.rectTransform, 0, 0, 0, 0);
            return btn;
        }

        // ==================== 布局 ====================

        /// <summary>纵向布局容器。</summary>
        public static RectTransform VGroup(RectTransform parent, string name,
            float spacing = 12, TextAnchor align = TextAnchor.UpperCenter,
            float padLeft = 0, float padRight = 0, float padTop = 0, float padBottom = 0,
            bool controlWidth = true, bool controlHeight = true)
        {
            var rt = Node(parent, name);
            var lg = rt.gameObject.AddComponent<VerticalLayoutGroup>();
            lg.spacing = spacing;
            lg.childAlignment = align;
            lg.padding = new RectOffset((int)padLeft, (int)padRight, (int)padTop, (int)padBottom);
            lg.childControlWidth = controlWidth;
            lg.childControlHeight = controlHeight;
            lg.childForceExpandWidth = !controlWidth;
            lg.childForceExpandHeight = !controlHeight;
            return rt;
        }

        /// <summary>横向布局容器。</summary>
        public static RectTransform HGroup(RectTransform parent, string name,
            float spacing = 12, TextAnchor align = TextAnchor.MiddleCenter,
            float padLeft = 0, float padRight = 0, float padTop = 0, float padBottom = 0,
            bool controlWidth = true, bool controlHeight = true)
        {
            var rt = Node(parent, name);
            var lg = rt.gameObject.AddComponent<HorizontalLayoutGroup>();
            lg.spacing = spacing;
            lg.childAlignment = align;
            lg.padding = new RectOffset((int)padLeft, (int)padRight, (int)padTop, (int)padBottom);
            lg.childControlWidth = controlWidth;
            lg.childControlHeight = controlHeight;
            lg.childForceExpandWidth = !controlWidth;
            lg.childForceExpandHeight = !controlHeight;
            return rt;
        }

        /// <summary>纵向滚动列表。返回 content（挂 VerticalLayoutGroup，已接 ContentSizeFitter）。</summary>
        public static RectTransform ScrollView(RectTransform parent, out RectTransform viewport)
        {
            var root = Node(parent, "ScrollView");
            var img = root.gameObject.AddComponent<Image>();
            img.color = Color.clear;
            img.raycastTarget = true;

            var vp = Node(root, "Viewport");
            Stretch(vp, 0, 0, 0, 0);
            vp.gameObject.AddComponent<RectMask2D>();

            var content = VGroup(vp, "Content", spacing: 16, padLeft: 16, padRight: 16, padTop: 16, padBottom: 16);
            // content 顶部锚定
            content.anchorMin = new Vector2(0, 1);
            content.anchorMax = new Vector2(1, 1);
            content.pivot = new Vector2(0.5f, 1);
            var fitter = content.gameObject.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            var scroll = root.gameObject.AddComponent<ScrollRect>();
            scroll.viewport = vp;
            scroll.content = content;
            scroll.horizontal = false;
            scroll.vertical = true;
            scroll.movementType = ScrollRect.MovementType.Clamped;
            scroll.scrollSensitivity = 30;
            scroll.elasticity = 0.08f;

            viewport = vp;
            return content;
        }

        // ==================== 尺寸工具 ====================

        public static void SetHeight(RectTransform rt, float min, float pref)
        {
            var le = rt.gameObject.GetComponent<LayoutElement>() ?? rt.gameObject.AddComponent<LayoutElement>();
            le.minHeight = min;
            le.preferredHeight = pref;
        }

        public static void SetWidth(RectTransform rt, float min, float pref)
        {
            var le = rt.gameObject.GetComponent<LayoutElement>() ?? rt.gameObject.AddComponent<LayoutElement>();
            le.minWidth = min;
            le.preferredWidth = pref;
        }

        public static void SetSize(RectTransform rt, float w, float h)
        {
            SetWidth(rt, w, w);
            SetHeight(rt, h, h);
        }

        /// <summary>占满弹性空间。</summary>
        public static void Flex(RectTransform rt, float flexW = -1, float flexH = -1)
        {
            var le = rt.gameObject.GetComponent<LayoutElement>() ?? rt.gameObject.AddComponent<LayoutElement>();
            if (flexW >= 0) le.flexibleWidth = flexW;
            if (flexH >= 0) le.flexibleHeight = flexH;
        }

        /// <summary>相对父级铺满（带边距）。</summary>
        public static void Stretch(RectTransform rt, float left, float top, float right, float bottom)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(left, bottom);
            rt.offsetMax = new Vector2(-right, -top);
        }

        public static void StretchFull(RectTransform rt) => Stretch(rt, 0, 0, 0, 0);

        /// <summary>窗口标准头部：标题 + 右上关闭。</summary>
        public static RectTransform Header(RectTransform parent, string title, Action onClose)
        {
            var head = HGroup(parent, "Header", spacing: 8, padLeft: 24, padRight: 100, padTop: 20, padBottom: 8);
            SetHeight(head, 88, 88);
            var t = Text(head, title, 38, Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            Flex(t.rectTransform, 1);
            if (onClose != null) CloseButton(parent, onClose);
            return head;
        }

        /// <summary>货币图标圆点 + 数值 组合（display 为已格式化文本）。</summary>
        public static Text CoinLabel(RectTransform parent, string prefix, string display, Color color, int fontSize = 28)
        {
            var row = HGroup(parent, "Coin", spacing: 8, controlWidth: false, controlHeight: false);
            var dot = Panel(row, "Dot", color, Circle);
            SetSize(dot.rectTransform, 30, 30);
            var txt = Text(row, prefix + display, fontSize, color, TextAnchor.MiddleLeft, FontStyle.Bold);
            return txt;
        }
    }
}
