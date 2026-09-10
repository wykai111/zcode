using System;
using UnityEngine;

namespace GD
{
    /// <summary>
    /// Mock 网络实现：将请求延迟路由到 ServerSimulator，
    /// 模拟 0.25~0.7s 网络延迟。code=200 视为成功。
    /// </summary>
    public class MockNetworkService : INetworkService
    {
        public static MockNetworkService Instance = new MockNetworkService();

        public static void Install()
        {
            Net.Service = Instance;
            ServerSimulator.Install();
        }

        public void Send<TReq, TResp>(TReq req, Action<NetResult<TResp>> onDone)
            where TReq : class where TResp : class, new()
        {
            float delay = UnityEngine.Random.Range(GameCfg.NetDelayMin, GameCfg.NetDelayMax);
            GameManager.Instance.StartCoroutine(DelayedHandle(delay, req, onDone));
        }

        private System.Collections.IEnumerator DelayedHandle<TReq, TResp>(
            float delay, TReq req, Action<NetResult<TResp>> onDone)
            where TReq : class where TResp : class, new()
        {
            yield return new WaitForSeconds(delay);

            object resp;
            try { resp = ServerSimulator.Inst.Handle(req); }
            catch (Exception e)
            {
                Debug.LogError($"[MockNet] 处理 {typeof(TReq).Name} 异常：{e}");
                onDone?.Invoke(NetResult<TResp>.Fail(-2, "服务器开小差了"));
                yield break;
            }

            if (resp is TResp typed)
            {
                int code = ReadCode(resp);
                if (code == 200) onDone?.Invoke(NetResult<TResp>.Success(typed));
                else onDone?.Invoke(NetResult<TResp>.Fail(code, ReadMsg(resp)));
            }
            else
            {
                // 无响应体（纯推送类请求）
                onDone?.Invoke(NetResult<TResp>.Success(new TResp()));
            }
        }

        private static int ReadCode(object o)
        {
            var f = o.GetType().GetField("code");
            return f != null && f.FieldType == typeof(int) ? (int)f.GetValue(o) : 200;
        }

        private static string ReadMsg(object o)
        {
            var f = o.GetType().GetField("msg");
            return f != null && f.FieldType == typeof(string) ? (string)f.GetValue(o) : "Error";
        }
    }
}
