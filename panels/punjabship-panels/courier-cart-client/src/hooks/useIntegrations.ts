import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  connectBigCommerce,
  connectMagento,
  connectWooCommerce,
  startShopifyOAuth,
  syncShopifyOrders,
  syncWooCommerceOrders,
  integrateWixStore,
  updateShopifySettings,
} from "../api/integrations";
import type { ShopifyForm } from "../components/integrations/ShopifyIntegration";
import type { WooCommerceForm } from "../components/integrations/woocommerce/WooCommerceIntegration";
import type { WixForm } from "../components/integrations/wix/WixIntegration";

export const useStartShopifyOAuth = () => {
  return useMutation({
    mutationFn: (params: { shop: string; clientId?: string; clientSecret?: string; returnTo?: string }) =>
      startShopifyOAuth(params),
  });
};

export const useUpdateShopifySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { storeId?: string; settings: ShopifyForm["settings"] }) =>
      updateShopifySettings(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};

export const useIntegrateWooCommerce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WooCommerceForm) => connectWooCommerce(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};

export const useIntegrateMagento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectMagento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
    },
  });
};
export const useIntegrateBigCommerce = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectBigCommerce,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
    },
  });
};

export const useIntegrateWix = () => {
  return useMutation({
    mutationFn: (payload: WixForm) => integrateWixStore(payload),
  });
};

export const useSyncShopifyOrders = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload?: { limit?: number; storeId?: string }) => syncShopifyOrders(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
    },
  })
}

export const useSyncWooCommerceOrders = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload?: { limit?: number; storeId?: string }) => syncWooCommerceOrders(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
    },
  })
}
