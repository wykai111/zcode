using System;

namespace GD
{
    /// <summary>广告位类型（对标原版 RewardedAd placement / Interstitial / AppOpen）。</summary>
    public interface IAdService
    {
        /// <summary>激励视频：看完完整回调 true，中途关闭回调 false。</summary>
        void ShowRewarded(string placement, Action<bool> onDone);

        /// <summary>插屏（按频控自动弹）。</summary>
        void ShowInterstitial(string placement);

        /// <summary>开屏。</summary>
        void ShowAppOpen(Action onDone);
    }
}
