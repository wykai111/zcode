using System.Collections.Generic;

namespace GD
{
    // ============================================================
    // 网络消息定义 —— 类名对标原版 golddigger.apk 的 protobuf 协议：
    //   C2G_*  客户端→网关（登录/健康检查）
    //   G2C_*  网关→客户端
    //   C2H_*  客户端→游戏服（Host）
    //   H2C_*  游戏服→客户端（响应与推送 Push）
    // 本工程为 Mock 实现，字段取原版语义子集。
    // ============================================================

    // ---------- 登录（C2G/G2C） ----------
    public class C2G_LoginRequest { public int loginType; public string account; public string authToken; }
    public class G2C_LoginResponse { public string uid; public string token; public int code; public string msg; }

    // ---------- 玩家登录大厅（C2H/H2C） ----------
    public class C2H_PlayerLoginRequest { public string uid; }
    public class H2C_PlayerLoginResponse { public int code; public string msg; }
    public struct H2C_PlayerDataPush { public long gold; public double btc; public double hashRate; public int vipLevel; }
    public struct H2C_EnterHallOkPush { public string hallName; }

    // ---------- 矿机 ----------
    public class C2H_UnlockMinerRequest { public int minerId; }
    public class H2C_UnlockMinerResponse { public int code; public string msg; public int minerId; }

    // ---------- 广告 ----------
    public class C2H_VerifyRewardedAdRequest { public string placement; public string adEventId; }
    public class H2C_VerifyRewardedAdResponse { public int code; public string msg; public string placement; }
    public class C2H_ReportAdEventRequest { public string type; public string placement; }
    public class H2C_ReportAdEventResponse { public int code; }

    // ---------- 提现 ----------
    public class C2H_WithdrawRequest { public double amountBtc; public string address; }
    public class H2C_WithdrawResponse { public int code; public string msg; public long recordId; }
    public class C2H_GetWithdrawRecordsRequest { public int page; }
    public class H2C_GetWithdrawRecordsResponse { public List<WithdrawRecordState> records; }

    // ---------- VIP ----------
    public class C2H_GetVipInfoRequest { }
    public class H2C_GetVipInfoResponse { public int level; public double totalRechargeUsd; }

    // ---------- 商店/内购 ----------
    public class C2H_BuyShopItemRequest { public string productId; public string orderId; }
    public class H2C_PurchaseSuccessResponse { public int code; public string msg; public string productId; }

    // ---------- 任务 ----------
    public class C2H_GetTaskInfoRequest { }
    public class C2H_ClaimTaskRequest { public string taskId; }
    public class H2C_ClaimTaskResponse { public int code; public string msg; public string taskId; }

    // ---------- 签到 ----------
    public class C2H_SevenDaySignClaimRequest { public bool adDouble; }
    public class H2C_GetSevenDaySignInfoResponse { public int dayIndex; }

    // ---------- 邮件 ----------
    public class C2H_GetMailListRequest { }
    public class H2C_GetMailListResponse { public List<MailState> mails; }
    public class C2H_ClaimMailRequest { public int mailId; }
    public class H2C_ClaimMailResponse { public int code; public string msg; }

    // ---------- 公告 ----------
    public class C2H_GetAnnouncementRequest { }
    public struct H2C_UpdateAnnouncementPush { public List<string> items; }

    // ---------- 邀请 ----------
    public class C2H_BindInviteCodeRequest { public string code; }
    public class H2C_BindInviteCodeResponse { public int code; public string msg; }

    // ---------- 评分 / 账号 ----------
    public class C2H_SubmitRateRequest { public int stars; }
    public class H2C_SubmitRateResponse { public int code; }
    public class C2G_RequestDeleteAccountRequest { }
    public class G2C_RequestDeleteAccountResponse { public int code; }

    // ============================================================
    // 服务端推送事件（经 EventBus 分发，等价 H2C_*Push）
    // ============================================================
    public struct PlayerDataChangedEvent { public long gold; public double btc; public double hashRate; }   // H2C_PlayerDataPush
    public struct MinerListChangedEvent { public int minerId; }                                             // H2C_MinerListPush
    public struct WithdrawStatusChangedEvent { public long recordId; public WithdrawStatus status; }        // H2C_WithdrawStatusChangedPush
    public struct MailChangedEvent { public int mailId; public bool isNew; }                                // H2C_MailChangedPush
    public struct TaskChangedEvent { public string taskId; }                                                // H2C_TaskInfoPush
    public struct VipLevelChangedEvent { public int oldLevel; public int newLevel; }                        // H2C_VipLevelChangedMessage
    public struct ToastEvent { public string msg; }                                                         // 通用提示
    public struct AdWatchedEvent { public string placement; }                                               // 任务统计用

    // ---------- 任务进度触发事件（TaskSystem 订阅） ----------
    public struct WithdrawDoneEvent { public double amountBtc; }                                            // 完成 1 次提现
    public struct SignInDoneEvent { public int dayIndex; }                                                  // 完成签到
    public struct MinerUnlockedDoneEvent { public int minerId; public int totalUnlocked; }                  // 解锁矿机
    public struct MiningMinuteEvent { public int minutes; }                                                 // 在线挖矿满 1 分钟
    public struct HashRateReachedEvent { public double totalHash; }                                         // 算力变化
    public struct OfflineIncomeReadyEvent { public long seconds; public double btc; public double hashRate; } // 离线收益结算
}
