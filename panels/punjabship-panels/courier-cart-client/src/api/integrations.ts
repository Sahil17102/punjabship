import type { BigCommerceForm } from "../components/integrations/bigcommerce/BigCommeceIntegration";
import type { ShopifyForm } from "../components/integrations/ShopifyIntegration";
import type { WixForm } from "../components/integrations/wix/WixIntegration";
import type { WooCommerceForm } from "../components/integrations/woocommerce/WooCommerceIntegration";
import axiosInstance from "./axiosInstance";

export interface Stores {
  id: string; // store id from platform
  name: string | null;
  userId: string;
  domain: string;
  platformId: number;
  apiKey?: string;
  adminApiAccessToken?: string;
  settings?: Record<string, unknown>;
  timezone: string | null;
  country: string | null;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export const startShopifyOAuth = async (params: {
  shop: string
  clientId?: string
  clientSecret?: string
  returnTo?: string
}) => {
  const { data } = await axiosInstance.post('/integrations/shopify/oauth/start', params)
  return data
}

export const startPublicShopifyOAuth = async (params: { shop: string; returnTo?: string }) => {
  const { data } = await axiosInstance.post('/integrations/shopify/oauth/public/start', params)
  return data
}

export const exchangeShopifyBootstrap = async (params: { bootstrap: string }) => {
  const { data } = await axiosInstance.post('/integrations/shopify/oauth/bootstrap', params)
  return data
}

export const exchangeShopifySession = async (sessionToken: string) => {
  const { data } = await axiosInstance.post(
    '/integrations/shopify/oauth/session',
    {},
    { headers: { Authorization: `Bearer ${sessionToken}` } },
  )
  return data
}

export const auditShopifyInstall = async (params: { event: string; shop?: string; detail?: string }) => {
  const shop = String(params.shop || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) return

  try {
    await axiosInstance.post('/integrations/shopify/oauth/audit', { ...params, shop })
  } catch {
    // Installation must never fail because diagnostic logging is unavailable.
  }
}

export const updateShopifySettings = async (params: {
  storeId?: string
  settings: ShopifyForm['settings']
}) => {
  const { data } = await axiosInstance.put('/integrations/shopify/settings', params)
  return data;
};

export const getUserStoreIntegrations = async (): Promise<Stores[]> => {
  const res = await axiosInstance.get(`/user/integrations`);
  return res.data.data;
};

export const connectWooCommerce = async (payload: WooCommerceForm) => {
  const response = await axiosInstance.post(
    "/integrations/woocommerce-auth",
    payload
  );
  return response.data;
};

export const connectMagento = async (payload: {
  storeUrl: string;
  accessToken: string;
  userId: string;
}) => {
  const res = await axiosInstance.post("/integrations/magento-auth", payload);
  return res.data;
};

export const connectBigCommerce = async (payload: BigCommerceForm) => {
  const res = await axiosInstance.post("/bigcommerce-auth", payload);
  return res.data;
};

export const integrateWixStore = async (data: WixForm) => {
  const response = await axiosInstance.post("/integrations/wix-auth", data);
  return response.data;
};

export const syncShopifyOrders = async (payload?: { limit?: number; storeId?: string }) => {
  const response = await axiosInstance.post('/integrations/shopify/sync-orders', {
    limit: payload?.limit ?? 50,
    storeId: payload?.storeId,
  })
  return response.data
}

export const syncWooCommerceOrders = async (payload?: { limit?: number; storeId?: string }) => {
  const response = await axiosInstance.post('/integrations/woocommerce/sync-orders', {
    limit: payload?.limit ?? 50,
    storeId: payload?.storeId,
  })
  return response.data
}
