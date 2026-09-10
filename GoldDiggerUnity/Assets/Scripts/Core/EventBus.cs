using System;
using System.Collections.Generic;

namespace GD
{
    /// <summary>
    /// 轻量类型化事件总线。模拟原版 H2C_XXXPush 的服务端推送通道：
    /// ServerSimulator 通过 Publish 发推送，UI/系统通过 Subscribe 订阅。
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, List<Delegate>> _map = new Dictionary<Type, List<Delegate>>();

        public static void Subscribe<T>(Action<T> handler) where T : struct
        {
            var t = typeof(T);
            if (!_map.TryGetValue(t, out var list)) { list = new List<Delegate>(); _map[t] = list; }
            list.Add(handler);
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            if (_map.TryGetValue(typeof(T), out var list)) list.Remove(handler);
        }

        public static void Publish<T>(T evt) where T : struct
        {
            if (!_map.TryGetValue(typeof(T), out var list)) return;
            // 拷贝一份，允许回调中安全地增删订阅
            var snapshot = list.ToArray();
            foreach (var d in snapshot)
            {
                try { ((Action<T>)d)?.Invoke(evt); }
                catch (Exception e) { UnityEngine.Debug.LogError($"[EventBus] {typeof(T).Name} handler error: {e}"); }
            }
        }

        public static void Clear() => _map.Clear();
    }

    /// <summary>统一时间源（unix 秒），方便离线收益与提现计时。</summary>
    public static class GameClock
    {
        private static readonly DateTime Epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        public static long Now => (long)(DateTime.UtcNow - Epoch).TotalSeconds;

        public static string Format(long unixSec)
        {
            var t = DateTimeOffset.FromUnixTimeSeconds(unixSec).ToLocalTime();
            return t.ToString("MM-dd HH:mm");
        }

        public static string TodayKey => DateTimeOffset.FromUnixTimeSeconds(Now).ToLocalTime().ToString("yyyyMMdd");

        /// <summary>格式化时长：xx小时xx分。</summary>
        public static string FormatDuration(long seconds)
        {
            if (seconds < 0) seconds = 0;
            var h = seconds / 3600;
            var m = (seconds % 3600) / 60;
            return h > 0 ? $"{h}小时{m}分" : $"{m}分{seconds % 60}秒";
        }
    }
}
