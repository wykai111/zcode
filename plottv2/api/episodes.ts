import { apiClient } from "./apiClient";

export const episodeApi = {
  getForyouTheatre: (locale: string) => {
    return apiClient(`/registry/slices/places/${locale}/advocate`, {
      params: { amount_calc: 30 },
    });
  },
  getEpisodeDetail: (id: string, locale: string) => {
    return apiClient(`/slices/${id}/places/${locale}/cluster`);
  },
  getHomeLayoutTheatre: (type: string, locale: string) => {
    return apiClient(`/headline_ads/${type}/places/${locale}`);
  },
  favoredEpisode: (id: string, locale: string) => {
    return apiClient(`/registry/slices/${id}/places/${locale}/save_point`);
  },
  unfavoredEpisode: (id: string, locale: string) => {
    return apiClient(`/registry/slices/${id}/places/${locale}/delete_favorite`);
  },
  beginPlayEpisode: (id: string, index: number, locale: string) => {
    return apiClient(`/slices/${id}/places/${locale}/divisions/${index}/flow/live`);
  },
  endPlayEpisode: (id: string, index: number, locale: string) => {
    return apiClient(`/slices/${id}/places/${locale}/divisions/${index}/flow/terminated`);
  },
  getMyList: () => {
    return apiClient('/registry/appreciated');
  },
  getUseHistory: () => {
    return apiClient('/registry/seen');
  },
  deleteMyList: (params: { block_key: string | number; area: string }[]) => {
    return apiClient('/registry/slices/appreciated', {
      method: 'DELETE',
      body: params,
    });
  },
  deleteHistory: (params: { block_key: string | number; area: string }[]) => {
    return apiClient('/registry/slices/seen', {
      method: 'DELETE',
      body: params,
    });
  },
  submitFeedback: (params: { guides: string[], other_recommendations: string }) => {
    return apiClient('/registry/guides/ascend', {
      method: 'POST',
      body: params,
    });
  },
  getPayDialogProducts: () => {
    return apiClient('/effects/pay_gate', { params: { sheet: '1', script_volume: '20' } });
  },
  unlockEpisode: (block_key: string, locale: string, index: number) => {
    return apiClient(`/slices/${block_key}/places/${locale}/divisions/${index}/entry`);
  },
};
