using System;
using System.Collections.Generic;

namespace GD
{
    // ============================================================
    // 玩家运行时数据（单机持久化）。原版这些数据由服务端
    // H2C_PlayerDataPush / MinerRuntimeDataPush 下发，此处本地模拟。
    // ============================================================

    [Serializable]
    public class MinerState
    {
        public int id;              // 对应 MinerCfg.id
        public bool unlocked;       // 永久解锁（普通矿机）
        public long expireAt;       // 广告矿机到期时间（unix 秒），普通矿机为 0
        public int watchCount;      // 广告矿机续看次数
    }

    [Serializable]
    public class TaskState
    {
        public string id;           // 对应 TaskCfg.id
        public int progress;        // 当前进度（每日任务每日重置）
        public bool claimed;        // 是否已领奖
        public string claimDate;    // 每日任务的领奖日期（跨天重置）
    }

    [Serializable]
    public class MailState
    {
        public int id;
        public string title;
        public string body;
        public long time;
        public bool read;
        public bool claimed;
        public long attachGold;
        public double attachBtc;
    }

    public enum WithdrawStatus
    {
        Submitted = 1,      // 已提交
        Approved = 2,       // 审核通过
        Processing = 3,     // 处理中
        PayoutSuccess = 4,  // 打款成功
        Rejected = 5,       // 已驳回
    }

    [Serializable]
    public class WithdrawRecordState
    {
        public long recordId;
        public double amount;       // BTC
        public long sats;           // 聪（1 BTC = 1e8 聪）
        public string address;
        public int status;          // (int)WithdrawStatus
        public long createTime;
        public string remark;
    }

    [Serializable]
    public class PlayerData
    {
        // —— 账号 ——
        public string uid = "";
        public string nickname = "";
        public int loginType;           // 0=未登录 1=游客 2=Google
        public bool agreementAccepted;

        // —— 货币 ——
        public long gold;
        public double btc;
        public double totalMinedBtc;
        public double totalWithdrawBtc;
        public double totalRechargeUsd; // 累计充值（决定 VIP）

        // —— 矿机 ——
        public List<MinerState> miners = new List<MinerState>();

        // —— 任务 ——
        public List<TaskState> tasks = new List<TaskState>();

        // —— 签到 ——
        public string lastSignDate = "";
        public int signDayIndex;            // 第几天（0-6，7 天一轮）
        public int signRounds;              // 完成轮数

        // —— 邮件 ——
        public List<MailState> mails = new List<MailState>();
        public int mailIdSeed = 100;

        // —— 提现 ——
        public List<WithdrawRecordState> withdrawRecords = new List<WithdrawRecordState>();
        public long withdrawRecordSeed = 5000;
        public string lastWithdrawAddress = "";
        public string lastWithdrawDate = "";

        // —— 邀请 ——
        public string myInviteCode = "";
        public string boundInviteCode = "";
        public int invitedCount;

        // —— 统计 ——
        public int adWatchCount;            // 累计看广告
        public int todayAdWatchCount;
        public string todayAdDate = "";
        public long totalMiningSeconds;
        public long lastMiningTickTime;     // 上次产出结算时间（离线收益用）
        public int withdrawCountTotal;
        public bool rated;

        // —— 引导/设置 ——
        public bool guideDone;
        public bool soundOn = true;
        public bool announcementRead;
    }

    /// <summary>PlayerData 的静态访问入口 + 只读便捷计算。</summary>
    public static class PlayerModel
    {
        public static PlayerData Data = new PlayerData();

        // ---------- 矿机 ----------
        public static MinerState GetMiner(int id)
        {
            foreach (var m in Data.miners) if (m.id == id) return m;
            return null;
        }

        /// <summary>矿机是否处于运行状态（普通=已解锁，广告=未到期）。</summary>
        public static bool IsMinerActive(MinerState m)
        {
            if (m == null) return false;
            var cfg = Configs.GetMiner(m.id);
            if (cfg == null) return false;
            if (cfg.adMiner) return m.expireAt > GameClock.Now;
            return m.unlocked;
        }

        /// <summary>生效中的广告矿机数量（对标 AdMinerLimit 校验）。</summary>
        public static int ActiveAdMinerCount()
        {
            int n = 0;
            foreach (var m in Data.miners)
            {
                var cfg = Configs.GetMiner(m.id);
                if (cfg != null && cfg.adMiner && m.expireAt > GameClock.Now) n++;
            }
            return n;
        }

        /// <summary>总算力（GH/s，含 VIP 加成）。</summary>
        public static double TotalHashRate()
        {
            double hash = 0;
            foreach (var m in Data.miners)
                if (IsMinerActive(m)) hash += Configs.GetMiner(m.id).hashRate;
            var vip = VipSystem.CurVip;
            return hash * (1 + vip.bonusHashPercent / 100.0);
        }

        /// <summary>每秒 BTC 产出。</summary>
        public static double BtcPerSecond()
        {
            return TotalHashRate() * GameCfg.BtcPerGhPerSec;
        }

        // ---------- 任务 ----------
        public static TaskState GetTask(string id)
        {
            foreach (var t in Data.tasks) if (t.id == id) return t;
            return null;
        }

        /// <summary>今日已提现次数。</summary>
        public static int TodayWithdrawCount()
        {
            int n = 0;
            foreach (var r in Data.withdrawRecords)
                if (r.createTime > 0 && GameClock.Format(r.createTime).Substring(0, 5) == GameClock.Format(GameClock.Now).Substring(0, 5))
                    n++;
            return n;
        }

        /// <summary>BTC 显示（8 位小数）。</summary>
        public static string FmtBtc(double v) => v.ToString("0.00000000");
        public static string FmtGold(long v) => v.ToString("N0");
        public static string FmtHash(double v) => v >= 1000 ? (v / 1000).ToString("0.##") + " TH/s" : v.ToString("0.##") + " GH/s";
    }
}
