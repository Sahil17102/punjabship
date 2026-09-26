// AppRoutes.tsx
import { lazy, Suspense, type ReactNode } from 'react'
import { Box } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import RequireAuth from '../components/auth/wrapper/RequireAuth'
import RequireMerchantReady from '../components/auth/wrapper/RequireMerchantReady'
import RequireOnboard from '../components/auth/wrapper/RequireOnboard'
import Layout from '../components/UI/Layout'
import CreateOrderWrapper from '../components/orders/CreateOrderWrapper'
import { useAuth } from '../context/auth/AuthContext'
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import { normalizeAwb } from '../utils/awb'
import { canAccessOrderType, type OrderBusinessType } from '../utils/businessTypes'
import GlobalRedirectHandler from './WalletRedirectHandler'
import { buildShopifyInstallPath, isEmbeddedShopifyContext } from '../utils/shopifyEmbedded'

/* ---------- Lazy-loaded components ---------- */
// Onboarding & Dashboard
const UserOnboarding = lazy(() => import('../pages/onboarding/UserOnboarding'))
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))
const AccountReadiness = lazy(() => import('../pages/account-readiness/AccountReadiness'))
const AdminImpersonation = lazy(() => import('../pages/auth/AdminImpersonation'))

// Orders
const Orders = lazy(() => import('../pages/orders/Orders'))
const B2COrdersList = lazy(() => import('../components/orders/b2c/B2COrdersList'))
const B2bOrders = lazy(() => import('../pages/orders/B2bOrders'))

// Settings
const Settings = lazy(() => import('../pages/settings/Settings'))
const PickupAddresses = lazy(() => import('../pages/pickup-addresses/PickupAddresses'))
const InvoicePreferences = lazy(() => import('../components/settings/InvoicePreference'))
const LabelSettingsPage = lazy(() => import('../components/settings/Label/LabelSettings'))
const UsersManagement = lazy(() => import('../pages/users-management/UsersManagement'))
const CourierPriorityPage = lazy(
  () => import('../components/settings/CourierPriority/CourierPriorityPage'),
)

// Billing
const WalletTransactions = lazy(() => import('../pages/billings/WalletTransactions'))
const Invoices = lazy(() => import('../pages/billings/Invoices'))

// Channels
const Channels = lazy(() => import('../pages/channels/Channels'))
const ChannelList = lazy(() => import('../pages/channels/ChannelList'))
const ShopifyInstallPage = lazy(() => import('../pages/shopify-install/ShopifyInstallPage'))
const ShopifyAppPolicyPage = lazy(
  () => import('../pages/shopify-install/ShopifyAppPolicyPage'),
)

// Policies
const PoliciesLayout = lazy(() => import('../pages/policy/PoliciesLayout'))
const AboutUs = lazy(() => import('../pages/policy/AboutUs'))
const CancellationPolicy = lazy(() => import('../pages/policy/CancellationPolicy'))
const CompanyDetails = lazy(() => import('../pages/policy/CompanyDetails'))
const PrivacyPolicy = lazy(() => import('../pages/policy/PrivacyPolicy'))
const TermsOfService = lazy(() => import('../pages/policy/TermsOfService'))

// Profile
const ProfileLayout = lazy(() => import('../pages/profile/Profile'))
const UserProfileSettings = lazy(() => import('../components/user/UserProfileSettings'))
const CompanyInfoForm = lazy(() => import('../components/user/profile/CompanyInfoForm'))
const BankAccountsSection = lazy(() =>
  import('../components/user/profile/bankAccounts/BankAccountsSection').then((m) => ({
    default: m.BankAccountsSection,
  })),
)
const KycSection = lazy(() => import('../components/user/profile/Kyc/KycSection'))

// Tools
const RateCard = lazy(() => import('../pages/tools/RateCard'))
const RateCalculator = lazy(() =>
  import('../pages/tools/RateCalculator').then((m) => ({ default: m.RateCalculator })),
)
const OrderTrackingForm = lazy(() => import('../pages/tools/OrderTrackingForm'))

// Support
const SupportTicketsPage = lazy(() =>
  import('../pages/support/SupportTicketsPage').then((m) => ({ default: m.SupportTicketsPage })),
)
const TicketDetailsPage = lazy(
  () => import('../pages/support/TicketDetailsPage').then((m) => ({ default: m.TicketDetailsPage })),
)

// Other
const Home = lazy(() => import('../pages/home/Home'))
const Couriers = lazy(() => import('../pages/couriers/Couriers'))
const CodRemittancesList = lazy(() => import('../pages/cod-remittance/CodRemittancesList'))
const KeyboardShortcutsPage = lazy(() => import('../pages/KeyboardShortcutsPage'))
const Reports = lazy(() => import('../pages/reports/Reports'))

// Weight Reconciliation
const WeightReconciliation = lazy(
  () => import('../pages/weight-reconciliation/WeightReconciliation'),
)
const DiscrepancyDetails = lazy(() => import('../pages/weight-reconciliation/DiscrepancyDetails'))
const WeightReconciliationSettings = lazy(
  () => import('../pages/weight-reconciliation/WeightReconciliationSettings'),
)
// Ops (NDR/RTO)
const NdrList = lazy(() => import('../pages/ops/NdrList'))
const RtoList = lazy(() => import('../pages/ops/RtoList'))
// API Integration
const ApiIntegration = lazy(() => import('../pages/settings/ApiIntegration'))

function PublicTrackingRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const { awb } = useParams<{ awb?: string }>()

  if (loading) return <Box />

  if (isAuthenticated) {
    const params = new URLSearchParams(location.search)
    const normalizedAwb = normalizeAwb(awb)

    if (normalizedAwb) {
      params.set('awb', normalizedAwb)
    }

    const query = params.toString()

    return <Navigate to={`/tools/order_tracking${query ? `?${query}` : ''}`} replace />
  }

  return <OrderTrackingForm />
}

function AppEntryRoute() {
  if (isEmbeddedShopifyContext()) {
    return <Navigate to={buildShopifyInstallPath()} replace />
  }

  return <Login />
}

function BusinessTypeGate({
  orderType,
  children,
}: {
  orderType: OrderBusinessType
  children: ReactNode
}) {
  const { user } = useAuth()

  return canAccessOrderType(user?.businessType, orderType) ? (
    children
  ) : (
    <Navigate to="/orders/list" replace />
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <GlobalRedirectHandler />
      <Suspense fallback={<Box />}>
        <Routes>
          {/* public */}
          <Route path="/" element={<AppEntryRoute />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/shopify/install" element={<ShopifyInstallPage />} />
          <Route path="/shopify/policies/:policy" element={<ShopifyAppPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/admin-impersonation" element={<AdminImpersonation />} />
          <Route path="/tracking" element={<PublicTrackingRoute />} />
          <Route path="/tracking/:awb" element={<PublicTrackingRoute />} />
          {/* onboarding */}
          <Route
            path="/onboarding-questions"
            element={
              <RequireOnboard>
                <UserOnboarding />
              </RequireOnboard>
            }
          />
          {/* private layout (requires auth) */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/manage_pickups" element={<PickupAddresses />} />
            <Route path="/billing/wallet_transactions" element={<WalletTransactions />} />
            <Route path="/billing/invoice_management" element={<Invoices />} />
            <Route path="/account-readiness" element={<AccountReadiness />} />
            <Route path="/orders" element={<Navigate to="/orders/list" replace />} />
            <Route
              path="/orders/list"
              element={
                <RequireMerchantReady>
                  <Orders />
                </RequireMerchantReady>
              }
            />
            <Route
              path="/orders/create"
              element={
                <RequireMerchantReady>
                  <CreateOrderWrapper />
                </RequireMerchantReady>
              }
            />
            <Route
              path="/orders/b2c/list"
              element={
                <RequireMerchantReady>
                  <BusinessTypeGate orderType="b2c">
                    <B2COrdersList />
                  </BusinessTypeGate>
                </RequireMerchantReady>
              }
            />
            <Route path="/support/about_us" element={<AboutUs />} />
            <Route
              path="/orders/b2b/list"
              element={
                <RequireMerchantReady>
                  <BusinessTypeGate orderType="b2b">
                    <B2bOrders />
                  </BusinessTypeGate>
                </RequireMerchantReady>
              }
            />
            <Route path="/settings/invoice_preferences" element={<InvoicePreferences />} />
            <Route path="/settings/label_config" element={<LabelSettingsPage />} />
            <Route path="/settings/users_management" element={<UsersManagement />} />
            <Route path="/settings/courier_priority" element={<CourierPriorityPage />} />
            <Route path="/settings/api-integration" element={<ApiIntegration />} />
            <Route path="/channels/connected" element={<Channels />} />
            <Route path="/channels/channel_list" element={<ChannelList />} />
            <Route path="/policies/*" element={<PoliciesLayout />}>
              <Route path="refund_cancellation" element={<CancellationPolicy />} />
              <Route path="privacy_policy" element={<PrivacyPolicy />} />
              <Route path="terms_of_service" element={<TermsOfService />} />
              <Route path="contact_us" element={<CompanyDetails />} />
            </Route>
            <Route path="/help/shortcuts" element={<KeyboardShortcutsPage />} />
            <Route path="/profile/*" element={<ProfileLayout />}>
              <Route path="user_profile/*" element={<UserProfileSettings />} />
              <Route index element={<Navigate to="user_profile" replace />} />
              <Route path="user_profile" element={<UserProfileSettings />} />
              <Route path="company" element={<CompanyInfoForm />} />
              <Route path="password" element={<UserProfileSettings />} />
              <Route path="bank_details" element={<BankAccountsSection />} />
              <Route path="kyc_details" element={<KycSection />} />
            </Route>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tools/rate_card" element={<RateCard />} />
            <Route path="/tools/rate_calculator" element={<RateCalculator />} />
            <Route path="/tools/order_tracking" element={<OrderTrackingForm />} />
            <Route path="/support/tickets" element={<SupportTicketsPage />} />
            <Route path="/support/tickets/:id" element={<TicketDetailsPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/couriers/partners" element={<Couriers />} />
            <Route path="/cod-remittance" element={<CodRemittancesList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reconciliation/weight" element={<WeightReconciliation />} />
            <Route path="/reconciliation/weight/:id" element={<DiscrepancyDetails />} />
            <Route
              path="/reconciliation/weight/settings"
              element={<WeightReconciliationSettings />}
            />
            {/* Ops */}
            <Route path="/ops/ndr" element={<NdrList />} />
            <Route path="/ops/rto" element={<RtoList />} />
          </Route>
          {/* fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
