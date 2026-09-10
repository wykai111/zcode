import { apiClient } from "./apiClient";

export const loginApi = {
  login: () => {
    return apiClient("/network_nodes");
  },
  getUserInfo: () => {
    return apiClient("/record_content");
  },
  getUserCash: () => {
    return apiClient("/registry/cash_reserve");
  },
  switchAutoUnlock: () => {
    return apiClient("/registry/cash_reserve/machine_admission_conf", { method: "PATCH" });
  },
  reportDevice: (params: any) => {
    return apiClient("/network_nodes/physical_tech", { method: "POST", body: params });
  },
  getAdjustInfo: (adjustId: string) => {
    return apiClient(`/fine_tune/${adjustId}/provenance/details_info`);
  },
  getLangSetting: () => {
    return apiClient('/app_language_settings');
  },
  getDictionary: (lang: string) => {
    return apiClient(`/glossaries/places/${lang}`);
  }
};
