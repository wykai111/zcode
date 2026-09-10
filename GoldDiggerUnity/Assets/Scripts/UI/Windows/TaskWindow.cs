using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>任务页（对标原版 TaskWindow）：每日/成就双 Tab，进度条 + 领取。</summary>
    public class TaskWindow : UIWindowBase
    {
        private RectTransform _list;
        private int _tab = 1;          // 1=每日 2=成就
        private Button _dailyBtn;
        private Button _achieveBtn;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 12, padLeft: 32, padRight: 32, padTop: 8, padBottom: 40);
            UIFactory.StretchFull(col);

            UIFactory.Header(col, "任务中心", Close);

            var tabs = UIFactory.HGroup(col, "Tabs", spacing: 12);
            UIFactory.SetHeight(tabs, 84, 84);
            _dailyBtn = UIFactory.Button(tabs, "每日任务", () => SwitchTab(1), Theme.BtnDark, 30);
            UIFactory.Flex(_dailyBtn.GetComponent<RectTransform>(), 1);
            _achieveBtn = UIFactory.Button(tabs, "成就任务", () => SwitchTab(2), Theme.BtnDark, 30);
            UIFactory.Flex(_achieveBtn.GetComponent<RectTransform>(), 1);

            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _list = scroll;

            EventBus.Subscribe<TaskChangedEvent>(OnTaskChanged);
            EventBus.Subscribe<PlayerDataChangedEvent>(OnData);
        }

        protected override void OnShow() => Refresh();

        private void OnDestroy()
        {
            EventBus.Unsubscribe<TaskChangedEvent>(OnTaskChanged);
            EventBus.Unsubscribe<PlayerDataChangedEvent>(OnData);
        }

        public void Refresh() => Rebuild();

        private void OnTaskChanged(TaskChangedEvent e) => Rebuild();
        private void OnData(PlayerDataChangedEvent e) { /* 领奖后货币刷新即可 */ }

        private void SwitchTab(int t)
        {
            _tab = t;
            Rebuild();
        }

        private void Rebuild()
        {
            _dailyBtn.image.color = _tab == 1 ? Theme.BtnGold : Theme.BtnDark;
            _achieveBtn.image.color = _tab == 2 ? Theme.BtnGold : Theme.BtnDark;

            for (int i = _list.childCount - 1; i >= 0; i--) Destroy(_list.GetChild(i).gameObject);
            foreach (var cfg in Configs.Tasks)
                if (cfg.type == _tab) BuildItem(cfg);
        }

        private void BuildItem(TaskCfg cfg)
        {
            var st = PlayerModel.GetTask(cfg.id);
            if (st == null) return;

            var card = UIFactory.VGroup(_list, cfg.id, spacing: 8, padLeft: 24, padRight: 24, padTop: 18, padBottom: 18);
            var bg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 170, 170);

            var row1 = UIFactory.HGroup(card, "R1", spacing: 12);
            UIFactory.SetHeight(row1, 44, 44);
            var desc = UIFactory.Text(row1, cfg.desc, 30, Theme.TextMain, TextAnchor.MiddleLeft);
            UIFactory.Flex(desc.rectTransform, 1);
            var prog = UIFactory.Text(row1, $"{Mathf.Min(st.progress, cfg.target)}/{cfg.target}", 26, Theme.TextSub, TextAnchor.MiddleRight);
            UIFactory.SetWidth(prog.rectTransform, 130, 130);

            var row2 = UIFactory.HGroup(card, "R2", spacing: 12);
            UIFactory.SetHeight(row2, 60, 60);
            var slider = UIFactory.Progress(row2, (float)st.progress / cfg.target);
            UIFactory.Flex(slider.GetComponent<RectTransform>(), 1, -1);

            var rewardText = cfg.rewardBtc > 0
                ? PlayerModel.FmtBtc(cfg.rewardBtc) + " BTC"
                : PlayerModel.FmtGold(cfg.rewardGold) + " 金币";

            if (st.claimed)
            {
                UIFactory.Text(row2, "已领取", 26, Theme.TextDim, TextAnchor.MiddleRight);
            }
            else if (st.progress >= cfg.target)
            {
                UIFactory.Button(row2, $"领取 {rewardText}", () =>
                {
                    Net.Call(new C2H_ClaimTaskRequest { taskId = cfg.id }, (NetResult<H2C_ClaimTaskResponse> r) =>
                    {
                        if (r.ok) Toast("奖励已发放：" + rewardText);
                        else Toast(r.msg);
                        Rebuild();
                    });
                }, Theme.BtnGreen, 24, height: 56);
            }
            else
            {
                UIFactory.Text(row2, "奖励 " + rewardText, 26, Theme.TextSub, TextAnchor.MiddleRight);
            }
        }
    }
}
