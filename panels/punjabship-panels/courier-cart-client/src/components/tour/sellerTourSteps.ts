import { getVisibleOrderTypes } from '../../utils/businessTypes'

export type SellerTourStep = {
  id: string
  path?: string
  title: string
  description: string
  selector?: string
}

const pageStep = (
  id: string,
  path: string,
  title: string,
  description: string,
): SellerTourStep => ({
  id,
  path,
  title,
  description,
  selector: `[data-tour-page="${id}"]`,
})

export const buildSellerTourSteps = (businessType: unknown): SellerTourStep[] => {
  const orderTypes = getVisibleOrderTypes(businessType)
  const orderSteps: SellerTourStep[] = []

  if (orderTypes.includes('b2c')) {
    orderSteps.push(pageStep(
      'b2c-shipments',
      '/orders/b2c/list',
      'B2C shipments',
      'Use the status views, filters, tracking, labels, invoices, cloning and shipment actions for retail orders.',
    ))
  }
  if (orderTypes.includes('b2b')) {
    orderSteps.push(pageStep(
      'b2b-shipments',
      '/orders/b2b/list',
      'B2B shipments',
      'Manage business shipments and their documents, courier movement and operational status from this workspace.',
    ))
  }

  return [
    {
      id: 'welcome',
      title: 'Welcome to your PunjabShip workspace',
      description: 'This short guide will show you where the major shipping, finance and support tools live. It will not create or change any data.',
    },
    {
      id: 'navigation',
      title: 'Your workspace navigation',
      description: 'The sidebar groups daily work into shipments, exceptions, finance, audits, utilities, insights, channels and settings.',
      selector: '[data-testid="client-sidebar"]',
    },
    pageStep('overview', '/home', 'Operations overview', 'Start here for readiness, daily shipment signals, quick summaries and the items that need your attention.'),
    pageStep('dashboard', '/dashboard', 'Performance dashboard', 'Review order movement, courier performance, revenue trends and key business metrics in one place.'),
    pageStep('all-shipments', '/orders/list', 'All shipments', 'This combined table is the central view for searching, tracking and managing every shipment available to your business.'),
    ...orderSteps,
    pageStep('create-shipment', '/orders/create', 'Create a shipment', 'Enter pickup, consignee, product and package details here, then review available courier rates before booking.'),
    pageStep('ndr', '/ops/ndr', 'NDR management', 'Review failed delivery attempts, follow the shipment timeline and submit the appropriate next-delivery instruction.'),
    pageStep('rto', '/ops/rto', 'RTO management', 'Monitor return-to-origin shipments, risk and courier movement through the complete return journey.'),
    pageStep('weight-audit', '/reconciliation/weight', 'Weight audits', 'Review courier weight discrepancies, supporting measurements and their billing impact.'),
    pageStep('weight-settings', '/reconciliation/weight/settings', 'Weight rules', 'Review the package measurement and discrepancy rules used for weight reconciliation.'),
    pageStep('wallet', '/billing/wallet_transactions', 'Wallet transactions', 'Check your balance and search every credit or deduction by date, AWB and transaction category.'),
    pageStep('cod', '/cod-remittance', 'COD settlements', 'Choose your remittance cycle and review collected, pending and settled COD amounts and their history.'),
    pageStep('invoices', '/billing/invoice_management', 'Invoices', 'Find and download billing records for your account from this page.'),
    pageStep('rate-chart', '/tools/rate_card', 'Rate chart', 'Compare the rate slabs assigned to your plan for each enabled courier and service.'),
    pageStep('rate-calculator', '/tools/rate_calculator', 'Rate calculator', 'Estimate courier charges for a route and package before creating the shipment.'),
    pageStep('tracking', '/tools/order_tracking', 'Track shipments', 'Search one or multiple AWBs and follow each shipment through its courier journey.'),
    pageStep('courier-partners', '/couriers/partners', 'Courier partners', 'See the courier services available to your account and which services are currently enabled.'),
    pageStep('insights', '/reports', 'Insights overview', 'Download shipment reports and review order mix, COD, prepaid and risk insights.'),
    pageStep('channels', '/channels/connected', 'Sales channels', 'Connect and manage supported storefronts so their orders can flow into PunjabShip.'),
    pageStep('channel-options', '/channels/channel_list', 'Available integrations', 'Browse the supported sales channels before connecting the services your business uses.'),
    pageStep('settings', '/settings', 'Workspace settings', 'Manage pickup addresses, documents, users, label and invoice preferences, API access and courier priority.'),
    pageStep('support', '/support/tickets', 'Support tickets', 'Raise and follow support requests when an operational issue needs the PunjabShip team.'),
    pageStep('about', '/support/about_us', 'About PunjabShip', 'Find company and platform information from the support section.'),
    {
      id: 'complete',
      title: 'You are ready to ship',
      description: 'The guide is complete. You can replay it any time from your profile menu.',
    },
  ]
}
