import http from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const file = new URL('./local-data.json', import.meta.url);
const user = {
  id: 'local-client', userId: 'local-client', email: 'client@punjabshiplogistics.com', displayName: 'Demo Client', role: 'user',
  onboardingComplete: true, profileComplete: true, approved: true, onboardingStep: 5,
  businessType: ['b2c', 'b2b', 'd2c'], salesChannels: {}, monthlyOrderCount: '100-500',
  companyInfo: { businessName: 'Demo Store', brandName: 'Demo Store', contactPerson: 'Demo Client', companyAddress: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001', contactEmail: 'client@punjabshiplogistics.com', companyEmail: 'client@punjabshiplogistics.com', companyContactNumber: '9000000000', contactNumber: '9000000000', POCEmailVerified: true, POCPhoneVerified: true },
  domesticKyc: { status: 'verified' }, bankDetails: { count: 0, primaryAccount: null }, gstDetails: {}, currentPlanName: 'Standard', currentPlanId: 'demo-plan', currentB2CPlanName: 'Standard', currentB2BPlanName: 'Standard',
};
const orders = Array.from({ length: 12 }, (_, i) => ({
  id: `demo-${i + 1}`, user_id: user.id, order_number: `DEMO-${1001 + i}`, order_id: `DEMO-${1001 + i}`,
  awb_number: `DEMOAWB${1001 + i}`, order_status: ['delivered', 'in_transit', 'pending', 'booked'][i % 4], status: ['delivered', 'in_transit', 'pending', 'booked'][i % 4],
  courier_partner: ['Delhivery', 'DTDC', 'Blue Dart'][i % 3], order_amount: 1250 + i * 100, total_amount: 1250 + i * 100, shipping_charges: 65 + i, freight_charges: 50, payment_type: i % 2 ? 'cod' : 'prepaid', order_type: i % 2 ? 'cod' : 'prepaid',
  customer_name: ['Aman Singh', 'Priya Sharma', 'Rahul Mehta'][i % 3], customer_city: ['Delhi', 'Mumbai', 'Jaipur'][i % 3], customer_state: 'Delhi', customer_pincode: '110001', customer_phone: '9000000000',
  pickup_details: { city: 'Ludhiana', state: 'Punjab', pincode: '141001', name: 'Demo Store' }, shipping_details: { city: 'Delhi', state: 'Delhi', pincode: '110001', name: 'Demo Customer' },
  products: [{ name: 'Sample product', quantity: 1, price: 1250 }], created_at: new Date(Date.now() - i * 86400000).toISOString(), updated_at: new Date().toISOString(), weight: 0.5,
}));
const state = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { user, orders, preferences: { widgetVisibility: {}, widgetOrder: ['quickStats','quickActions','insights','actionItems','performanceMetrics','ordersTrend','financialHealth','recentActivity','todaysOperations','orderStatusChart','courierComparison','metricsOverview','courierPerformance','topDestinations'], layout: {}, dateRange: {} } };
const save = () => writeFileSync(file, JSON.stringify(state, null, 2));
const brandAddress = 'SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104';
state.invoicePreferences ??= { brandName: 'PunjabShip', sellerAddress: brandAddress, supportEmail: 'info@punjabshiplogistics.com', supportPhone: '+91 84878 81121', prefix: 'PS-INV', template: 'classic', includeLogo: true, includeSignature: false };
state.aboutUs ??= { slug: 'about_us', title: 'About PunjabShip', content: `<h2>PunjabShip - Ship the world</h2><p>Plan domestic and international shipments with air, sea, road and courier choices in one clear booking workflow.</p><h3>Contact us</h3><p>${brandAddress}</p><p><a href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</a></p><p><a href="tel:+918487881121">+91 84878 81121</a></p>` };
const token = (role) => `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ id: role === 'admin' ? 'local-admin' : user.id, role, exp: Math.floor(Date.now()/1000)+86400 })).toString('base64url')}.local`;
const stats = () => ({
  todayOperations: { orders: 12, pending: 3, inTransit: 3, delivered: 3 },
  financial: { walletBalance: 5000, todayRevenue: 1250, totalRevenue: 21600, totalShippingCharges: 846, totalFreightCharges: 600, profit: 246, codAmount: 10800, codRemittanceDue: 5400, codRemittanceCredited: 5400 },
  operational: { deliverySuccessRate: 94, ndrRate: 2, rtoRate: 4, avgDeliveryTime: 72, totalOrders: 12, deliveredOrders: 3, ndrCount: 0, rtoCount: 0 },
  actions: { ndrCount: 0, rtoCount: 0, weightDiscrepancyCount: 0, openTickets: 0, inProgressTickets: 0, pendingInvoices: 0, pendingInvoiceAmount: 0, overdueInvoices: 0, overdueInvoiceAmount: 0 },
  couriers: { performance: {}, distribution: [{ courier: 'Delhivery', count: 4 }, { courier: 'DTDC', count: 4 }, { courier: 'Blue Dart', count: 4 }] }, geographic: { topDestinations: [{ city: 'Delhi', state: 'Delhi', count: 4 }] },
  charts: { ordersByDate: state.orders.map(o => ({ date: o.created_at.slice(0,10), orders: 1 })), revenueByDate: state.orders.map(o => ({ date: o.created_at.slice(0,10), revenue: o.order_amount })), ordersByDate30: [], revenueByDate30: [], ordersByStatus: ['delivered','in_transit','pending','booked'].map(status => ({ status, count: 3 })), revenueByOrderType: [], ordersByCourier: [], revenueByCourier: [] },
  metrics: { avgOrderValue: 1800, totalPrepaidOrders: 6, totalCodOrders: 6, prepaidRevenue: 10800, codRevenue: 10800, topRevenueCities: [] }, recentOrders: state.orders,
  trends: { ordersGrowth: 12, revenueGrowth: 8, thisWeekOrders: 7, lastWeekOrders: 5, thisWeekRevenue: 13000, lastWeekRevenue: 8600 }, recentActivity: { transactions: [], recentOrders: state.orders.slice(0,5).map(o => ({ id: o.id, orderNumber: o.order_number, status: o.status, amount: o.order_amount, createdAt: o.created_at })) },
});
http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):(5174|3001)$/.test(origin)) { res.writeHead(403); res.end(); return; }
  res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-refresh-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const send = (data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  try {
    const path = new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '');
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    console.log(req.method, path);
    if (path === '/api/health') return send({ success: true, mode: 'local-demo' });
    if (path === '/api/invoice-preferences') {
      if (req.method === 'POST') { state.invoicePreferences = { ...state.invoicePreferences, ...body }; save(); }
      return send({ success: true, preferences: state.invoicePreferences });
    }
    if (path === '/api/static-pages/about_us') {
      if (req.method === 'PUT') { state.aboutUs = { ...state.aboutUs, ...body, updated_at: new Date().toISOString() }; save(); }
      return send({ success: true, data: state.aboutUs });
    }
    if (path === '/api/admin/crm/session') return send({ success: true, data: { actorType: 'admin', scopeType: 'all', permissions: {} }, actorType: 'admin', scopeType: 'all', permissions: {} });
    if (/\/auth\/(admin\/login|request-password-login|verify-otp|refresh-token)$/.test(path)) {
      const admin = path.includes('admin');
      if (!path.endsWith('refresh-token') && !(path.endsWith('verify-otp') ? body.otp === '123456' : body.email === (admin ? 'admin@punjabshiplogistics.com' : 'client@punjabshiplogistics.com') && body.password === 'Demo@123')) return send({ error: 'Use the local demo credentials: ' + (admin ? 'admin@punjabshiplogistics.com' : 'client@punjabshiplogistics.com') + ' / Demo@123' }, 401);
      const t = token(admin ? 'admin' : 'user');
      return send({ success: true, message: 'Local demo login successful', token: t, accessToken: t, refreshToken: t, user: admin ? { id: 'local-admin', role: 'admin', adminAccess: { actorType: 'admin', scopeType: 'all' } } : state.user });
    }
    if (path.endsWith('/auth/request-otp')) return send({ message: 'Local demo OTP: 123456', demoOtp: '123456' });
    if (path.endsWith('/auth/logout')) return send({ success: true });
    if (path.endsWith('/profile/user')) return send(state.user);
    if (path.endsWith('/profile/readiness')) return send({ onboardingComplete: true, approved: true, hasCompanyInfo: true, kycVerified: true, hasAssignedPlan: true, assignedPlanName: 'Standard', hasPickupAddress: true, walletReady: true, walletBalance: 5000, requiredWalletBalance: 100, isEmployee: false, isReady: true });
    if (path.endsWith('/profile') && req.method === 'PATCH') { state.user = { ...state.user, ...body }; save(); return send({ message: 'Saved locally', user: state.user }); }
    if (path.endsWith('/wallet/balance')) return send({ success: true, data: { balance: 5000 }, balance: 5000 });
    if (path.endsWith('/dashboard/stats')) return send({ success: true, data: stats() });
    if (path.endsWith('/dashboard/preferences')) { if (req.method === 'POST') { state.preferences = { ...state.preferences, ...body }; save(); } return send({ success: true, data: state.preferences }); }
    if (path.endsWith('/dashboard/tour')) return send({ success: true, data: { version: 1, status: 'dismissed', completedPages: [] } });
    if (path.endsWith('/dashboard/invoice-status')) return send({ success: true, status: { pending: {count:0,totalAmount:0}, paid: {count:0,totalAmount:0}, overdue: {count:0,totalAmount:0} } });
    if (path.includes('/admin/users/users-management')) return send({ success: true, data: [{ ...state.user, companyName: 'Demo Store', createdAt: new Date().toISOString() }], totalCount: 1 });
    if (/orders/.test(path) && req.method === 'GET') return send({ success: true, orders: state.orders, data: state.orders, totalCount: state.orders.length, total: state.orders.length, totalPages: 1, page: 1, counts: {} });
    if (/notifications/.test(path)) return send({ success: true, data: [], notifications: [], unreadCount: 0, total: 0 });
    if (/\/kpis$|cod-remittance\/stats$|payable-report$/.test(path)) return send({ success: true, data: {} });
    if (path.includes('/cod-remittance/remittances')) return send({ success: true, data: { remittances: [], total: 0 } });
    if (req.method !== 'GET') return send({ success: false, error: 'This action needs a connected backend. Local mode is a UI preview.', message: 'This action needs a connected backend. Local mode is a UI preview.' }, 501);
    return send({ success: true, data: [], orders: [], pickups: [], destinations: [], distribution: [], transactions: [], tickets: [], couriers: [], warehouses: [], addresses: [], items: [], total: 0, totalCount: 0, totalPages: 1, page: 1, statusCounts: {}, balance: 5000 });
  } catch (e) { send({ success: false, error: e.message }, 500); }
}).listen(5004, '127.0.0.1', () => console.log('Local demo API: http://127.0.0.1:5004'));
