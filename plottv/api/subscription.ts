import { apiClient } from "./apiClient";

export interface CreateOrderParams {
  merch_code: string;
  deal_type: 'apple' | 'google';
  block_key: string;
}

export interface RestoreResponse {
  door_ticket?: string;
}

export const subscriptionApi = {
  getEffects: (params: Record<string, string>) => {
    return apiClient("/tier_2/effects", { params });
  },

  createOrder: (params: CreateOrderParams) => {
    return apiClient("/tier_2/registry/orders/compose", {
      method: "POST",
      body: params,
    });
  },
  cancelOrder: (ticket_num: string) => {
    return apiClient(`/tier_2/registry/orders/${ticket_num}/void`, {
      method: "PATCH"
    });
  },
  getOrders: (params: Record<string, string>) => {
    return apiClient("/tier_2/registry/orders", { params });
  },
  iosRestore: (trace_id: string): Promise<RestoreResponse> => {
    return apiClient(`/itunes/registry/restitution/${trace_id}`, {
      method: "POST"
    });
  },
  androidRestore: (trace_id: string): Promise<RestoreResponse> => {
    return apiClient(`/mountainview/registry/restitution/${trace_id}`, {
      method: "POST"
    });
  },
  getTransactionRecord: (params?: Record<string, any>) => {
    return apiClient("/registry/cash_reserve/presented_data", { params });
  },
  getConsumptionRecord: (params?: Record<string, any>) => {
    return apiClient("/registry/cash_reserve/admission_data", { params });
  },
};