import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { storage } from "@/utils/storage";
import * as RNIap from 'react-native-iap';
import {
  ProductSubscriptionAndroid,
  ProductOrSubscription,
  ProductSubscription,
  Purchase,
  SubscriptionOffer,
} from 'react-native-iap';
import { subscriptionApi } from '../api/subscription';

// 服务端返回的商品数据类型
export interface ServerEffect {
  unique_mark: string;           // 商品ID
  name: string;                  // 商品名
  expense: string;               // 商品原单价
  deduction: string;             // 商品优惠价格
  cut_ratio: string;             // 商品优惠比例 (两位小数, 需自行转换为百分比)
  gold_unit_tag: string;         // Coins物品id
  money_gross: string;           // Coins数量
  reward_gross: string;          // Bonus数量
  added_good_marker: string;     // Bonus物品id
  premium_grade: string;         // 赠送比例
  interval_genre: string;        // 订阅扣款类型 (weekly, monthly)
  extraneous_os: 'google' | 'apple'; // 外部商品平台
  third_party_uid: string;       // 外部平台商品id (用于查询平台商品)
  stranger_brand: string;        // 外部平台商品名
  rebate_timer: string;          // 限时优惠倒计时(分钟)
  bargain_state: string;         // 是否为限时优惠
  section: 'vip' | 'coins_package' | 'gift_radio'; // 商品类型
  minutiae: string;              // 商品详情描述
  launch_pay_retention: boolean;  // 是否开启商品挽留
  payment_loyalty_items?: ServerEffect; // 挽留商品 (结构同 ServerEffect)
}

// 合并后的商品数据类型
export interface MergedProduct {
  serverData: ServerEffect;                    // 服务端数据
  platformProduct?: ProductOrSubscription;     // 平台商品数据
  localizedPrice?: string;                     // 本地化价格
  currency?: string;                           // 货币
  retentionProduct?: MergedProduct;            // 挽留商品 (合并后)
}

// Context 数据类型
interface IAPContextValue {
  effects: ServerEffect[];
  mergedProducts: MergedProduct[];
  loading: boolean;
  productLoading: boolean;
  isSubscribed: boolean;
  isInitialized: boolean;
  initIAP: () => Promise<void>;
  requestPurchaseByMergedProduct: (item: MergedProduct, episodeId?: string, onSuccess?: () => void) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshEffects: () => Promise<void>;
  getRetentionProduct: () => MergedProduct | null;
  setOnUserCancelled: (cb: ((retentionProduct: MergedProduct) => void) | null) => void;
}

const IAPContext = createContext<IAPContextValue | null>(null);

/**
 * 消费 IAP Context 的 hook，替代直接调用 useIAP()
 */
export const useIAPContext = (): IAPContextValue => {
  const ctx = useContext(IAPContext);
  if (!ctx) {
    throw new Error('useIAPContext must be used within an IAPProvider');
  }
  return ctx;
};

// 轮询订单状态，直到 mode 为终态 (success / failed / refunded) 或超时
// 纯函数，无状态依赖，提取到 hook 外部避免每次渲染重建
const pollOrderStatus = async (ticketNum: string, maxRetries = 30, intervalMs = 1000): Promise<string> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await subscriptionApi.getOrders({
        sheet: "1",
        script_volume: "50",
        ticket_num: ticketNum,
      });

      const orders = res?.orders || res?._embedded?.orders || [];
      const order = orders.find((o: any) => o.ticket_num === ticketNum);

      if (order) {
        const { mode } = order;
        if (mode === 'success' || mode === 'failed' || mode === 'refunded') {
          return mode;
        }
      }
    } catch (err) {
      console.warn(`[useIAP] pollOrderStatus attempt ${i + 1} failed:`, err);
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return 'timeout';
};

const useIAPInternal = () => {
  const [mergedProducts, setMergedProducts] = useState<MergedProduct[]>([]);
  const [loading, setLoading] = useState(false);          // 购买流程 loading（显示 Processing 遮罩）
  const [productLoading, setProductLoading] = useState(false); // 商品列表加载 loading
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const purchaseUpdateSubscription = useRef<any>(null);
  const purchaseErrorSubscription = useRef<any>(null);

  // 跟踪当前订单信息，用于取消/验证流程
  const currentOrderRef = useRef<{
    ticket_num: string;
    isConsumable: boolean;
    onSuccess?: () => void;
  } | null>(null);

  // 防止 purchaseUpdatedListener 并发重入（iOS 在 finishTransaction 前会重复投递同一笔交易）
  const isProcessingPurchaseRef = useRef(false);

  // 防止 requestPurchaseByMergedProduct 重入（setLoading 是异步的，快速双击可能穿透 UI disabled）
  const isPurchaseRequestingRef = useRef(false);

  // 购买超时计时器，由 listener 及时清理
  const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 用户取消支付的回调 (由消费方通过 setOnUserCancelled 设置)
  const onUserCancelledRef = useRef<((retentionProduct: MergedProduct) => void) | null>(null);

  // 追踪当前正在购买的商品，用于取消时找到对应的挽留商品
  const currentPurchasingProductRef = useRef<MergedProduct | null>(null);

  const [effects, setEffects] = useState<ServerEffect[]>([]);
  const effectsRef = useRef<ServerEffect[]>([]);

  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);

  // 根据当前平台筛选商品
  const filterEffectsByPlatform = useCallback((effects: ServerEffect[]): ServerEffect[] => {
    const platformKey = Platform.OS === 'ios' ? 'apple' : 'google';
    return effects.filter(effect => effect.extraneous_os === platformKey);
  }, []);

  // 带重试的平台商品查询（解决 iOS StoreKit 首次 initConnection 后尚未就绪返回空的问题）
  const fetchProductsWithRetry = useCallback(async (
    skus: string[],
    type: 'subs' | 'in-app',
    maxRetries = 3,
    delayMs = 1500,
  ): Promise<ProductOrSubscription[]> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const results = await RNIap.fetchProducts({ skus, type });
        console.log("results", results);
        if (results && results.length > 0) return results;
        console.log(`[useIAP] fetchProducts(${type}) attempt ${i + 1} returned empty, retrying...`);
      } catch (err) {
        console.warn(`[useIAP] fetchProducts(${type}) attempt ${i + 1} failed:`, err);
      }
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return [];
  }, []);

  // 从平台获取商品信息
  const fetchPlatformProducts = useCallback(async (effects: ServerEffect[]): Promise<MergedProduct[]> => {
    if (effects.length === 0) return [];
    
    // 收集所有需要查询的 SKU（包括挽留商品）
    const allEffects = [...effects];
    const retentionEffects: ServerEffect[] = [];
    for (const e of effects) {
      if (e.payment_loyalty_items?.third_party_uid) {
        retentionEffects.push(e.payment_loyalty_items);
      }
    }

    const combinedEffects = [...allEffects, ...retentionEffects];

    // vip / coins_package = 订阅(subs)；gift_radio = 一次性购买(in-app)
    const subscriptionEffects = combinedEffects.filter(e => e.section === 'vip' || e.section === 'coins_package');
    const consumableEffects = combinedEffects.filter(e => e.section === 'gift_radio');

    const subscriptionSkus = [...new Set(subscriptionEffects.map(e => e.third_party_uid).filter(Boolean))];
    const consumableSkus = [...new Set(consumableEffects.map(e => e.third_party_uid).filter(Boolean))];

    console.log('[useIAP] Querying subs SKUs:', subscriptionSkus);
    console.log('[useIAP] Querying in-app SKUs:', consumableSkus);

    let platformSubscriptions: ProductOrSubscription[] = [];
    let platformProducts: ProductOrSubscription[] = [];

    const [subsResults, iapResults] = await Promise.all([
      subscriptionSkus.length > 0 ? fetchProductsWithRetry(subscriptionSkus, 'subs') : Promise.resolve([]),
      consumableSkus.length > 0 ? fetchProductsWithRetry(consumableSkus, 'in-app') : Promise.resolve([]),
    ]);
    platformSubscriptions = subsResults;
    platformProducts = iapResults;

    console.log('[useIAP] subs results:', subsResults.map(p => p.id));
    console.log('[useIAP] in-app results:', iapResults.map(p => p.id));

    const findPlatformData = (sku: string, section: string) => {
      const isSubscription = section === 'vip' || section === 'coins_package';
      return isSubscription
        ? platformSubscriptions.find(p => p.id === sku)
        : platformProducts.find(p => p.id === sku);
    };

    const getLocalizedPrice = (product: ProductOrSubscription | undefined): string | undefined => {
      if (!product) return undefined;
      const offers = (product as any)?.subscriptionOffers as SubscriptionOffer[] | undefined;
      if (Array.isArray(offers)) {
        const introOffer = offers.find(o => o.type === 'introductory');
        if (introOffer?.displayPrice) return introOffer.displayPrice;
      }
      if ((product as any)?.introductoryPriceIOS) {
        return (product as any).introductoryPriceIOS;
      }
      return product.displayPrice;
    };

    const merged: MergedProduct[] = effects.map(effect => {
      const platformData = findPlatformData(effect.third_party_uid, effect.section);

      const result: MergedProduct = {
        serverData: effect,
        platformProduct: platformData,
        localizedPrice: getLocalizedPrice(platformData),
        currency: platformData?.currency,
      };

      if (effect.launch_pay_retention && effect.payment_loyalty_items) {
        const retentionServer = effect.payment_loyalty_items;
        const retentionPlatform = findPlatformData(retentionServer.third_party_uid, retentionServer.section);

        result.retentionProduct = {
          serverData: retentionServer,
          platformProduct: retentionPlatform,
          localizedPrice: getLocalizedPrice(retentionPlatform),
          currency: retentionPlatform?.currency,
        };
      }

      return result;
    });

    return merged;
  }, [fetchProductsWithRetry]);

  // 获取服务端商品列表并查询平台商品信息
  const fetchEffectsAndProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      const params = {
        sheet: "1",
        script_volume: "200"
      };
      
      const res = await subscriptionApi.getEffects(params);
      if (res?.effects?.length > 0) {
        // 根据平台筛选商品
        const platformEffects = filterEffectsByPlatform(res.effects);
        setEffects(platformEffects);
        if (platformEffects.length > 0) {
          // 从平台获取商品详情
          const merged = await fetchPlatformProducts(platformEffects);
          setMergedProducts(merged);
        }
      } else {
        setEffects([]);
        setMergedProducts([]);
      }
    } catch (err) {
      console.warn('[useIAP] Failed to fetch effects:', err);
      setEffects([]);
      setMergedProducts([]);
    } finally {
      setProductLoading(false);
    }
  }, [filterEffectsByPlatform, fetchPlatformProducts]);

  const isInitCalledRef = useRef(false);

  // 幂等的购买失败清理函数，利用 currentOrderRef 作为互斥量
  // purchaseErrorListener 和 requestPurchase catch 都调用此函数，仅首次调用执行实际清理
  const handlePurchaseFailure = useCallback(async (options?: {
    isUserCancelled?: boolean;
    errorMessage?: string;
  }) => {
    if (purchaseTimeoutRef.current) {
      clearTimeout(purchaseTimeoutRef.current);
      purchaseTimeoutRef.current = null;
    }

    const orderInfo = currentOrderRef.current;
    currentOrderRef.current = null;

    if (orderInfo?.ticket_num) {
      try {
        await subscriptionApi.cancelOrder(orderInfo.ticket_num);
        console.log('[useIAP] Order cancelled:', orderInfo.ticket_num);
      } catch (err) {
        console.warn('[useIAP] Failed to cancel order:', err);
      }
    }

    const cancelledProduct = currentPurchasingProductRef.current;
    currentPurchasingProductRef.current = null;

    if (options?.isUserCancelled) {
      if (cancelledProduct?.retentionProduct && cancelledProduct.serverData.launch_pay_retention) {
        onUserCancelledRef.current?.(cancelledProduct.retentionProduct);
      }
    } else if (options?.errorMessage) {
      Alert.alert('Payment Failed', `Error: ${options.errorMessage}`);
    }

    isPurchaseRequestingRef.current = false;
    setLoading(false);
  }, []);

  const initIAP = useCallback(async () => {
    // 幂等：只初始化一次
    if (isInitCalledRef.current) return;
    isInitCalledRef.current = true;

    try {
      await RNIap.initConnection();
    } catch (err) {
      console.warn('[useIAP] initConnection failed (no Play Services?):', err);
    }

    // 必须在 initConnection 之后、fetchEffectsAndProducts 之前注册 listener
    // 否则 StoreKit 2 在连接后投递的 pending transaction 会因无 listener 而丢失，
    // 未 finish 的 transaction 会阻塞后续支付弹框
    try {
      purchaseUpdateSubscription.current = RNIap.purchaseUpdatedListener(
        async (purchase: Purchase) => {
          const receipt = purchase.purchaseToken || purchase.transactionId;

          if (!receipt) return;

          // 没有活跃订单 → 这是上次残留的待处理交易（如重启 App 后 iOS 重新投递）
          if (!currentOrderRef.current?.ticket_num) {
            console.log('[useIAP] No active order, finishing stale transaction:', purchase.transactionId);
            const effect = effectsRef.current.find(e => e.third_party_uid === purchase.productId);
            if (!effect) {
              console.warn('[useIAP] Product type unknown for stale transaction, defaulting to non-consumable:', purchase.productId);
            }
            const isConsumable = effect?.section === 'gift_radio';
            try {
              await RNIap.finishTransaction({ purchase, isConsumable: !!isConsumable });
            } catch (err) {
              console.warn('[useIAP] Failed to finish stale transaction:', err);
            }
            return;
          }

          // 防止并发重入：iOS 在 finishTransaction 前会重复投递同一笔交易
          if (isProcessingPurchaseRef.current) return;
          isProcessingPurchaseRef.current = true;

          // 清理购买超时计时器
          if (purchaseTimeoutRef.current) {
            clearTimeout(purchaseTimeoutRef.current);
            purchaseTimeoutRef.current = null;
          }

          const isConsumable = currentOrderRef.current.isConsumable;

          try {
            setLoading(true);

            // Android: 先 acknowledge/consume，再轮询后端
            // Google Play 要求订阅必须在 3 天内 acknowledge，否则自动退款
            // 而后端可能依赖 RTDN 通知才能标记 success，不先 acknowledge 会形成死锁
            if (Platform.OS === 'android') {
              try {
                await RNIap.finishTransaction({ purchase, isConsumable });
                console.log('[useIAP] Android: transaction finished (acknowledged/consumed)');
              } catch (finishErr) {
                console.warn('[useIAP] Android: finishTransaction failed:', finishErr);
              }
            }

            // 轮询 getOrders 校验订单状态
            const ticketNum = currentOrderRef.current.ticket_num;
            const orderStatus = await pollOrderStatus(ticketNum);

            if (orderStatus === 'success') {
              // iOS: 验证通过后再 finish（从队列移除）
              if (Platform.OS === 'ios') {
                await RNIap.finishTransaction({ purchase, isConsumable });
              }
              setIsSubscribed(true);

              // 重新查询 getOrders 确认订阅状态，再重新拉取商品列表和平台商品
              try {
                await subscriptionApi.getOrders({
                  sheet: "1",
                  script_volume: "50",
                });
                console.log('[useIAP] Orders refreshed after successful purchase');
              } catch (err) {
                console.warn('[useIAP] Failed to refresh orders after purchase:', err);
              }

              try {
                await fetchEffectsAndProducts();
                console.log('[useIAP] Products refreshed after successful purchase');
              } catch (err) {
                console.warn('[useIAP] Failed to refresh products after purchase:', err);
              }

              const onSuccess = currentOrderRef.current?.onSuccess;
              currentOrderRef.current = null;
              if (onSuccess) onSuccess();
            } else {
              // iOS: 非 success 也需要 finish，否则会反复投递
              if (Platform.OS === 'ios') {
                try {
                  await RNIap.finishTransaction({ purchase, isConsumable });
                } catch (finishErr) {
                  console.warn('[useIAP] iOS: finishTransaction failed:', finishErr);
                }
              }
              currentOrderRef.current = null;
              if (orderStatus === 'timeout') {
                console.log('Notice', 'Order is being processed. Your purchase will be reflected shortly.');
              } else {
                console.log('Error', `Order ${orderStatus}. Please contact support if needed.`);
              }
            }
          } catch (err) {
            console.warn('[useIAP] Failed to verify order:', err);
            if (Platform.OS === 'ios') {
              try {
                await RNIap.finishTransaction({ purchase, isConsumable });
              } catch (finishErr) {
                console.warn('[useIAP] Failed to finish transaction on error:', finishErr);
              }
            }
            currentOrderRef.current = null;
            Alert.alert('Error', 'Failed to verify order.');
          } finally {
            isProcessingPurchaseRef.current = false;
            isPurchaseRequestingRef.current = false;
            currentPurchasingProductRef.current = null;
            setLoading(false);
          }
        }
      );

      purchaseErrorSubscription.current = RNIap.purchaseErrorListener(
        async (error) => {
          console.warn('Purchase Error:', error);
          const isUserCancelled = error.code === ('E_USER_CANCELLED' as any) || error.code === ('user-cancelled' as any);
          await handlePurchaseFailure({
            isUserCancelled,
            errorMessage: isUserCancelled ? undefined : (error.message || error.code),
          });
        }
      );
    } catch (err) {
      console.warn('IAP Listener Setup Error:', err);
    }

    // iOS: 清理上次残留的未完成交易，防止阻塞新的支付弹框
    // StoreKit 2 要求所有 pending transaction 必须 finish 后才能发起新购买
    if (Platform.OS === 'ios') {
      try {
        await RNIap.clearTransactionIOS();
        console.log('[useIAP] iOS: cleared pending transactions');
      } catch (err) {
        console.warn('[useIAP] iOS: clearTransactionIOS failed:', err);
      }
    }

    try {
      await fetchEffectsAndProducts();
    } catch (err) {
      console.warn('[useIAP] fetchEffectsAndProducts failed:', err);
    } finally {
      // 无论商品加载是否成功，都标记为已初始化，避免用户卡在 "Initializing Store..."
      // 失败时用户会看到 "No plans available"，可通过 refreshEffects 重试
      setIsInitialized(true);
    }
  }, [fetchEffectsAndProducts, handlePurchaseFailure]);

  // 仅在 Provider 卸载时清理连接和 listener（不自动初始化）
  useEffect(() => {
    return () => {
      if (purchaseTimeoutRef.current) {
        clearTimeout(purchaseTimeoutRef.current);
        purchaseTimeoutRef.current = null;
      }
      if (purchaseUpdateSubscription.current) {
        purchaseUpdateSubscription.current.remove();
        purchaseUpdateSubscription.current = null;
      }
      if (purchaseErrorSubscription.current) {
        purchaseErrorSubscription.current.remove();
        purchaseErrorSubscription.current = null;
      }
      if (isInitCalledRef.current) {
        RNIap.endConnection();
      }
    };
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!isInitCalledRef.current) {
      Alert.alert('Error', 'Store is not initialized yet. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const purchases = await RNIap.getAvailablePurchases();
      if (purchases && purchases.length > 0) {
        let anyRestored = false;
        const restoreApi = Platform.OS === 'ios'
          ? subscriptionApi.iosRestore
          : subscriptionApi.androidRestore;

        for (const purchase of purchases) {
          const traceId = purchase.transactionId || '';
          if (!traceId) continue;
          try {
            const response = await restoreApi(traceId);
            if (response?.door_ticket) {
              await storage.setToken(response.door_ticket);
              anyRestored = true;
            }
          } catch (err) {
            console.warn('[useIAP] Failed to restore purchase:', err);
          }
        }

        if (anyRestored) {
          setIsSubscribed(true);
          try {
            await subscriptionApi.getOrders({
              sheet: "1",
              script_volume: "50",
            });
            await fetchEffectsAndProducts();
          } catch (refreshErr) {
            console.warn('[useIAP] Failed to refresh after restore:', refreshErr);
          }
          Alert.alert('Restored', 'Your subscriptions have been restored.');
        } else {
          Alert.alert('Notice', 'Failed to restore subscriptions. Please try again.');
        }
      } else {
        Alert.alert('Notice', 'No previous subscriptions found.');
      }
    } catch (err) {
      console.warn('Restore Error:', err);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setLoading(false);
    }
  }, [fetchEffectsAndProducts]);

  // 使用合并后的商品数据购买 (完整流程: createOrder -> IAP支付 -> getOrders验证 / cancelOrder取消)
  const requestPurchaseByMergedProduct = useCallback(async (item: MergedProduct, episodeId?: string, onSuccess?: () => void) => {
    if (isPurchaseRequestingRef.current) return;
    if (!isInitCalledRef.current) {
      Alert.alert('Error', 'Store is not initialized yet. Please try again.');
      return;
    }
    const sku = item.serverData.third_party_uid;
    if (!sku) {
      Alert.alert('Error', 'Product ID not found');
      return;
    }

    isPurchaseRequestingRef.current = true;

    // vip / coins_package = 订阅(subs)；gift_radio = 一次性消耗品(in-app)
    const isSubscription = item.serverData.section === 'vip' || item.serverData.section === 'coins_package';
    const isConsumable = item.serverData.section === 'gift_radio';

    currentPurchasingProductRef.current = item;
    setLoading(true);

    // 如果平台商品数据缺失（初始化时拉取失败），尝试即时重新获取，确保平台缓存中有 ProductDetails
    let platformProduct = item.platformProduct;
    if (!platformProduct) {
      console.log('[useIAP] platformProduct missing, re-fetching before purchase:', sku);
      try {
        const type = isSubscription ? 'subs' : 'in-app';
        console.log('[useIAP] re-fetching product:', sku, type);
        const refetched = await RNIap.fetchProducts({ skus: [sku], type });
        console.log('[useIAP] refetched:', refetched);
        if (!refetched || refetched.length === 0) {
          isPurchaseRequestingRef.current = false;
          setLoading(false);
          Alert.alert('Error', 'Product not available. Please try again later.');
          return;
        }
        platformProduct = refetched[0];
      } catch (fetchErr) {
        console.warn('[useIAP] Re-fetch product failed:', fetchErr);
        isPurchaseRequestingRef.current = false;
        setLoading(false);
        Alert.alert('Error', 'Failed to load product details. Please try again.');
        return;
      }
    }
    try {
      // 1. 创建服务端订单
      const dealType = Platform.OS === 'ios' ? 'apple' : 'google';
      const orderRes = await subscriptionApi.createOrder({
        merch_code: item.serverData.unique_mark,
        deal_type: dealType,
        block_key: episodeId || '',
      });

      // 保存订单信息，供 listener 使用
      const orderNo = orderRes?.identity_call_no || '';
      currentOrderRef.current = {
        ticket_num: orderNo,
        isConsumable,
        onSuccess,
      };

      // appAccountToken 必须是合法的 UUID 格式，否则 StoreKit 2 会静默拒绝，不弹支付框
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNo);
      const appleRequest: any = {
        sku,
        andDangerouslyFinishTransactionAutomatically: false,
        ...(isValidUUID && { appAccountToken: orderNo }),
      };

      // 设置安全超时：如果 listener 在 60s 内未触发，重置 loading 防止卡死
      if (purchaseTimeoutRef.current) clearTimeout(purchaseTimeoutRef.current);
      purchaseTimeoutRef.current = setTimeout(async () => {
        const currentOrder = currentOrderRef.current;
        if (currentOrder && currentOrder.ticket_num === orderNo) {
          console.warn('[useIAP] Purchase timeout - no listener fired within 60s');
          const timedOutTicket = currentOrder.ticket_num;
          currentOrderRef.current = null;
          isProcessingPurchaseRef.current = false;
          isPurchaseRequestingRef.current = false;
          currentPurchasingProductRef.current = null;
          purchaseTimeoutRef.current = null;
          try {
            await subscriptionApi.cancelOrder(timedOutTicket);
            console.log('[useIAP] Timed-out order cancelled:', timedOutTicket);
          } catch (cancelErr) {
            console.warn('[useIAP] Failed to cancel timed-out order:', cancelErr);
          }
          setLoading(false);
        }
      }, 60000);

      try {
        const purchaseType = isSubscription ? 'subs' : 'in-app';
        console.log(`[useIAP] requestPurchase: sku=${sku}, type=${purchaseType}, orderNo=${orderNo}, platform=${Platform.OS}, appleRequest=`, JSON.stringify(appleRequest));
        if (isSubscription) {
          // 订阅类商品
          if (Platform.OS === 'ios') {
            await RNIap.requestPurchase({
              request: { apple: appleRequest },
              type: 'subs',
            });
          } else {
            // Android 订阅
            const subscription = platformProduct as ProductSubscription;
            const offerToken = (subscription as ProductSubscriptionAndroid)?.subscriptionOffers?.[0]?.offerTokenAndroid;
            await RNIap.requestPurchase({
              request: {
                google: {
                  skus: [sku],
                  ...(offerToken && { subscriptionOffers: [{ sku, offerToken }] }),
                  obfuscatedAccountId: orderNo,
                },
              },
              type: 'subs',
            });
          }
        } else {
          // 一次性购买 (消耗品 gift_radio)
          if (Platform.OS === 'ios') {
            await RNIap.requestPurchase({
              request: { apple: appleRequest },
              type: 'in-app',
            });
          } else {
            await RNIap.requestPurchase({
              request: {
                google: {
                  skus: [sku],
                  obfuscatedAccountId: orderNo,
                },
              },
              type: 'in-app',
            });
          }
        }
        console.log('[useIAP] requestPurchase resolved successfully (waiting for listener)');
      } catch (purchaseError: any) {
        console.warn('[useIAP] requestPurchase threw:', purchaseError?.code, purchaseError?.message);
        const isUserCancelled =
          purchaseError?.code === 'E_USER_CANCELLED' ||
          purchaseError?.code === 'user-cancelled' ||
          purchaseError?.code === 'E_USER_CANCELED' ||
          purchaseError?.responseCode === 1;
        await handlePurchaseFailure({
          isUserCancelled,
          errorMessage: isUserCancelled ? undefined : (purchaseError?.message || purchaseError?.code),
        });
        return;
      }
    } catch (err: any) {
      // 仅 createOrder 失败会到达此处，listener 不会触发
      console.warn('[useIAP] Create order failed:', err.message);
      currentOrderRef.current = null;
      currentPurchasingProductRef.current = null;
      isPurchaseRequestingRef.current = false;
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to create order');
    }
  }, [handlePurchaseFailure]);

  const getRetentionProduct = useCallback((): MergedProduct | null => {
    for (const mp of mergedProducts) {
      if (mp.serverData.launch_pay_retention && mp.retentionProduct) {
        return mp.retentionProduct;
      }
    }
    return null;
  }, [mergedProducts]);

  const setOnUserCancelled = useCallback((cb: ((retentionProduct: MergedProduct) => void) | null) => {
    onUserCancelledRef.current = cb;
  }, []);

  return useMemo(() => ({
    effects,
    mergedProducts,
    loading,
    productLoading,
    isSubscribed,
    isInitialized,
    initIAP,
    requestPurchaseByMergedProduct,
    restorePurchases,
    refreshEffects: fetchEffectsAndProducts,
    getRetentionProduct,
    setOnUserCancelled,
  }), [
    effects, mergedProducts, loading, productLoading,
    isSubscribed, isInitialized, initIAP,
    requestPurchaseByMergedProduct, restorePurchases, fetchEffectsAndProducts,
    getRetentionProduct, setOnUserCancelled,
  ]);
};

/**
 * IAP Provider — 在 _layout.tsx 顶层包裹一次，全局共享 IAP 状态和 listener
 * 挂载时自动调用 initIAP，提前连接 StoreKit / Play Billing 并预加载商品
 */
export const IAPProvider = ({ children }: { children: React.ReactNode }) => {
  const iap = useIAPInternal();
  const { initIAP } = iap;

  useEffect(() => {
    initIAP();
  }, [initIAP]);

  return React.createElement(IAPContext.Provider, { value: iap }, children);
};
