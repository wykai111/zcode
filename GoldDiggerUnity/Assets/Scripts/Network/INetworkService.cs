using System;

namespace GD
{
    /// <summary>统一网络结果（code=200 成功，对标原版 code 语义）。</summary>
    public class NetResult<T>
    {
        public bool ok;
        public int code;
        public string msg;
        public T data;

        public static NetResult<T> Success(T d) => new NetResult<T> { ok = true, code = 200, msg = "Success", data = d };
        public static NetResult<T> Fail(int c, string m) => new NetResult<T> { ok = false, code = c, msg = m };
    }

    /// <summary>
    /// 网络服务抽象：请求-响应模式。未来接真实后端时，
    /// 用 WebSocket/KCP 实现本接口替换 MockNetworkService 即可，
    /// 上层（窗口/系统）代码零改动。
    /// </summary>
    public interface INetworkService
    {
        void Send<TReq, TResp>(TReq req, Action<NetResult<TResp>> onDone)
            where TReq : class where TResp : class, new();
    }

    /// <summary>全局网络服务入口（安装时注入实现）。</summary>
    public static class Net
    {
        public static INetworkService Service;

        /// <summary>便捷请求。</summary>
        public static void Call<TReq, TResp>(TReq req, Action<NetResult<TResp>> onDone)
            where TReq : class where TResp : class, new()
        {
            if (Service == null) { onDone?.Invoke(NetResult<TResp>.Fail(-1, "网络服务未初始化")); return; }
            Service.Send(req, onDone);
        }
    }
}
