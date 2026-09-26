export const SELLER_TOUR_START_EVENT = 'punjabship:seller-tour-start'

export const requestSellerTourReplay = () => {
  window.dispatchEvent(new CustomEvent(SELLER_TOUR_START_EVENT))
}

export const getTourPageId = (pathname: string) => {
  if (pathname === '/home') return 'overview'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname === '/orders/list') return 'all-shipments'
  if (pathname === '/orders/b2c/list') return 'b2c-shipments'
  if (pathname === '/orders/b2b/list') return 'b2b-shipments'
  if (pathname === '/orders/create') return 'create-shipment'
  if (pathname === '/ops/ndr') return 'ndr'
  if (pathname === '/ops/rto') return 'rto'
  if (pathname === '/reconciliation/weight') return 'weight-audit'
  if (pathname === '/reconciliation/weight/settings') return 'weight-settings'
  if (pathname === '/billing/wallet_transactions') return 'wallet'
  if (pathname === '/cod-remittance') return 'cod'
  if (pathname === '/billing/invoice_management') return 'invoices'
  if (pathname === '/tools/rate_card') return 'rate-chart'
  if (pathname === '/tools/rate_calculator') return 'rate-calculator'
  if (pathname === '/tools/order_tracking') return 'tracking'
  if (pathname === '/couriers/partners') return 'courier-partners'
  if (pathname === '/reports') return 'insights'
  if (pathname === '/channels/connected') return 'channels'
  if (pathname === '/channels/channel_list') return 'channel-options'
  if (pathname === '/settings') return 'settings'
  if (pathname === '/support/tickets') return 'support'
  if (pathname === '/support/about_us') return 'about'
  return 'workspace'
}
