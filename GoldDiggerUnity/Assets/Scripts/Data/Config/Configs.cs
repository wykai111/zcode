using System;
using System.Collections.Generic;

namespace GD
{
    // ============================================================
    // 全部数值配置（对标原版 GameConfig/MinerConfig/VipConfig/
    // TaskConfig/SevenDayConfig/ShopConfig/WithdrawConfig 远程下发）
    // ============================================================

    /// <summary>矿机配置。adMiner=true 表示看激励视频解锁的限时矿机。</summary>
    [Serializable]
    public class MinerCfg
    {
        public int id;
        public string name;
        public long goldPrice;       // 解锁所需金币（adMiner 为 0）
        public double hashRate;      // 算力 GH/s
        public bool adMiner;         // 广告矿机
        public int durationHours;    // 广告矿机有效期（小时），普通矿机为 0=永久
    }

    /// <summary>VIP 配置：充值总额（美元）升级，提升提现限额/次数。</summary>
    [Serializable]
    public class VipCfg
    {
        public int level;
        public string name;
        public double needRechargeUsd;
        public double withdrawMaxPerDay;   // 单笔最大提现 BTC
        public int withdrawCountPerDay;    // 每日提现次数，-1=无限
        public double bonusHashPercent;    // 全局算力加成 %
    }

    /// <summary>任务配置（每日/成就）。</summary>
    [Serializable]
    public class TaskCfg
    {
        public string id;
        public int type;             // 1=每日 2=成就
        public string desc;
        public int target;
        public long rewardGold;
        public double rewardBtc;
    }

    /// <summary>7 日签到配置。</summary>
    [Serializable]
    public class SevenDayCfg
    {
        public int day;
        public long rewardGold;
        public double rewardBtc;
    }

    /// <summary>商店礼包（mock 内购）。</summary>
    [Serializable]
    public class ShopCfg
    {
        public string productId;
        public string name;
        public double priceUsd;
        public long gold;
        public bool firstGift;       // 首充双倍标记
    }

    /// <summary>全局开关配置（模拟远程 GameConfig 下发）。</summary>
    public static class GameCfg
    {
        // —— 挖矿数值 ——
        public const double BtcPerGhPerSec = 2e-10;   // 1 GH/s 每秒产出 BTC
        public const int OfflineCapHours = 8;          // 离线收益上限
        public const int AdMinerMaxLimit = 2;          // 同时生效广告矿机上限（AdMinerMaxLimit）

        // —— 提现数值 ——
        public const double WithdrawMin = 0.00001;     // 最小提现 BTC
        public const double WithdrawFee = 0.0;         // 手续费
        public const int WithdrawApproveSec = 8;       // 状态机：提交→审核
        public const int WithdrawProcessingSec = 22;   // 审核→处理
        public const int WithdrawPayoutSec = 40;       // 处理→打款成功

        // —— 广告数值 ——
        public const int RewardedAdSeconds = 5;        // 模拟激励视频时长
        public const int InterstitialSeconds = 3;      // 模拟插屏时长
        public const int AppOpenSeconds = 2;           // 模拟开屏时长
        public const int InterstitialIntervalSec = 60; // 插屏最小间隔（频控）
        public const bool InterstitialEnabled = true;

        // —— mock 网络延迟（秒）——
        public const float NetDelayMin = 0.25f;
        public const float NetDelayMax = 0.7f;
    }

    /// <summary>静态配置库。</summary>
    public static class Configs
    {
        // 8 台常驻矿机 + 2 台广告矿机（Miner1~4 对标原版 txtMinerName1~4）
        public static readonly MinerCfg[] Miners =
        {
            new MinerCfg{ id=1, name="初级矿机", goldPrice=0,      hashRate=10   },
            new MinerCfg{ id=2, name="一级矿机", goldPrice=500,    hashRate=25   },
            new MinerCfg{ id=3, name="二级矿机", goldPrice=2000,   hashRate=60   },
            new MinerCfg{ id=4, name="三级矿机", goldPrice=8000,   hashRate=140  },
            new MinerCfg{ id=5, name="四级矿机", goldPrice=30000,  hashRate=320  },
            new MinerCfg{ id=6, name="五级矿机", goldPrice=120000, hashRate=750  },
            new MinerCfg{ id=7, name="旗舰矿机", goldPrice=500000, hashRate=1800 },
            new MinerCfg{ id=8, name="超级矿机", goldPrice=2000000,hashRate=4200 },
            new MinerCfg{ id=9, name="广告矿机I",  goldPrice=0, hashRate=50,  adMiner=true, durationHours=24 },
            new MinerCfg{ id=10,name="广告矿机II", goldPrice=0, hashRate=150, adMiner=true, durationHours=24 },
        };

        public static readonly VipCfg[] Vips =
        {
            new VipCfg{ level=0, name="VIP0", needRechargeUsd=0,    withdrawMaxPerDay=0.0005, withdrawCountPerDay=1,  bonusHashPercent=0  },
            new VipCfg{ level=1, name="VIP1", needRechargeUsd=6,    withdrawMaxPerDay=0.001,  withdrawCountPerDay=2,  bonusHashPercent=5  },
            new VipCfg{ level=2, name="VIP2", needRechargeUsd=30,   withdrawMaxPerDay=0.003,  withdrawCountPerDay=3,  bonusHashPercent=10 },
            new VipCfg{ level=3, name="VIP3", needRechargeUsd=98,   withdrawMaxPerDay=0.008,  withdrawCountPerDay=5,  bonusHashPercent=15 },
            new VipCfg{ level=4, name="VIP4", needRechargeUsd=198,  withdrawMaxPerDay=0.02,   withdrawCountPerDay=10, bonusHashPercent=20 },
            new VipCfg{ level=5, name="VIP5", needRechargeUsd=500,  withdrawMaxPerDay=0.05,   withdrawCountPerDay=-1, bonusHashPercent=25 },
            new VipCfg{ level=6, name="VIP6", needRechargeUsd=1000, withdrawMaxPerDay=0.1,    withdrawCountPerDay=-1, bonusHashPercent=30 },
        };

        public static readonly TaskCfg[] Tasks =
        {
            // 每日任务
            new TaskCfg{ id="d_watch_ad",  type=1, desc="观看 3 次广告",      target=3,  rewardGold=300 },
            new TaskCfg{ id="d_mining",    type=1, desc="在线挖矿 15 分钟",   target=15, rewardGold=200 },
            new TaskCfg{ id="d_signin",    type=1, desc="完成每日签到",       target=1,  rewardGold=150 },
            new TaskCfg{ id="d_withdraw",  type=1, desc="完成 1 次提现",      target=1,  rewardGold=500 },
            // 成就任务
            new TaskCfg{ id="a_hash_100",  type=2, desc="总算力达到 100 GH/s", target=100, rewardGold=2000 },
            new TaskCfg{ id="a_wd_3",      type=2, desc="累计提现 3 次",       target=3,   rewardGold=0, rewardBtc=0.00005 },
            new TaskCfg{ id="a_ad_20",     type=2, desc="累计观看 20 次广告",  target=20,  rewardGold=3000 },
            new TaskCfg{ id="a_miner_5",   type=2, desc="解锁 5 台矿机",       target=5,   rewardGold=5000 },
        };

        public static readonly SevenDayCfg[] SevenDays =
        {
            new SevenDayCfg{ day=1, rewardGold=100  },
            new SevenDayCfg{ day=2, rewardGold=150  },
            new SevenDayCfg{ day=3, rewardGold=200  },
            new SevenDayCfg{ day=4, rewardGold=300  },
            new SevenDayCfg{ day=5, rewardGold=400  },
            new SevenDayCfg{ day=6, rewardGold=600  },
            new SevenDayCfg{ day=7, rewardGold=0, rewardBtc=0.00001 },
        };

        public static readonly ShopCfg[] Shop =
        {
            new ShopCfg{ productId="gold_small",  name="60 金币礼包",    priceUsd=0.99,  gold=3000,    firstGift=false },
            new ShopCfg{ productId="gold_mid",    name="180 金币礼包",   priceUsd=6,     gold=6000,    firstGift=true  },
            new ShopCfg{ productId="gold_big",    name="680 金币礼包",   priceUsd=30,    gold=68000,   firstGift=false },
            new ShopCfg{ productId="gold_huge",   name="1580 金币礼包",  priceUsd=98,    gold=158000,  firstGift=false },
        };

        public static readonly string[] Announcements =
        {
            "欢迎使用 Bitcoin Miner - Gold Diggers 复刻版！\n\n本工程为技术学习用途的前端复刻：所有数据均保存在本地，广告与内购均为模拟，请勿充值。",
            "提现说明\n\n1. 挖矿产出达到最小额度后可提现；\n2. 提现需填写闪电网络收款地址；\n3. 提交后由模拟服务端推送状态：已提交→审核中→处理中→打款成功。",
        };

        public static MinerCfg GetMiner(int id)
        {
            foreach (var m in Miners) if (m.id == id) return m;
            return null;
        }

        public static TaskCfg GetTask(string id)
        {
            foreach (var t in Tasks) if (t.id == id) return t;
            return null;
        }

        public static ShopCfg GetShop(string productId)
        {
            foreach (var s in Shop) if (s.productId == productId) return s;
            return null;
        }
    }
}
