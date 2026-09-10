import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'plottv_auth_token';
const CONFIG_KEY = 'plottv_user_config';
const HISTORY_KEY = 'plottv_history_list';
const MYLIST_KEY = 'plottv_my_list';
const INSTALL_MARKER_KEY = 'plottv_installed';
const USER_ID_KEY = 'plottv_user_id';
const CAUSE_CATEGORY = "plottv_cause_category";
const GLOBAL_SWITCH_KEY = "glidetv_global_switch";
const LANGUAGE_KEY = "glidetv_language";


const ALL_SECURE_KEYS = [TOKEN_KEY, CONFIG_KEY, HISTORY_KEY, MYLIST_KEY, USER_ID_KEY];

export const storage = {
  /**
   * AsyncStorage (file-based) is wiped on iOS uninstall, but Keychain (SecureStore) persists.
   * On first launch after a fresh install, clear stale Keychain entries.
   */
  async clearOnReinstall() {
    try {
      const marker = await AsyncStorage.getItem(INSTALL_MARKER_KEY);
      if (!marker) {
        await Promise.all(ALL_SECURE_KEYS.map(k => SecureStore.deleteItemAsync(k)));
        await AsyncStorage.setItem(INSTALL_MARKER_KEY, '1');
      }
    } catch (e) {
      console.error('Error in clearOnReinstall', e);
    }
  },

  async setToken(token: string) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving token', e);
    }
  },

  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Error getting token', e);
      return null;
    }
  },

  async setUserConfig(config: any) {
    try {
      await SecureStore.setItemAsync(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving user config', e);
    }
  },

  async getUserConfig() {
    try {
      const config = await SecureStore.getItemAsync(CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch (e) {
      console.error('Error getting user config', e);
      return null;
    }
  },

  async setHistory(history: any[]) {
    try {
      await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history', e);
    }
  },

  async getHistory() {
    try {
      const history = await SecureStore.getItemAsync(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('Error getting history', e);
      return [];
    }
  },

  async setMyList(list: any[]) {
    try {
      await SecureStore.setItemAsync(MYLIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving my list', e);
    }
  },

  async getMyList() {
    try {
      const list = await SecureStore.getItemAsync(MYLIST_KEY);
      return list ? JSON.parse(list) : [];
    } catch (e) {
      console.error('Error getting my list', e);
      return [];
    }
  },

  async addToMyList(item: any) {
    try {
      const list = await this.getMyList();
      const exists = list.find((i: any) => i.id === item.id);
      if (!exists) {
        list.unshift(item);
        await this.setMyList(list);
      }
    } catch (e) {
      console.error('Error adding to my list', e);
    }
  },

  async removeFromMyList(ids: (string | number)[]) {
    try {
      const list = await this.getMyList();
      const filtered = list.filter((item: any) => !ids.includes(item.id));
      await this.setMyList(filtered);
    } catch (e) {
      console.error('Error removing from my list', e);
    }
  },

  async setUserId(uid: string) {
    try {
      await SecureStore.setItemAsync(USER_ID_KEY, uid);
    } catch (e) {
      console.error('Error saving user id', e);
    }
  },

  async getUserId() {
    try {
      return await SecureStore.getItemAsync(USER_ID_KEY);
    } catch (e) {
      console.error('Error getting user id', e);
      return null;
    }
  },

  async clear() {
    try {
      await Promise.all(ALL_SECURE_KEYS.map(k => SecureStore.deleteItemAsync(k)));
      await AsyncStorage.removeItem(INSTALL_MARKER_KEY);
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },

  async setCauseCategory(category: boolean) {
    try {
      await AsyncStorage.setItem(CAUSE_CATEGORY, category ? '1' : '0');
    } catch (e) {
      console.error('Error saving cause category', e);
    }
  },
  
  async getCauseCategory() {
    try {
      const category = await AsyncStorage.getItem(CAUSE_CATEGORY);
      return category ? category === '1' : false;
    } catch (e) {
      console.error('Error getting cause category', e);
      return false;
    }
  },
  async setGlobalSwitch(switchObj: object) {
    try {
      if (switchObj === null || switchObj === undefined) {
        await AsyncStorage.removeItem(GLOBAL_SWITCH_KEY);
      } else {
        await AsyncStorage.setItem(GLOBAL_SWITCH_KEY, JSON.stringify(switchObj));
      }
    } catch (e) {
      console.error('Error saving global switch', e);
    }
  },

  async getGlobalSwitch() {
    try {
      const switchObj = await AsyncStorage.getItem(GLOBAL_SWITCH_KEY);
      return switchObj ? JSON.parse(switchObj) : null;
    } catch (e) {
      console.error('Error getting global switch', e);
      return null;
    }
  },

  async setLanguage(lang: string) {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      DeviceEventEmitter.emit('LANGUAGE_CHANGED_EVENT', lang);
    } catch (e) {
      console.error('Error saving language', e);
    }
  },

  async getLanguage() {
    try {
      return await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (e) {
      console.error('Error getting language', e);
      return null;
    }
  },

  async setDictionary(dict: Record<string, string>) {
    try {
      await AsyncStorage.setItem('glidetv_dictionary', JSON.stringify(dict));
      DeviceEventEmitter.emit('DICTIONARY_UPDATE_EVENT', dict);
    } catch (e) {
      console.error('Error saving dictionary', e);
    }
  },

  async getDictionary() {
    try {
      const dict = await AsyncStorage.getItem('glidetv_dictionary');
      return dict ? JSON.parse(dict) : null;
    } catch (e) {
      console.error('Error getting dictionary', e);
      return null;
    }
  }
};
