import {
  IconAdjustments,
  IconAlertTriangle,
  IconArrowBackUp,
  IconBell,
  IconChartBar,
  IconClipboardList,
  IconCoinRupee,
  IconDashboard,
  IconHelpCircle,
  IconInfoCircle,
  IconKey,
  IconLogin2,
  IconMapPin,
  IconNews,
  IconNetwork,
  IconPackageExport,
  IconReportMoney,
  IconSettings,
  IconStar,
  IconTools,
  IconTrack,
  IconTruck,
  IconUser,
} from '@tabler/icons-react'
import { FaMoneyBill } from 'react-icons/fa'
import { MdAccountBalanceWallet } from 'react-icons/md'
import { RiScales3Line } from 'react-icons/ri'

// Components
import { lazy, Suspense } from 'react'
import { BsCreditCard2Back } from 'react-icons/bs'
import { CiCalculator1 } from 'react-icons/ci'
import { IoLocation } from 'react-icons/io5'
import { MdGavel } from 'react-icons/md'
import { AdminRoute } from 'views/Auth/AdminRoute'
import SignIn from 'views/Auth/SignIn'
import AdminBillingInvoices from 'views/Billing/AdminBillingInvoices'
import AdminBillingPreferences from 'views/Billing/AdminBillingPreferences'
import AdminCodRemittancePage from 'views/CodRemittance/AdminCodRemittancePage'
import Couriers from 'views/Couriers/Couriers'
import ManualCouriers from 'views/Couriers/ManualCouriers'
import CourierCredentials from 'views/Couriers/CourierCredentials'
import ServiceProviders from 'views/Couriers/ServiceProviders'
import Dashboard from 'views/Dashboard/Dashboard'
import DeveloperLogs from 'views/Developer/DeveloperLogs'
import ApiIntegration from 'views/Integrations/ApiIntegration'
import AdminNdr from 'views/Ops/AdminNdr'
import AdminRto from 'views/Ops/AdminRto'
import ManualCourierOperations from 'views/Ops/ManualCourierOperations'
import AdminNotificationsPage from 'views/Notifications/AdminNotificationsPage'
import AssistedBooking from 'views/Orders/AssistedBooking'
import Orders from 'views/Orders/Orders'
import PlanManagement from 'views/PlanManagement/PlanManagement'
import ServiceabilityPage from 'views/Serviceability/ServiceabilityPage'
import PaymentOptionsSettings from 'views/Settings/PaymentOptionsSettings'
import AdminChangePassword from 'views/Settings/AdminChangePassword'
import AboutUsEditor from 'views/Support/AboutUsEditor'
import AdminTicketDashboard from 'views/Support/AdminTicketsDashboard'
import OrderTrackingPage from 'views/Tools/OrderTrackingPage'
import RateCalculatorPage from 'views/Tools/RateCalculatorPage'
import UserDetails from 'views/UsersManagement/UserDetails'
import UsersManagementPage from 'views/UsersManagement/UsersManagementPage'
import AdminWallets from 'views/Wallets/AdminWallets'
import AdminDisputeManagement from 'views/WeightReconciliation/AdminDisputeManagement'
import AdminWeightReconciliationDashboard from 'views/WeightReconciliation/AdminWeightReconciliationDashboard'
import ZoneMappingsPage from 'views/Zones/ZoneMappingsPage'
import EmployeeManagementWorkspace from 'views/EmployeeManagement/EmployeeManagementWorkspace'
import Blogs from 'views/Blogs/Blogs'
import CreateBlog from 'components/Blogs/CreateBlog'

// Lazy load pricing management pages
const B2BPricingManagement = lazy(() => import('views/Pricing/B2BPricingManagement'))
const B2CPricingManagement = lazy(() => import('views/Pricing/B2CPricingManagement'))
const HolidayManagement = lazy(() => import('views/B2B/HolidayManagement'))

// ------------------ ROUTES ------------------

const dashRoutes = [
  // ========== DASHBOARD ==========
  // Dashboard (home page)
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: <IconDashboard size={20} />,
    component: () => (
      <AdminRoute>
        <Dashboard />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  // ========== CORE OPERATIONS ==========
  {
    category: true,
    name: 'Orders',
    state: 'ordersCollapse',
    icon: <IconPackageExport />,
    layout: '/admin',
    views: [
      {
        path: '/orders',
        name: 'All Orders',
        icon: <IconPackageExport />,
        exact: true,
        component: () => (
          <AdminRoute>
            <Orders />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/orders/assisted-booking',
        name: 'Assisted Booking',
        icon: <IconClipboardList />,
        component: () => (
          <AdminRoute>
            <AssistedBooking />
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // Operations (NDR, RTO)
  {
    category: true,
    name: 'Operations',
    state: 'opsCollapse',
    icon: <IconSettings size={20} />,
    layout: '/admin',
    views: [
      {
        path: '/ops/ndr',
        name: 'NDR',
        icon: <IconAlertTriangle />,
        component: () => (
          <AdminRoute>
            <AdminNdr />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/ops/rto',
        name: 'RTO',
        icon: <IconArrowBackUp />,
        component: () => (
          <AdminRoute>
            <AdminRto />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      // Pickups UI removed; cancellation is available from Orders or API
    ],
  },

  // Manual courier setup and fulfilment are kept together, but on separate pages.
  {
    category: true,
    name: 'Manual Courier',
    state: 'manualCourierCollapse',
    icon: <IconTruck size={20} />,
    layout: '/admin',
    views: [
      {
        path: '/manual-courier/setup',
        name: 'Courier Setup',
        icon: <IconAdjustments />,
        component: () => (
          <AdminRoute>
            <ManualCouriers />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/manual-courier/shipments',
        name: 'Shipment Operations',
        icon: <IconPackageExport />,
        component: () => (
          <AdminRoute>
            <ManualCourierOperations />
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // ========== EMPLOYEE MANAGEMENT ==========
  {
    category: true,
    name: 'Employee Management',
    state: 'employeeManagementCollapse',
    icon: <IconUser size={20} />,
    layout: '/admin',
    views: [
      {
        path: '/employee-management/employees',
        name: 'Employees & Sellers',
        icon: <IconUser />,
        permission: 'employees',
        component: () => <AdminRoute><EmployeeManagementWorkspace mode="employees" /></AdminRoute>,
        layout: '/admin',
      },
      {
        path: '/employee-management/roles',
        name: 'Roles & Permissions',
        icon: <IconKey />,
        permission: 'employees',
        component: () => <AdminRoute><EmployeeManagementWorkspace mode="roles" /></AdminRoute>,
        layout: '/admin',
      },
    ],
  },

  // ========== USER & BUSINESS MANAGEMENT ==========
  // Users Management
  {
    path: '/users-management/:id',
    name: 'User Details',
    component: () => (
      <AdminRoute>
        <UserDetails />
      </AdminRoute>
    ),
    layout: '/admin',
    show: false,
  },
  {
    path: '/users-management',
    name: 'Users Management',
    icon: <IconUser size={20} />,
    component: () => (
      <AdminRoute>
        <UsersManagementPage />
      </AdminRoute>
    ),
    layout: '/admin',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    icon: <IconBell size={20} />,
    component: () => (
      <AdminRoute>
        <AdminNotificationsPage />
      </AdminRoute>
    ),
    layout: '/admin',
    show: false,
  },

  // Plan Management
  {
    path: '/plans',
    name: 'Plan Management',
    icon: <IconStar size={19} />,
    component: () => (
      <AdminRoute>
        <PlanManagement />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  // ========== SHIPPING & LOGISTICS ==========
  // Shipping Management (Couriers + Rate Card + Serviceability + Zones)
  {
    category: true,
    name: 'Shipping Management',
    state: 'shippingCollapse',
    icon: <IconTruck size={21} />,
    views: [
      {
        path: '/couriers',
        name: 'Couriers',
        icon: <IconTruck />,
        component: () => (
          <AdminRoute>
            <Couriers />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/courier-credentials',
        name: 'Courier Credentials',
        icon: <IconKey />,
        component: () => (
          <AdminRoute>
            <CourierCredentials />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/service-providers',
        name: 'Service Providers',
        icon: <IconTruck />,
        component: () => (
          <AdminRoute>
            <ServiceProviders />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/zones-mappings/:zoneId',
        name: 'Zone Mappings',
        component: () => (
          <AdminRoute>
            <ZoneMappingsPage />
          </AdminRoute>
        ),
        layout: '/admin',
        show: false,
      },
      {
        path: '/serviceability',
        name: 'Serviceability',
        icon: <IoLocation />,
        component: () => (
          <AdminRoute>
            <ServiceabilityPage />
          </AdminRoute>
        ),
        layout: '/admin',
      },

      {
        path: '/pricing/b2b',
        name: 'B2B',
        icon: <BsCreditCard2Back />,
        component: () => (
          <AdminRoute>
            <Suspense fallback={<div>Loading B2B...</div>}>
              <B2BPricingManagement />
            </Suspense>
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/pricing/b2c',
        name: 'B2C',
        icon: <BsCreditCard2Back />,
        component: () => (
          <AdminRoute>
            <Suspense fallback={<div>Loading B2C...</div>}>
              <B2CPricingManagement />
            </Suspense>
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // ========== FINANCIAL ==========
  // Billing (Invoices, COD Remittance, Wallet)
  {
    category: true,
    path: '/billing',
    name: 'Billing',
    state: 'billingCollapse',
    icon: <FaMoneyBill />,
    layout: '/admin',
    views: [
      {
        path: '/billing-invoices',
        name: 'Invoices',
        icon: <MdAccountBalanceWallet />,
        component: () => (
          <AdminRoute>
            <AdminBillingInvoices />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/billing-preferences',
        name: 'Billing Preferences',
        icon: <IconAdjustments />,
        component: () => (
          <AdminRoute>
            <AdminBillingPreferences />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/cod-remittance',
        name: 'COD Remittance',
        icon: <MdAccountBalanceWallet />,
        component: () => (
          <AdminRoute>
            <AdminCodRemittancePage />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/wallet',
        name: 'Wallet',
        icon: <IconCoinRupee />,
        component: () => (
          <AdminRoute>
            <AdminWallets />
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // Reconciliation (Weight Discrepancies, Disputes)
  {
    category: true,
    name: 'Reconciliation',
    state: 'reconciliationCollapse',
    icon: <RiScales3Line size={20} />,
    layout: '/admin',
    views: [
      {
        path: '/weight-reconciliation',
        name: 'Weight Discrepancies',
        icon: <RiScales3Line />,
        component: () => (
          <AdminRoute>
            <AdminWeightReconciliationDashboard />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/dispute-management',
        name: 'Dispute Management',
        icon: <MdGavel />,
        component: () => (
          <AdminRoute>
            <AdminDisputeManagement />
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // ========== TOOLS & UTILITIES ==========
  // Tools (Rate Calculator, Order Tracking)
  {
    category: true,
    path: '/tools',
    name: 'Tools',
    state: 'toolsCollapse',
    icon: <IconTools size={20} />,
    layout: '/admin',
    views: [
      {
        path: '/rate-calculator',
        name: 'Rate Calculator',
        icon: <CiCalculator1 />,
        component: () => (
          <AdminRoute>
            <RateCalculatorPage />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/order-tracking',
        name: 'Order Tracking',
        icon: <IconTrack />,
        component: () => (
          <AdminRoute>
            <OrderTrackingPage />
          </AdminRoute>
        ),
        layout: '/admin',
      },
      {
        path: '/api-integration',
        name: 'API Integration',
        icon: <IconKey size={20} />,
        component: () => (
          <AdminRoute>
            <ApiIntegration />
          </AdminRoute>
        ),
        layout: '/admin',
      },
    ],
  },

  // ========== CONTENT & SUPPORT ==========
  {
    category: true,
    name: 'Marketing',
    state: 'marketingCollapse',
    icon: <IconNews size={20} />,
    views: [
      {
        path: '/blogs', name: 'All Blogs', icon: <IconNews size={19} />,
        component: () => <AdminRoute><Blogs /></AdminRoute>, layout: '/admin', exact: true,
      },
      {
        path: '/blogs/new', name: 'Create Blog', icon: <IconNews size={19} />,
        component: () => <AdminRoute><CreateBlog /></AdminRoute>, layout: '/admin', exact: true,
      },
      {
        path: '/blogs/:id/edit', name: 'Edit Blog',
        component: () => <AdminRoute><CreateBlog /></AdminRoute>, layout: '/admin', show: false,
      },
    ],
  },

  // Support
  // Place the more specific route first so it doesn't get shadowed by `/support`
  {
    path: '/about-us',
    name: 'About Us Page',
    icon: <IconInfoCircle />,
    component: () => (
      <AdminRoute>
        <AboutUsEditor />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  {
    path: '/support',
    name: 'Support',
    icon: <IconHelpCircle />,
    component: () => (
      <AdminRoute>
        <AdminTicketDashboard />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  // ========== SETTINGS ==========
  {
    path: '/settings/payment-options',
    name: 'Payment Options',
    icon: <IconSettings />,
    component: () => (
      <AdminRoute>
        <PaymentOptionsSettings />
      </AdminRoute>
    ),
    layout: '/admin',
  },
  {
    path: '/settings/change-password',
    name: 'Change Password',
    icon: <IconKey />,
    component: () => (
      <AdminRoute>
        <AdminChangePassword />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  {
    path: '/developer',
    name: 'Developer',
    icon: <IconTools size={20} />,
    component: () => (
      <AdminRoute>
        <DeveloperLogs />
      </AdminRoute>
    ),
    layout: '/admin',
  },

  // Backward-compatible URLs for previously shared admin links.
  {
    path: '/ops/manual-couriers',
    name: 'Manual Courier Operations',
    component: () => (
      <AdminRoute>
        <ManualCourierOperations />
      </AdminRoute>
    ),
    layout: '/admin',
    show: false,
  },
  {
    path: '/manual-couriers',
    name: 'Manual Couriers',
    component: () => (
      <AdminRoute>
        <ManualCouriers />
      </AdminRoute>
    ),
    layout: '/admin',
    show: false,
  },

  // ========== AUTH ==========
  // Auth (hidden from sidebar)
  {
    path: '/signin',
    name: 'Sign In',
    icon: <IconLogin2 />,
    component: SignIn,
    layout: '/auth',
    show: false,
  },
]

export default dashRoutes
