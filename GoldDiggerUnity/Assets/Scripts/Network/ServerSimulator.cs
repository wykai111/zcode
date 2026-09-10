using System;
using System.Collections.Generic;

namespace GD
{
    /// <summary>
    /// 模拟"游戏服"（Host）：处理 C2G/C2H 请求，产出 G2C/H2C 响应与推送。
    /// 数据直接读写 PlayerModel（单机模拟），推送经 EventBus 广播，
    /// 定时任务（提现状态机）由 GameManager Tick 驱动。
    /// </summary>
    public class ServerSimulator : ITickable
    {
        public static readonly ServerSimulator Inst = new ServerSimulator();

        private readonly List<KeyValuePair<long, Action>> _timers = new List<KeyValuePair<long, Action>>();
        private string _lastDailyResetDate = "";

        private ServerSimulator() { }

        public static void Install()
        {
            GameManager.Instance.Register(Inst);
        }

        public void Tick(float dt)
        {
            long now = GameClock.Now;
            for (int i = _timers.Count - 1; i >= 0; i--)
            {
                if (now >= _timers[i].Key)
                {
                    var act = _timers[i].Value;
                    _timers.RemoveAt(i);
                    act();
                }
            }
        }

        private void After(int delaySec, Action act) => _timers.Add(new KeyValuePair<long, Action>(GameClock.Now + delaySec, act));

        // ============================================================
        // 请求分发入口（MockNetworkService 调用）
        // ============================================================
        public object Handle(object req)
        {
            // —— 登录 ——
            if (req is C2G_LoginRequest login) return DoLogin(login);
            if (req is C2H_PlayerLoginRequest playerLogin) return DoPlayerLogin(playerLogin);
            if (req is C2G_RequestDeleteAccountRequest) { Storage.Wipe(); return new G2C_RequestDeleteAccountResponse { code = 200 }; }

            // —— 矿机 ——
            if (req is C2H_UnlockMinerRequest unlock) return DoUnlockMiner(unlock);

            // —— 广告 ——
            if (req is C2H_VerifyRewardedAdRequest verifyAd) return DoVerifyRewardedAd(verifyAd);
            if (req is C2H_ReportAdEventRequest) return new H2C_ReportAdEventResponse { code = 200 };

            // —— 提现 ——
            if (req is C2H_WithdrawRequest wd) return DoWithdraw(wd);
            if (req is C2H_GetWithdrawRecordsRequest) return new H2C_GetWithdrawRecordsResponse { records = PlayerModel.Data.withdrawRecords };

            // —— VIP / 商店 ——
            if (req is C2H_GetVipInfoRequest)
                return new H2C_GetVipInfoResponse { level = VipSystem.Level, totalRechargeUsd = PlayerModel.Data.totalRechargeUsd };
            if (req is C2H_BuyShopItemRequest buy) return DoBuyShopItem(buy);

            // —— 任务 ——
            if (req is C2H_GetTaskInfoRequest) return new object(); // 任务数据本地实时渲染，无需响应体
            if (req is C2H_ClaimTaskRequest claimTask) return DoClaimTask(claimTask);

            // —— 签到 ——
            if (req is C2H_SevenDaySignClaimRequest sign) return DoSignIn(sign);

            // —— 邮件 / 公告 ——
            if (req is C2H_GetMailListRequest) return new H2C_GetMailListResponse { mails = PlayerModel.Data.mails };
            if (req is C2H_ClaimMailRequest claimMail) return DoClaimMail(claimMail);
            if (req is C2H_GetAnnouncementRequest)
            {
                EventBus.Publish(new H2C_UpdateAnnouncementPush { items = new List<string>(Configs.Announcements) });
                return new object();
            }

            // —— 邀请 / 评分 ——
            if (req is C2H_BindInviteCodeRequest bind) return DoBindInvite(bind);
            if (req is C2H_SubmitRateRequest rate) { PlayerModel.Data.rated = true; Storage.Save(); return new H2C_SubmitRateResponse { code = 200 }; }

            return null;
        }

        // ============================================================
        // 登录与初始化
        // ============================================================
        private G2C_LoginResponse DoLogin(C2G_LoginRequest req)
        {
            var d = PlayerModel.Data;
            bool isNew = string.IsNullOrEmpty(d.uid);

            if (isNew)
            {
                d.uid = "gd_" + UnityEngine.Random.Range(100000, 999999);
                d.nickname = req.loginType == 2 ? "Google玩家" + UnityEngine.Random.Range(100, 999) : "游客" + UnityEngine.Random.Range(10000, 99999);
                InitNewPlayer();
            }
            d.loginType = req.loginType;
            Storage.Save();

            // 自动进入玩家登录（PlayerLogin）流程
            After(0, () =>
            {
                Net.Call(new C2H_PlayerLoginRequest { uid = d.uid }, (NetResult<H2C_PlayerLoginResponse> r) => { });
            });
            return new G2C_LoginResponse { uid = d.uid, token = "mock_token_" + d.uid, code = 200, msg = "Success" };
        }

        private void InitNewPlayer()
        {
            var d = PlayerModel.Data;
            d.gold = 500;
            d.myInviteCode = "GD" + UnityEngine.Random.Range(100000, 999999);
            d.lastMiningTickTime = GameClock.Now;

            foreach (var cfg in Configs.Miners)
            {
                d.miners.Add(new MinerState
                {
                    id = cfg.id,
                    unlocked = !cfg.adMiner && cfg.id == 1,   // 初始送第 1 台
                });
            }
            foreach (var cfg in Configs.Tasks)
            {
                d.tasks.Add(new TaskState { id = cfg.id, claimDate = "" });
            }

            AddMail("欢迎！", "欢迎体验挖矿大厅！\n系统赠送 500 金币与 1 台初级矿机，快去解锁更多矿机提升算力吧！", 500, 0);
        }

        private H2C_PlayerLoginResponse DoPlayerLogin(C2H_PlayerLoginRequest req)
        {
            var d = PlayerModel.Data;
            ResetDailyIfNeeded();

            // 推送玩家数据与入厅
            PushPlayerData();
            EventBus.Publish(new H2C_EnterHallOkPush { hallName = "MiningHall" });

            // 公告推送
            EventBus.Publish(new H2C_UpdateAnnouncementPush { items = new List<string>(Configs.Announcements) });

            // 离线收益结算（挖矿系统订阅后弹窗）
            long now = GameClock.Now;
            long elapsed = now - d.lastMiningTickTime;
            long capped = Math.Min(elapsed, GameCfg.OfflineCapHours * 3600);
            if (capped > 60 && d.loginType > 0)
            {
                double hash = PlayerModel.TotalHashRate();
                double btc = hash * GameCfg.BtcPerGhPerSec * capped;
                if (btc > 0)
                    EventBus.Publish(new OfflineIncomeReadyEvent { seconds = capped, btc = btc, hashRate = hash });
            }
            d.lastMiningTickTime = now;
            Storage.Save();
            return new H2C_PlayerLoginResponse { code = 200, msg = "Success" };
        }

        private void ResetDailyIfNeeded()
        {
            var d = PlayerModel.Data;
            string today = GameClock.TodayKey;
            if (_lastDailyResetDate == today && d.todayAdDate == today) return;

            if (d.todayAdDate != today)
            {
                d.todayAdDate = today;
                d.todayAdWatchCount = 0;
            }
            // 每日任务进度重置
            foreach (var t in d.tasks)
            {
                var cfg = Configs.GetTask(t.id);
                if (cfg != null && cfg.type == 1)
                {
                    t.progress = 0;
                    t.claimed = false;
                    t.claimDate = "";
                }
            }
            _lastDailyResetDate = today;
            Storage.Save();
        }

        public void PushPlayerData()
        {
            var d = PlayerModel.Data;
            EventBus.Publish(new PlayerDataChangedEvent
            {
                gold = d.gold,
                btc = d.btc,
                hashRate = PlayerModel.TotalHashRate(),
            });
        }

        // ============================================================
        // 矿机
        // ============================================================
        private H2C_UnlockMinerResponse DoUnlockMiner(C2H_UnlockMinerRequest req)
        {
            var cfg = Configs.GetMiner(req.minerId);
            var st = PlayerModel.GetMiner(req.minerId);
            if (cfg == null || st == null) return Error<H2C_UnlockMinerResponse>(404, "矿机不存在");
            if (cfg.adMiner) return Error<H2C_UnlockMinerResponse>(400, "广告矿机请观看广告解锁");
            if (st.unlocked) return Error<H2C_UnlockMinerResponse>(400, "矿机已解锁");
            if (PlayerModel.Data.gold < cfg.goldPrice) return Error<H2C_UnlockMinerResponse>(402, "金币不足");

            PlayerModel.Data.gold -= cfg.goldPrice;
            st.unlocked = true;
            Storage.Save();

            EventBus.Publish(new MinerListChangedEvent { minerId = cfg.id });
            PushPlayerData();

            int totalUnlocked = CountUnlockedNormal();
            EventBus.Publish(new MinerUnlockedDoneEvent { minerId = cfg.id, totalUnlocked = totalUnlocked });
            EventBus.Publish(new HashRateReachedEvent { totalHash = PlayerModel.TotalHashRate() });
            return new H2C_UnlockMinerResponse { code = 200, msg = "Success", minerId = cfg.id };
        }

        private int CountUnlockedNormal()
        {
            int n = 0;
            foreach (var m in PlayerModel.Data.miners)
                if (m.unlocked) n++;
            return n;
        }

        // ============================================================
        // 广告校验（激励视频播放完成后客户端上报）
        // ============================================================
        private H2C_VerifyRewardedAdResponse DoVerifyRewardedAd(C2H_VerifyRewardedAdRequest req)
        {
            var d = PlayerModel.Data;
            d.adWatchCount++;
            d.todayAdWatchCount++;
            d.todayAdDate = GameClock.TodayKey;
            EventBus.Publish(new AdWatchedEvent { placement = req.placement });

            // placement = "ad_miner_9" → 解锁/续期广告矿机
            if (req.placement != null && req.placement.StartsWith("ad_miner_", StringComparison.Ordinal))
            {
                int minerId = 0;
                if (int.TryParse(req.placement.Substring(9), out minerId))
                {
                    var cfg = Configs.GetMiner(minerId);
                    var st = PlayerModel.GetMiner(minerId);
                    if (cfg != null && cfg.adMiner && st != null)
                    {
                        if (PlayerModel.ActiveAdMinerCount() >= GameCfg.AdMinerMaxLimit && st.expireAt <= GameClock.Now)
                        {
                            return Error<H2C_VerifyRewardedAdResponse>(429,
                                $"同时最多 {GameCfg.AdMinerMaxLimit} 台广告矿机"); // AdMinerMaxLimit
                        }
                        long baseTime = Math.Max(st.expireAt, GameClock.Now);
                        st.expireAt = baseTime + cfg.durationHours * 3600;
                        st.watchCount++;
                        Storage.Save();
                        EventBus.Publish(new MinerListChangedEvent { minerId = minerId });
                        PushPlayerData();
                    }
                }
            }
            Storage.Save();
            return new H2C_VerifyRewardedAdResponse { code = 200, msg = "Success", placement = req.placement };
        }

        // ============================================================
        // 提现（含状态机：已提交→审核通过→处理中→打款成功）
        // ============================================================
        private H2C_WithdrawResponse DoWithdraw(C2H_WithdrawRequest req)
        {
            var d = PlayerModel.Data;
            double amount = req.amountBtc;

            if (amount < GameCfg.WithdrawMin)
                return Error<H2C_WithdrawResponse>(400, $"最小提现额度为 {PlayerModel.FmtBtc(GameCfg.WithdrawMin)} BTC");
            var vip = VipSystem.CurVip;
            if (amount > vip.withdrawMaxPerDay)
                return Error<H2C_WithdrawResponse>(403, $"当前 VIP 单笔最大提现 {PlayerModel.FmtBtc(vip.withdrawMaxPerDay)} BTC，升级 VIP 提升额度");
            if (amount > d.btc)
                return Error<H2C_WithdrawResponse>(402, "BTC 余额不足");

            if (!IsValidLightningAddress(req.address))
                return Error<H2C_WithdrawResponse>(401, "请输入有效的闪电网络收款地址");

            if (vip.withdrawCountPerDay >= 0 && PlayerModel.TodayWithdrawCount() >= vip.withdrawCountPerDay)
                return Error<H2C_WithdrawResponse>(429, $"今日提现次数已达上限（{vip.withdrawCountPerDay} 次），升级 VIP 提升次数");

            // 扣款并创建记录
            d.btc -= amount + GameCfg.WithdrawFee;
            var record = new WithdrawRecordState
            {
                recordId = ++d.withdrawRecordSeed,
                amount = amount,
                sats = (long)(amount * 1e8),
                address = req.address,
                status = (int)WithdrawStatus.Submitted,
                createTime = GameClock.Now,
            };
            d.withdrawRecords.Add(record);
            d.lastWithdrawAddress = req.address;
            d.lastWithdrawDate = GameClock.TodayKey;
            d.withdrawCountTotal++;
            Storage.Save();
            PushPlayerData();
            EventBus.Publish(new WithdrawStatusChangedEvent { recordId = record.recordId, status = WithdrawStatus.Submitted });
            EventBus.Publish(new WithdrawDoneEvent { amountBtc = amount });

            // 状态机推进（服务端定时推送）
            long rid = record.recordId;
            After(GameCfg.WithdrawApproveSec, () => SetWithdrawStatus(rid, WithdrawStatus.Approved));
            After(GameCfg.WithdrawProcessingSec, () => SetWithdrawStatus(rid, WithdrawStatus.Processing));
            After(GameCfg.WithdrawPayoutSec, () =>
            {
                SetWithdrawStatus(rid, WithdrawStatus.PayoutSuccess);
                d.totalWithdrawBtc += amount;
                Storage.Save();
                AddMail("提现到账通知", $"您的提现 {PlayerModel.FmtBtc(amount)} BTC（{record.sats} 聪）已打款至\n{MaskAddress(req.address)}", 0, 0);
            });
            return new H2C_WithdrawResponse { code = 200, msg = "Success", recordId = record.recordId };
        }

        private void SetWithdrawStatus(long recordId, WithdrawStatus status)
        {
            var r = FindRecord(recordId);
            if (r == null || r.status >= (int)WithdrawStatus.PayoutSuccess) return;
            r.status = (int)status;
            Storage.Save();
            EventBus.Publish(new WithdrawStatusChangedEvent { recordId = recordId, status = status });
        }

        private WithdrawRecordState FindRecord(long id)
        {
            foreach (var r in PlayerModel.Data.withdrawRecords) if (r.recordId == id) return r;
            return null;
        }

        /// <summary>闪电地址校验：user@domain 或 lnbc 开头的 invoice。</summary>
        public static bool IsValidLightningAddress(string addr)
        {
            if (string.IsNullOrEmpty(addr)) return false;
            addr = addr.Trim();
            int at = addr.IndexOf('@');
            if (at > 0 && at < addr.Length - 3 && addr.IndexOf('.', at) > at) return true;   // a@b.com
            if (addr.StartsWith("lnbc", StringComparison.OrdinalIgnoreCase) && addr.Length >= 20) return true;
            return false;
        }

        private static string MaskAddress(string addr)
        {
            if (string.IsNullOrEmpty(addr) || addr.Length <= 8) return addr;
            return addr.Substring(0, 4) + "****" + addr.Substring(addr.Length - 4);
        }

        // ============================================================
        // 商店（mock 内购）
        // ============================================================
        private H2C_PurchaseSuccessResponse DoBuyShopItem(C2H_BuyShopItemRequest req)
        {
            var cfg = Configs.GetShop(req.productId);
            if (cfg == null) return Error<H2C_PurchaseSuccessResponse>(404, "商品不存在");

            var d = PlayerModel.Data;
            bool firstGift = cfg.firstGift && d.totalRechargeUsd <= 0;
            long grant = cfg.gold * (firstGift ? 2 : 1);
            int oldVip = VipSystem.Level;
            d.gold += grant;
            d.totalRechargeUsd += cfg.priceUsd;
            Storage.Save();

            EventBus.Publish(new H2C_PurchaseCompletedPushFlag { gold = grant });   // 购买完成推送
            PushPlayerData();
            int newVip = VipSystem.Level;
            if (newVip > oldVip)
            {
                EventBus.Publish(new VipLevelChangedEvent { oldLevel = oldVip, newLevel = newVip });
                AddMail("VIP 升级", $"恭喜升级至 VIP{newVip}！\n提现额度提升至 {PlayerModel.FmtBtc(Configs.Vips[newVip].withdrawMaxPerDay)} BTC/笔。", 0, 0);
            }
            return new H2C_PurchaseSuccessResponse { code = 200, msg = firstGift ? "首充双倍已发放" : "Success", productId = cfg.productId };
        }

        // ============================================================
        // 任务 / 签到 / 邮件 / 邀请
        // ============================================================
        private H2C_ClaimTaskResponse DoClaimTask(C2H_ClaimTaskRequest req)
        {
            var cfg = Configs.GetTask(req.taskId);
            var st = PlayerModel.GetTask(req.taskId);
            if (cfg == null || st == null) return Error<H2C_ClaimTaskResponse>(404, "任务不存在");
            if (st.claimed) return Error<H2C_ClaimTaskResponse>(400, "奖励已领取");
            if (st.progress < cfg.target) return Error<H2C_ClaimTaskResponse>(403, "任务未完成");

            st.claimed = true;
            st.claimDate = GameClock.TodayKey;
            PlayerModel.Data.gold += cfg.rewardGold;
            PlayerModel.Data.btc += cfg.rewardBtc;
            Storage.Save();
            PushPlayerData();
            EventBus.Publish(new TaskChangedEvent { taskId = req.taskId });
            return new H2C_ClaimTaskResponse { code = 200, msg = "Success", taskId = req.taskId };
        }

        private object DoSignIn(C2H_SevenDaySignClaimRequest req)
        {
            var d = PlayerModel.Data;
            if (d.lastSignDate == GameClock.TodayKey)
                return Error<H2C_GetSevenDaySignInfoResponse>(400, "今日已签到，明天再来吧");

            var cfg = Configs.SevenDays[d.signDayIndex % 7];
            long gold = cfg.rewardGold * (req.adDouble ? 2 : 1);
            double btc = cfg.rewardBtc * (req.adDouble ? 2 : 1);
            d.lastSignDate = GameClock.TodayKey;
            d.signDayIndex++;
            if (d.signDayIndex % 7 == 0) d.signRounds++;
            d.gold += gold;
            d.btc += btc;
            Storage.Save();
            PushPlayerData();
            EventBus.Publish(new SignInDoneEvent { dayIndex = cfg.day });
            return new H2C_GetSevenDaySignInfoResponse { dayIndex = cfg.day };
        }

        private H2C_ClaimMailResponse DoClaimMail(C2H_ClaimMailRequest req)
        {
            MailState mail = null;
            foreach (var m in PlayerModel.Data.mails) if (m.id == req.mailId) { mail = m; break; }
            if (mail == null) return Error<H2C_ClaimMailResponse>(404, "邮件不存在");
            if (mail.claimed || (mail.attachGold == 0 && mail.attachBtc == 0)) return Error<H2C_ClaimMailResponse>(400, "无可领附件");

            mail.claimed = true;
            mail.read = true;
            PlayerModel.Data.gold += mail.attachGold;
            PlayerModel.Data.btc += mail.attachBtc;
            Storage.Save();
            PushPlayerData();
            return new H2C_ClaimMailResponse { code = 200, msg = "Success" };
        }

        private H2C_BindInviteCodeResponse DoBindInvite(C2H_BindInviteCodeRequest req)
        {
            var d = PlayerModel.Data;
            if (!string.IsNullOrEmpty(d.boundInviteCode)) return Error<H2C_BindInviteCodeResponse>(400, "已绑定过邀请码");
            if (string.IsNullOrEmpty(req.code) || req.code.Trim().Length < 4) return Error<H2C_BindInviteCodeResponse>(401, "邀请码无效");
            if (req.code.Trim() == d.myInviteCode) return Error<H2C_BindInviteCodeResponse>(402, "不能绑定自己的邀请码");

            d.boundInviteCode = req.code.Trim();
            d.gold += 300;              // 双方奖励 300 金币
            d.invitedCount++;           // mock：绑定即视为邀请成功
            Storage.Save();
            PushPlayerData();
            return new H2C_BindInviteCodeResponse { code = 200, msg = "绑定成功，获得 300 金币" };
        }

        // ============================================================
        // 工具
        // ============================================================
        public void AddMail(string title, string body, long gold, double btc)
        {
            var d = PlayerModel.Data;
            d.mails.Insert(0, new MailState
            {
                id = ++d.mailIdSeed,
                title = title,
                body = body,
                time = GameClock.Now,
                attachGold = gold,
                attachBtc = btc,
            });
            Storage.Save();
            EventBus.Publish(new MailChangedEvent { mailId = d.mailIdSeed, isNew = true });
        }

        private static T Error<T>(int code, string msg) where T : class, new()
        {
            var t = new T();
            var f = typeof(T).GetField("code");
            if (f != null && f.FieldType == typeof(int)) f.SetValue(t, code);
            var m = typeof(T).GetField("msg");
            if (m != null && m.FieldType == typeof(string)) m.SetValue(t, msg);
            return t;
        }
    }

    /// <summary>购买完成推送标记（等价 H2C_PurchaseCompletedPush）。</summary>
    public struct H2C_PurchaseCompletedPushFlag { public long gold; }
}
