using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>轻提示（对标原版 ToastWindow），1.8s 自动消失。</summary>
    public static class Toast
    {
        public static void Show(string msg)
        {
            var layer = UIManager.TopLayer;

            var rt = UIFactory.Node(layer, "Toast");
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.anchoredPosition = new Vector2(0, 220);

            var box = UIFactory.Panel(rt, "Box", new Color(0x22, 0x28, 0x33, 235), UIFactory.Round);
            UIFactory.StretchFull(box.rectTransform);
            var txt = UIFactory.Text(rt, msg, 30, Theme.TextMain, TextAnchor.MiddleCenter);
            UIFactory.Stretch(txt.rectTransform, 36, 20, 36, 20);

            var cg = rt.gameObject.AddComponent<CanvasGroup>();
            GameManager.Instance.StartCoroutine(Play(cg, rt));
        }

        private static IEnumerator Play(CanvasGroup cg, RectTransform rt)
        {
            float t = 0;
            while (t < 0.2f) { t += Time.unscaledDeltaTime; cg.alpha = t / 0.2f; yield return null; }
            cg.alpha = 1;
            yield return new WaitForSeconds(1.4f);
            t = 0;
            while (t < 0.3f) { t += Time.unscaledDeltaTime; cg.alpha = 1 - t / 0.3f; yield return null; }
            Object.Destroy(rt.gameObject);
        }
    }

    /// <summary>二次确认弹窗（对标原版 DialogWindow）。</summary>
    public static class Dialog
    {
        /// <summary>显示确认框。onOk 可为空（仅确定按钮）。</summary>
        public static void Show(string title, string msg, System.Action onOk, string okText = "确定", string cancelText = "取消")
        {
            var layer = UIManager.TopLayer;
            var mask = UIFactory.Panel(layer, "DialogMask", Theme.Mask);
            UIFactory.StretchFull(mask.rectTransform);
            var maskBtn = mask.gameObject.AddComponent<Button>();
            maskBtn.transition = Button.Transition.None;

            var box = UIFactory.VGroup(mask.rectTransform, "Dialog", spacing: 24,
                align: TextAnchor.UpperCenter, padLeft: 48, padRight: 48, padTop: 44, padBottom: 40);
            box.anchorMin = box.anchorMax = new Vector2(0.5f, 0.5f);
            box.pivot = new Vector2(0.5f, 0.5f);
            box.sizeDelta = new Vector2(820, 0);
            var fitter = box.gameObject.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var boxBg = UIFactory.Panel(box, "Bg", Theme.Panel, UIFactory.Round);
            boxBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(boxBg.rectTransform);
            UIFactory.SetHeight(boxBg.rectTransform, 0, 0);
            UIFactory.Flex(boxBg.rectTransform, 1, 1);

            var titleTxt = UIFactory.Text(box, title, 36, Theme.TextMain, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetHeight(titleTxt.rectTransform, 44, 44);
            var msgTxt = UIFactory.Text(box, msg, 30, Theme.TextSub, TextAnchor.UpperCenter);

            var btns = UIFactory.HGroup(box, "Btns", spacing: 24);
            UIFactory.SetHeight(btns, 88, 88);
            if (onOk != null)
            {
                var cancel = UIFactory.Button(btns, cancelText, () => Object.Destroy(mask.gameObject), Theme.BtnDark, 30);
                UIFactory.Flex(cancel.GetComponent<RectTransform>(), 1);
            }
            var ok = UIFactory.Button(btns, okText, () => { Object.Destroy(mask.gameObject); onOk?.Invoke(); }, Theme.BtnGold, 30);
            UIFactory.Flex(ok.GetComponent<RectTransform>(), 1);
            if (onOk == null) UIFactory.Flex(ok.GetComponent<RectTransform>(), 1);
        }
    }

    /// <summary>EventBus → Toast 桥接。</summary>
    public static class ToastBridge
    {
        public static void Install()
        {
            EventBus.Subscribe<ToastEvent>(e => Toast.Show(e.msg));
        }
    }
}
