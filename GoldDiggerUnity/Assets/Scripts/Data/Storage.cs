using UnityEngine;

namespace GD
{
    /// <summary>本地持久化：PlayerModel 序列化为 JSON 存 PlayerPrefs。</summary>
    public static class Storage
    {
        private const string Key = "gd_player_data_v1";

        public static void Load()
        {
            var json = PlayerPrefs.GetString(Key, "");
            if (!string.IsNullOrEmpty(json))
            {
                try { PlayerModel.Data = JsonUtility.FromJson<PlayerData>(json) ?? new PlayerData(); }
                catch (System.Exception e) { Debug.LogError($"[Storage] 读档失败：{e}"); PlayerModel.Data = new PlayerData(); }
            }
        }

        public static void Save()
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(PlayerModel.Data));
            PlayerPrefs.Save();
        }

        public static void Wipe()
        {
            PlayerPrefs.DeleteKey(Key);
            PlayerPrefs.Save();
            PlayerModel.Data = new PlayerData();
        }
    }
}
