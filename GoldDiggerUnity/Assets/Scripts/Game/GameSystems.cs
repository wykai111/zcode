using UnityEngine;

namespace GD
{
    /// <summary>
    /// 挖矿模拟：每秒按总算力产出 BTC（对标 H2C_MinerRuntimeDataPush 的实时推送），
    /// 并驱动"在线挖矿分钟"任务统计与自动存档。
    /// </summary>
    public class MiningSystem : ITickable
    {
        private static readonly MiningSystem _inst = new MiningSystem();
        private float _secAcc;          // 秒累积
        private float _saveAcc;         // 存档节流
        private float _minAcc;          // 分钟任务
        private bool _installed;

        public static void Install()
        {
            if (_inst._installed) return;
            _inst._installed = true;
            GameManager.Instance.Register(_inst);
            EventBus.Subscribe<OfflineIncomeReadyEvent>(_inst.OnOfflineIncome);
        }

        public void Tick(float dt)
        {
            if (PlayerModel.Data.loginType == 0) return;   // 未登录不产出

            double perSec = PlayerModel.BtcPerSecond();
            if (perSec <= 0) return;

            PlayerModel.Data.btc += perSec * dt;
            PlayerModel.Data.totalMinedBtc += perSec * dt;

            // 每满 1 秒推送一次（H2C_MinerRuntimeDataPush 节流模拟）
            _secAcc += dt;
            if (_secAcc >= 1f)
            {
                _secAcc = 0;
                ServerSimulator.Inst.PushPlayerData();
            }

            // 每满 1 分钟：任务统计 + 结算时间戳（离线收益基准）
            _minAcc += dt;
            if (_minAcc >= 60f)
            {
                _minAcc = 0;
                PlayerModel.Data.totalMiningSeconds += 60;
                PlayerModel.Data.lastMiningTickTime = GameClock.Now;
                EventBus.Publish(new MiningMinuteEvent { minutes = (int)(PlayerModel.Data.totalMiningSeconds / 60) });
            }

            // 每 10 秒自动存档
            _saveAcc += dt;
            if (_saveAcc >= 10f) { _saveAcc = 0; PlayerModel.Data.lastMiningTickTime = GameClock.Now; Storage.Save(); }
        }

        private void OnOfflineIncome(OfflineIncomeReadyEvent e)
        {
            // 服务端已结算：入账并弹窗展示（看广告双倍）
            PlayerModel.Data.btc += e.btc;
            PlayerModel.Data.totalMinedBtc += e.btc;
            Storage.Save();
            UIManager.Open<OfflineIncomeWindow>(new OfflineIncomeWindow.Param { seconds = e.seconds, btc = e.btc });
        }
    }

    /// <summary>VIP：由累计充值计算等级，供各处查询。</summary>
    public static class VipSystem
    {
        public static int Level
        {
            get
            {
                int lv = 0;
                foreach (var v in Configs.Vips)
                    if (PlayerModel.Data.totalRechargeUsd >= v.needRechargeUsd) lv = v.level;
                return lv;
            }
        }

        public static VipCfg CurVip => Configs.Vips[Level];

        public static VipCfg NextVip => Level + 1 < Configs.Vips.Length ? Configs.Vips[Level + 1] : null;
    }

    /// <summary>
    /// 任务系统：订阅游戏事件推进进度（对标原版任务 Progress 上报 + TaskInfoPush）。
    /// </summary>
    public static class TaskSystem
    {
        public static void Install()
        {
            EventBus.Subscribe<AdWatchedEvent>(e => Add("d_watch_ad", 1));
            EventBus.Subscribe<MiningMinuteEvent>(e => Add("d_mining", 1));
            EventBus.Subscribe<SignInDoneEvent>(e => Add("d_signin", 1));
            EventBus.Subscribe<WithdrawDoneEvent>(e => Add("d_withdraw", 1));

            EventBus.Subscribe<MinerUnlockedDoneEvent>(e =>
            {
                var st = PlayerModel.GetTask("a_miner_5");
                if (st != null && st.progress < e.totalUnlocked) Set("a_miner_5", e.totalUnlocked);
            });
            EventBus.Subscribe<WithdrawDoneEvent>(e =>
            {
                var st = PlayerModel.GetTask("a_wd_3");
                if (st != null && st.progress < PlayerModel.Data.withdrawCountTotal)
                    Set("a_wd_3", PlayerModel.Data.withdrawCountTotal);
            });
            EventBus.Subscribe<AdWatchedEvent>(e =>
            {
                var st = PlayerModel.GetTask("a_ad_20");
                if (st != null && st.progress < PlayerModel.Data.adWatchCount)
                    Set("a_ad_20", PlayerModel.Data.adWatchCount);
            });
            EventBus.Subscribe<HashRateReachedEvent>(e =>
            {
                var st = PlayerModel.GetTask("a_hash_100");
                if (st != null && st.progress < (int)e.totalHash) Set("a_hash_100", (int)e.totalHash);
            });
        }

        private static void Add(string taskId, int delta)
        {
            var st = PlayerModel.GetTask(taskId);
            var cfg = Configs.GetTask(taskId);
            if (st == null || cfg == null || st.claimed) return;
            st.progress = Mathf.Min(cfg.target, st.progress + delta);
            EventBus.Publish(new TaskChangedEvent { taskId = taskId });
        }

        private static void Set(string taskId, int value)
        {
            var st = PlayerModel.GetTask(taskId);
            var cfg = Configs.GetTask(taskId);
            if (st == null || cfg == null || st.claimed) return;
            st.progress = Mathf.Min(cfg.target, value);
            EventBus.Publish(new TaskChangedEvent { taskId = taskId });
        }

        /// <summary>是否有可领取的任务（红点）。</summary>
        public static bool HasClaimable()
        {
            foreach (var t in PlayerModel.Data.tasks)
            {
                var cfg = Configs.GetTask(t.id);
                if (cfg == null || t.claimed) continue;
                if (t.progress >= cfg.target) return true;
            }
            return false;
        }
    }

    /// <summary>签到系统（数值计算在 ServerSimulator.DoSignIn）。</summary>
    public static class SignInSystem
    {
        public static void Install() { }

        public static bool SignedToday => PlayerModel.Data.lastSignDate == GameClock.TodayKey;
        public static int CurDayIndex => PlayerModel.Data.signDayIndex % 7;   // 今天可领第几天（0-6）
    }

    /// <summary>提现辅助（校验细节在 ServerSimulator.DoWithdraw）。</summary>
    public static class WithdrawSystem
    {
        public static void Install() { }

        public static string StatusText(int status)
        {
            switch ((WithdrawStatus)status)
            {
                case WithdrawStatus.Submitted: return "已提交";
                case WithdrawStatus.Approved: return "审核通过";
                case WithdrawStatus.Processing: return "处理中";
                case WithdrawStatus.PayoutSuccess: return "打款成功";
                case WithdrawStatus.Rejected: return "已驳回";
                default: return "未知";
            }
        }

        public static Color StatusColor(int status)
        {
            switch ((WithdrawStatus)status)
            {
                case WithdrawStatus.PayoutSuccess: return Theme.Green;
                case WithdrawStatus.Rejected: return Theme.Red;
                case WithdrawStatus.Submitted: return Theme.TextSub;
                default: return Theme.Blue;
            }
        }

        /// <summary>每日剩余次数（-1=无限）。</summary>
        public static int TodayLeftCount()
        {
            var vip = VipSystem.CurVip;
            if (vip.withdrawCountPerDay < 0) return -1;
            return vip.withdrawCountPerDay - PlayerModel.TodayWithdrawCount();
        }
    }
}
