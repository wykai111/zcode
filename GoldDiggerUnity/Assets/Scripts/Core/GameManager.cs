using System.Collections.Generic;
using UnityEngine;

namespace GD
{
    /// <summary>可被主循环驱动的对象（模拟服务端定时器、产出 tick 等）。</summary>
    public interface ITickable
    {
        void Tick(float dt);
    }

    /// <summary>
    /// 全局主循环与游戏流程状态机：
    /// Boot → Splash(开屏广告) → Login → Hall(大厅)。
    /// </summary>
    public class GameManager : MonoBehaviour, ITickable
    {
        public static GameManager Instance;

        public enum GameState { Boot, Splash, Login, Hall }

        private readonly List<ITickable> _tickables = new List<ITickable>();
        private GameState _state = GameState.Boot;

        /// <summary>当前流程状态（供 UI 判断）。</summary>
        public GameState State => _state;

        private void Update()
        {
            float dt = Time.unscaledDeltaTime;
            for (int i = 0; i < _tickables.Count; i++) _tickables[i].Tick(dt);
        }

        public void Register(ITickable t)
        {
            if (t != null && !_tickables.Contains(t)) _tickables.Add(t);
        }

        public void Unregister(ITickable t)
        {
            _tickables.Remove(t);
        }

        void ITickable.Tick(float dt) { }

        /// <summary>启动流程：显示开屏 → 登录页。</summary>
        public void StartFlow()
        {
            SetState(GameState.Splash);
            MockAdService.Instance.ShowAppOpen(() =>
            {
                UIManager.Open<SplashWindow>();
                SetState(GameState.Splash);
            });
        }

        /// <summary>登录成功，进入大厅。</summary>
        public void EnterHall()
        {
            SetState(GameState.Hall);
            UIManager.Open<HallWindow>(null, isPopup: false);
            if (!PlayerModel.Data.guideDone)
                UIManager.Open<GuideOverlay>(new GuideOverlay.Param { firstEnter = true });
        }

        public void BackToLogin()
        {
            SetState(GameState.Login);
            UIManager.Open<LoginWindow>(null, isPopup: false);
        }

        private void SetState(GameState s)
        {
            if (_state == s) return;
            _state = s;
            EventBus.Publish(new GameStateChangedEvent { state = s });
        }
    }

    public struct GameStateChangedEvent { public GameManager.GameState state; }
}
