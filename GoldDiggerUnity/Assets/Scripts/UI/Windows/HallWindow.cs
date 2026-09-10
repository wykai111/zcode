using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace GD
{
    /// <summary>
    /// 大厅主界面（对标原版 HallWindow）：
    /// 顶部货币栏 + 算力总览 + 矿机列表（普通/广告矿机）+ 底部导航。
    /// </summary>
    public class HallWindow : UIWindowBase
    {
        protected override bool CloseOnMask => false;

        private Text _btcText;
        private Text _goldText;
        private Text _hashText;
        private Text _perSecText;
        private Text _vipText;
        private RectTransform _minerList;
        private readonly Dictionary<int, Text> _minerTimers = new Dictionary<int, Text>();
        private Image _mailDot;
        private Image _taskDot;
        private Image _annDot;
        private Button _signBtn;

        protected override void OnBuild()
        {
            var bg = UIFactory.Panel(Root, "Bg", Theme.Bg);
            UIFactory.StretchFull(bg.rectTransform);

            var col = UIFactory.VGroup(Root, "Col", spacing: 12, padLeft: 24, padRight: 24, padTop: 20, padBottom: 8);
            UIFactory.StretchFull(col);

            BuildTopBar(col);
            BuildStatusCard(col);
            BuildFuncRow(col);

            // 矿机滚动列表
            RectTransform vp;
            var scroll = UIFactory.ScrollView(col, out vp);
            UIFactory.Flex(scroll, 1, 1);
            _minerList = scroll;

            BuildTabBar(col);

            // 订阅数据推送
            EventBus.Subscribe<PlayerDataChangedEvent>(OnPlayerData);
            EventBus.Subscribe<MinerListChangedEvent>(OnMinerList);
            EventBus.Subscribe<MailChangedEvent>(OnMailChanged);
            EventBus.Subscribe<TaskChangedEvent>(OnTaskChanged);
            EventBus.Subscribe<VipLevelChangedEvent>(OnVipChanged);
            EventBus.Subscribe<SignInDoneEvent>(OnSigned);
            EventBus.Subscribe<H2C_UpdateAnnouncementPush>(OnAnnPush);
        }

        protected override void OnShow()
        {
            RefreshCurrency();
            RebuildMiners();
            RefreshDots();
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<PlayerDataChangedEvent>(OnPlayerData);
            EventBus.Unsubscribe<MinerListChangedEvent>(OnMinerList);
            EventBus.Unsubscribe<MailChangedEvent>(OnMailChanged);
            EventBus.Unsubscribe<TaskChangedEvent>(OnTaskChanged);
            EventBus.Unsubscribe<VipLevelChangedEvent>(OnVipChanged);
            EventBus.Unsubscribe<SignInDoneEvent>(OnSigned);
            EventBus.Unsubscribe<H2C_UpdateAnnouncementPush>(OnAnnPush);
        }

        // ---------------- 顶部货币栏 ----------------
        private void BuildTopBar(RectTransform col)
        {
            var bar = UIFactory.HGroup(col, "TopBar", spacing: 16);
            UIFactory.SetHeight(bar, 72, 72);

            var btc = UIFactory.HGroup(bar, "Btc", spacing: 8, padLeft: 20, padRight: 20);
            UIFactory.Panel(btc, "Dot", Theme.BtcOrange, UIFactory.Circle).rectTransform.sizeDelta = new Vector2(34, 34);
            _btcText = UIFactory.Text(btc, "0.00000000", 30, Theme.BtcOrange, TextAnchor.MiddleLeft, FontStyle.Bold);

            var gold = UIFactory.HGroup(bar, "Gold", spacing: 8, padLeft: 20, padRight: 20);
            UIFactory.Panel(gold, "Dot", Theme.Gold, UIFactory.Circle).rectTransform.sizeDelta = new Vector2(34, 34);
            _goldText = UIFactory.Text(gold, "0", 30, Theme.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);

            var sp = UIFactory.Node(bar, "Spacer");
            UIFactory.Flex(sp, 1, -1);

            // VIP 徽章
            _vipText = UIFactory.Text(bar, "VIP0", 28, Theme.Gold, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.SetWidth(_vipText.rectTransform, 110, 110);
        }

        // ---------------- 算力状态卡 ----------------
        private void BuildStatusCard(RectTransform col)
        {
            var card = UIFactory.VGroup(col, "Status", spacing: 10, padLeft: 28, padRight: 28, padTop: 22, padBottom: 22);
            var cardBg = UIFactory.Panel(card, "Bg", Theme.Panel, UIFactory.Round);
            cardBg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(cardBg.rectTransform);
            UIFactory.SetHeight(cardBg.rectTransform, 0, 0);
            UIFactory.Flex(cardBg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 150, 150);

            var row1 = UIFactory.HGroup(card, "Row1", spacing: 12);
            UIFactory.SetHeight(row1, 44, 44);
            var t = UIFactory.Text(row1, "总算力", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetWidth(t.rectTransform, 160, 160);
            _hashText = UIFactory.Text(row1, "0 GH/s", 34, Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);

            var row2 = UIFactory.HGroup(card, "Row2", spacing: 12);
            UIFactory.SetHeight(row2, 40, 40);
            var t2 = UIFactory.Text(row2, "产出速率", 26, Theme.TextSub, TextAnchor.MiddleLeft);
            UIFactory.SetWidth(t2.rectTransform, 160, 160);
            _perSecText = UIFactory.Text(row2, "0 BTC/秒", 28, Theme.Green, TextAnchor.MiddleLeft, FontStyle.Bold);
        }

        // ---------------- 功能入口行 ----------------
        private void BuildFuncRow(RectTransform col)
        {
            var row = UIFactory.HGroup(col, "FuncRow", spacing: 12);
            UIFactory.SetHeight(row, 96, 96);

            _signBtn = UIFactory.Button(row, "每日签到", () => UIManager.Open<SignInWindow>(), Theme.BtnDark, 26);
            UIFactory.Flex(_signBtn.GetComponent<RectTransform>(), 1);
            RefreshSignBtn();

            var ann = UIFactory.Node(row, "AnnBtn");
            UIFactory.Flex(ann, 1);
            var annBtn = UIFactory.Button(ann, "公告", () =>
            {
                PlayerModel.Data.announcementRead = true;
                Storage.Save();
                UIManager.Open<AnnouncementWindow>();
            }, Theme.BtnDark, 26);
            UIFactory.StretchFull(annBtn.GetComponent<RectTransform>());
            _annDot = UIFactory.RedDot(annBtn.GetComponent<RectTransform>());

            var mail = UIFactory.Node(row, "MailBtn");
            UIFactory.Flex(mail, 1);
            var mailBtn = UIFactory.Button(mail, "邮件", () => UIManager.Open<MailWindow>(), Theme.BtnDark, 26);
            UIFactory.StretchFull(mailBtn.GetComponent<RectTransform>());
            _mailDot = UIFactory.RedDot(mailBtn.GetComponent<RectTransform>());

            var invite = UIFactory.Button(row, "邀请", () => UIManager.Open<InviteWindow>(), Theme.BtnDark, 26);
            UIFactory.Flex(invite.GetComponent<RectTransform>(), 1);

            var wd = UIFactory.Button(row, "提现", () => UIManager.Open<WithdrawWindow>(), Theme.BtnGold, 26);
            UIFactory.Flex(wd.GetComponent<RectTransform>(), 1);
        }

        // ---------------- 矿机列表 ----------------
        private void RebuildMiners()
        {
            _minerTimers.Clear();
            for (int i = _minerList.childCount - 1; i >= 0; i--)
                Destroy(_minerList.GetChild(i).gameObject);

            foreach (var st in PlayerModel.Data.miners)
            {
                var cfg = Configs.GetMiner(st.id);
                if (cfg != null) BuildMinerCard(cfg, st);
            }
        }

        private void BuildMinerCard(MinerCfg cfg, MinerState st)
        {
            var card = UIFactory.VGroup(_minerList, "Miner_" + cfg.id, spacing: 8,
                padLeft: 24, padRight: 24, padTop: 18, padBottom: 18);
            var bg = UIFactory.Panel(card, "Bg",
                PlayerModel.IsMinerActive(st) ? Theme.PanelHi : Theme.Panel, UIFactory.Round);
            bg.transform.SetAsFirstSibling();
            UIFactory.StretchFull(bg.rectTransform);
            UIFactory.SetHeight(bg.rectTransform, 0, 0);
            UIFactory.Flex(bg.rectTransform, 1, 1);
            UIFactory.SetHeight(card, 150, 150);

            // 第一行：名称 + 算力
            var row1 = UIFactory.HGroup(card, "Row1", spacing: 12);
            UIFactory.SetHeight(row1, 46, 46);
            var icon = UIFactory.Panel(row1, "Icon",
                cfg.adMiner ? Theme.Blue : Theme.Gold, UIFactory.Circle);
            icon.rectTransform.sizeDelta = new Vector2(40, 40);
            var name = UIFactory.Text(row1, cfg.name, 32, Theme.TextMain, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.SetWidth(name.rectTransform, 260, 260);
            var hash = UIFactory.Text(row1, cfg.hashRate + " GH/s", 30, Theme.Gold, TextAnchor.MiddleLeft, FontStyle.Bold);
            UIFactory.Flex(hash.rectTransform, 1);

            // 第二行：状态/按钮
            var row2 = UIFactory.HGroup(card, "Row2", spacing: 12);
            UIFactory.SetHeight(row2, 56, 56);

            bool active = PlayerModel.IsMinerActive(st);

            if (cfg.adMiner)
            {
                if (active)
                {
                    var left = UIFactory.Text(row2, "", 28, Theme.Green, TextAnchor.MiddleLeft, FontStyle.Bold);
                    UIFactory.Flex(left.rectTransform, 1);
                    _minerTimers[cfg.id] = left;
                    UpdateAdMinerLeft(cfg, left);
                }
                else
                {
                    var desc = UIFactory.Text(row2, $"看广告免费开挖 {cfg.durationHours} 小时", 26, Theme.TextSub, TextAnchor.MiddleLeft);
                    UIFactory.Flex(desc.rectTransform, 1);
                    UIFactory.Button(row2, "看广告解锁", () =>
                    {
                        MockAdService.Instance.ShowRewarded("ad_miner_" + cfg.id, ok =>
                        {
                            if (!ok) Toast("需看完广告才能解锁");
                        });
                    }, Theme.BtnOrange, 26, height: 60);
                }
            }
            else if (st.unlocked)
            {
                var run = UIFactory.Text(row2, "运行中 · 永久", 28, Theme.Green, TextAnchor.MiddleLeft, FontStyle.Bold);
                UIFactory.Flex(run.rectTransform, 1);
            }
            else
            {
                var price = UIFactory.Text(row2, "解锁价格  " + PlayerModel.FmtGold(cfg.goldPrice) + " 金币",
                    26, Theme.TextSub, TextAnchor.MiddleLeft);
                UIFactory.Flex(price.rectTransform, 1);
                UIFactory.Button(row2, "解锁", () =>
                {
                    Net.Call(new C2H_UnlockMinerRequest { minerId = cfg.id }, (NetResult<H2C_UnlockMinerResponse> r) =>
                    {
                        if (r.ok) Toast("已解锁 " + cfg.name);
                        else Toast(r.msg);
                    });
                }, PlayerModel.Data.gold >= cfg.goldPrice ? Theme.BtnGreen : Theme.BtnDark,
                26, height: 60);
            }
        }

        private void UpdateAdMinerLeft(MinerCfg cfg, Text label)
        {
            var st = PlayerModel.GetMiner(cfg.id);
            if (st == null) return;
            long left = st.expireAt - GameClock.Now;
            if (left < 0) left = 0;
            int h = (int)(left / 3600);
            int m = (int)(left % 3600 / 60);
            label.text = $"运行中 · 剩余 {h}小时{m:00}分";
        }

        // ---------------- 底部导航 ----------------
        private void BuildTabBar(RectTransform col)
        {
            var bar = UIFactory.HGroup(col, "TabBar", spacing: 10, padLeft: 12, padRight: 12);
            UIFactory.SetHeight(bar, 108, 108);

            AddTab(bar, "任务", () =>
            {
                var w = UIManager.Open<TaskWindow>();
                w.Refresh();
            }, out _taskDot);
            AddTab(bar, "商店", () => UIManager.Open<StoreWindow>(), out _);
            AddTab(bar, "VIP", () => UIManager.Open<VipWindow>(), out _);
            AddTab(bar, "我的", () => UIManager.Open<SettingsWindow>(), out _);
        }

        private void AddTab(RectTransform bar, string label, System.Action onClick, out Image dot)
        {
            var holder = UIFactory.Node(bar, "Tab_" + label);
            UIFactory.Flex(holder, 1);
            var btn = UIFactory.Button(holder, label, onClick, Theme.Panel, 28, Theme.TextSub);
            UIFactory.StretchFull(btn.GetComponent<RectTransform>());
            dot = UIFactory.RedDot(btn.GetComponent<RectTransform>());
        }

        private void RefreshSignBtn()
        {
            if (_signBtn == null) return;
            _signBtn.interactable = !SignInSystem.SignedToday;
            var st = _signBtn.GetComponentInChildren<Text>();
            if (st != null) st.text = SignInSystem.SignedToday ? "已签到" : "每日签到";
        }

        // ---------------- 推送刷新 ----------------
        private void OnPlayerData(PlayerDataChangedEvent e)
        {
            if (this == null || !gameObject.activeSelf) return;
            RefreshCurrency();
        }

        private void OnMinerList(MinerListChangedEvent e) => RebuildMiners();
        private void OnMailChanged(MailChangedEvent e) => RefreshDots();
        private void OnTaskChanged(TaskChangedEvent e) => RefreshDots();
        private void OnSigned(SignInDoneEvent e) => RefreshSignBtn();
        private void OnAnnPush(H2C_UpdateAnnouncementPush e) => RefreshDots();
        private void OnVipChanged(VipLevelChangedEvent e)
        {
            RefreshCurrency();
            Toast($"恭喜升级至 VIP{e.newLevel}！");
        }

        private void RefreshCurrency()
        {
            var d = PlayerModel.Data;
            if (_btcText != null) _btcText.text = PlayerModel.FmtBtc(d.btc);
            if (_goldText != null) _goldText.text = PlayerModel.FmtGold(d.gold);
            if (_hashText != null) _hashText.text = PlayerModel.FmtHash(PlayerModel.TotalHashRate());
            if (_perSecText != null)
            {
                double ps = PlayerModel.BtcPerSecond();
                _perSecText.text = ps.ToString("0.000000000") + " BTC/秒";
            }
            if (_vipText != null) _vipText.text = "VIP" + VipSystem.Level;

            // 广告矿机倒计时刷新 / 到期重建
            bool expired = false;
            foreach (var kv in _minerTimers)
            {
                var cfg = Configs.GetMiner(kv.Key);
                if (cfg == null) continue;
                var st = PlayerModel.GetMiner(kv.Key);
                if (st != null && st.expireAt <= GameClock.Now) { expired = true; break; }
                UpdateAdMinerLeft(cfg, kv.Value);
            }
            if (expired) RebuildMiners();
        }

        private void RefreshDots()
        {
            if (_mailDot != null)
            {
                bool unread = false;
                foreach (var m in PlayerModel.Data.mails)
                    if (!m.read || (!m.claimed && (m.attachGold > 0 || m.attachBtc > 0))) { unread = true; break; }
                _mailDot.gameObject.SetActive(unread);
            }
            if (_taskDot != null) _taskDot.gameObject.SetActive(TaskSystem.HasClaimable());
            if (_annDot != null) _annDot.gameObject.SetActive(!PlayerModel.Data.announcementRead);
        }

        protected override void OnClose()
        {
            Storage.Save();
        }
    }
}
