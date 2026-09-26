import api from './axios'

// Get comprehensive admin dashboard statistics
export const getAdminDashboardStats = async (filters = {}) => {
  try {
    // Fetch all necessary data in parallel
    const orderQuery = {
      page: 1,
      limit: 100000,
      ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
      ...(filters.toDate ? { toDate: filters.toDate } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }
    const [
      ordersResponse,
      usersResponse,
      ndrResponse,
      rtoResponse,
      codStatsResponse,
      codPayablesResponse,
      codRemittancesResponse,
      ticketsResponse,
      couriersResponse,
    ] = await Promise.allSettled([
      api.get('/admin/orders/all-orders', { params: orderQuery }),
      api.get('/admin/users/users-management', { params: { page: 1, perPage: 100000 } }),
      api.get('/admin/ndr/kpis'),
      api.get('/admin/rto/kpis'),
      api.get('/admin/cod-remittance/stats'),
      api.get('/admin/cod-remittance/payable-report', { params: { status: 'pending', limit: 1000 } }),
      api.get('/admin/cod-remittance/remittances', { params: { page: 1, limit: 100000 } }),
      api.get('/admin/support-tickets', {
        params: { page: 1, limit: 100000, status: ['open', 'in_progress'] },
      }),
      api.get('/admin/couriers/list'),
    ])

    for (const [name, result] of [
      ['orders', ordersResponse],
      ['merchants', usersResponse],
      ['support tickets', ticketsResponse],
    ]) {
      if (result.status === 'rejected' || result.value.data?.success === false) {
        throw new Error(`Could not load ${name} for the dashboard`)
      }
    }

    const fetchedOrders =
      ordersResponse.status === 'fulfilled' ? ordersResponse.value.data?.orders || [] : []

    // Extract users - API returns { success: true, data: [...users array...], totalCount: number }
    // The controller returns: res.json({ success: true, data, totalCount })
    // where data is the users array from getAllUsersWithRoleUser
    let users = []
    let totalUsersCount = 0
    if (usersResponse.status === 'fulfilled') {
      const responseData = usersResponse.value.data
      // API response structure: { success: true, data: [...users...], totalCount: ... }
      // So axios response.value.data = { success: true, data: [...users...], totalCount: ... }
      if (responseData?.success && Array.isArray(responseData.data)) {
        users = responseData.data
        totalUsersCount = responseData.totalCount || users.length
      } else if (Array.isArray(responseData?.data)) {
        // Fallback: data.data might be the users array
        users = responseData.data
        totalUsersCount = responseData.totalCount || responseData.data?.totalCount || users.length
      } else if (Array.isArray(responseData)) {
        // Fallback: responseData itself might be the users array
        users = responseData
        totalUsersCount = users.length
      } else {
        users = []
        totalUsersCount = responseData?.totalCount || 0
      }
    }

    const ndrKpis = ndrResponse.status === 'fulfilled' ? ndrResponse.value.data?.data || {} : {}
    const rtoKpis = rtoResponse.status === 'fulfilled' ? rtoResponse.value.data?.data || {} : {}
    const codStats =
      codStatsResponse.status === 'fulfilled' ? codStatsResponse.value.data?.data || {} : {}
    const codPayables =
      codPayablesResponse.status === 'fulfilled'
        ? codPayablesResponse.value.data?.data || {}
        : {}
    const codRemittances =
      codRemittancesResponse.status === 'fulfilled'
        ? codRemittancesResponse.value.data?.data?.remittances || []
        : []
    const ticketResult = ticketsResponse.status === 'fulfilled' ? ticketsResponse.value.data : null
    const tickets = Array.isArray(ticketResult?.data) ? ticketResult.data : []
    const ticketCounts = ticketResult?.statusCounts || {}
    const couriers =
      couriersResponse.status === 'fulfilled'
        ? couriersResponse.value.data?.data?.couriers || couriersResponse.value.data?.data || []
        : []

    const selectedCourier = String(filters.courier || '').trim().toLowerCase()
    const orders = fetchedOrders.filter((order) => {
      if (!selectedCourier) return true
      const courier = String(order.courier_partner || order.courierPartner || order.integration_type || order.integrationType || '').trim().toLowerCase()
      return courier === selectedCourier
    })
    const availableCouriers = Array.from(new Set(fetchedOrders
      .map((order) => String(order.courier_partner || order.courierPartner || order.integration_type || order.integrationType || '').trim())
      .filter(Boolean))).sort()

    // Calculate stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const hasDateFilter = Boolean(filters.fromDate || filters.toDate)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const getFirstValidDate = (...values) => {
      for (const value of values) {
        if (!value) continue
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) return parsed
      }
      return new Date(0)
    }
    const getOrderTimestamp = (order) =>
      getFirstValidDate(order.order_date, order.orderDate, order.created_at, order.createdAt)
    const isSameLocalDay = (date, target) =>
      date.getFullYear() === target.getFullYear() &&
      date.getMonth() === target.getMonth() &&
      date.getDate() === target.getDate()
    const formatLocalDateKey = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
    const formatChartDateKey = (date) =>
      hasDateFilter
        ? formatLocalDateKey(date)
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const toAmount = (...values) => {
      for (const value of values) {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) return parsed
      }
      return 0
    }
    const hasValue = (value) => {
      if (value === undefined || value === null) return false
      return String(value).trim() !== ''
    }
    const REQUIRED_KYC_FIELDS = {
      individual: ['panNumber', 'panCardUrl', 'aadhaarUrl', 'cancelledChequeUrl'],
      sole_proprietor: [
        'panNumber',
        'gstin',
        'panCardUrl',
        'aadhaarUrl',
        'cancelledChequeUrl',
        'gstCertificateUrl',
      ],
      partnership_firm: [
        'panNumber',
        'gstin',
        'partnershipDeedUrl',
        'panCardUrl',
        'aadhaarUrl',
        'cancelledChequeUrl',
        'gstCertificateUrl',
      ],
      company: {
        private_limited: [
          'panNumber',
          'gstin',
          'cin',
          'gstCertificateUrl',
          'boardResolutionUrl',
          'businessPanUrl',
          'aadhaarUrl',
        ],
        llp: [
          'panNumber',
          'gstin',
          'businessPanUrl',
          'aadhaarUrl',
          'companyAddressProofUrl',
          'cancelledChequeUrl',
          'llpAgreementUrl',
          'gstCertificateUrl',
        ],
        one_person_company: [
          'panNumber',
          'gstin',
          'businessPanUrl',
          'aadhaarUrl',
          'cin',
          'companyAddressProofUrl',
          'cancelledChequeUrl',
        ],
        section_8_company: [
          'panNumber',
          'gstin',
          'businessPanUrl',
          'aadhaarUrl',
          'companyAddressProofUrl',
          'boardResolutionUrl',
          'cancelledChequeUrl',
        ],
        public_limited: [
          'panNumber',
          'gstin',
          'businessPanUrl',
          'aadhaarUrl',
          'gstCertificateUrl',
        ],
      },
    }
    const resolveRequiredKycFields = (user) => {
      const structure =
        user.kycStructure ||
        user.structure ||
        user.domesticKyc?.structure ||
        (user.kycCompanyType || user.companyType ? 'company' : 'individual')
      const required = REQUIRED_KYC_FIELDS[structure]

      if (!required) return REQUIRED_KYC_FIELDS.individual
      if (Array.isArray(required)) return required

      const companyType = user.kycCompanyType || user.companyType || 'private_limited'
      return required[companyType] || required.private_limited
    }
    const getKycProgress = (user) => {
      const requiredFields = resolveRequiredKycFields(user)
      const uploadedFields = requiredFields.filter((field) => hasValue(user[field]))
      return {
        required: requiredFields.length,
        uploaded: uploadedFields.length,
        missing: Math.max(requiredFields.length - uploadedFields.length, 0),
      }
    }
    const getPickupDetails = (order) => {
      const rawDetails = order.pickup_details || order.pickupDetails || {}
      if (rawDetails && typeof rawDetails === 'object') return rawDetails
      if (typeof rawDetails === 'string' && rawDetails.trim()) {
        try {
          const parsed = JSON.parse(rawDetails)
          return parsed && typeof parsed === 'object' ? parsed : {}
        } catch {
          return {}
        }
      }
      return {}
    }
    const getOrderStatusValue = (order) =>
      String(order.order_status || order.orderStatus || '').toLowerCase()
    const getPickupStatusValue = (order) =>
      String(order.pickup_status || order.pickupStatus || '').toLowerCase()
    const hasShipmentIdentity = (order) =>
      hasValue(order.awb_number) ||
      hasValue(order.awbNumber) ||
      hasValue(order.shipment_id) ||
      hasValue(order.shipmentId)
    const hasPickupSlot = (order) => {
      const pickupDetails = getPickupDetails(order)
      return [
        order.pickup_date,
        order.pickupDate,
        order.requested_pickup_date,
        order.requestedPickupDate,
        pickupDetails.pickup_date,
        pickupDetails.pickupDate,
        pickupDetails.requested_pickup_date,
        pickupDetails.requestedPickupDate,
        pickupDetails.expected_pickup_date,
        pickupDetails.expectedPickupDate,
      ].some(hasValue)
    }
    const isPickupClosed = (order) => {
      const status = getOrderStatusValue(order)
      const pickupStatus = getPickupStatusValue(order)
      return (
        [
          'in_transit',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'rto',
          'rto_in_transit',
          'rto_delivered',
        ].includes(status) ||
        ['picked', 'picked_up', 'completed', 'closed'].includes(pickupStatus)
      )
    }
    const isPendingForPickup = (order) => {
      const status = getOrderStatusValue(order)
      const pickupStatus = getPickupStatusValue(order)
      return (
        hasShipmentIdentity(order) &&
        !isPickupClosed(order) &&
        (['shipment_created', 'pickup_initiated', 'booked'].includes(status) ||
          ['pending', 'scheduled', 'pickup_scheduled', 'pickup_initiated'].includes(pickupStatus))
      )
    }
    const isPickupNotScheduled = (order) => {
      const pickupStatus = getPickupStatusValue(order)
      const pickupError = order.pickup_error || order.pickupError
      return (
        hasShipmentIdentity(order) &&
        !isPickupClosed(order) &&
        (hasValue(pickupError) ||
          ['', 'pending', 'failed', 'not_scheduled'].includes(pickupStatus) ||
          !hasPickupSlot(order))
      )
    }
    const getOrderId = (order) => String(order?.id || order?.order_id || order?.orderId || '')
    const nonCancelledOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return status !== 'cancelled'
    })
    const operationalBaseCount = nonCancelledOrders.length

    // ========== SELECTED-SCOPE OPERATIONS ==========
    const todayOrders = orders
    const pendingOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return ['pending', 'booked'].includes(status)
    })
    const inTransitOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return ['shipment_created', 'in_transit', 'out_for_delivery'].includes(status)
    })
    const deliveredToday = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return status === 'delivered'
    })
    const activeNdrOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      const ndrKeywords = [
        'ndr',
        'undelivered',
        'delivery_attempt_failed',
        'door_closed',
        'address_issue',
      ]
      return ndrKeywords.some((keyword) => status.includes(keyword))
    })
    const activeNdrOrderIds = new Set(activeNdrOrders.map((order) => getOrderId(order)).filter(Boolean))
    const stuckOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      const orderDate = getOrderTimestamp(o)
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
      return ['in_transit', 'out_for_delivery'].includes(status) && daysDiff > 5
    })
    const todayPendingOrders = todayOrders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return ['pending', 'booked'].includes(status)
    })
    const todayInTransitOrders = todayOrders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return ['shipment_created', 'in_transit', 'out_for_delivery'].includes(status)
    })
    const todayNdrOrders = todayOrders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      const ndrKeywords = [
        'ndr',
        'undelivered',
        'delivery_attempt_failed',
        'door_closed',
        'address_issue',
      ]
      return ndrKeywords.some((keyword) => status.includes(keyword))
    })
    const todayStuckOrders = todayOrders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      const orderDate = getOrderTimestamp(o)
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
      return ['in_transit', 'out_for_delivery'].includes(status) && daysDiff > 5
    })

    // ========== FINANCIAL OVERVIEW ==========
    // Revenue calculation:
    // - shipping_charges = what seller shows on label (what customer sees)
    // - freight_charges = what platform charges seller (based on rate card)
    // - courier_cost = what platform actually pays to courier
    // - Revenue = freight_charges - courier_cost (platform profit/margin)

    // Today's shipping charges collected (what sellers show on labels)
    const todayShippingCharges = todayOrders.reduce((sum, o) => {
      const shippingCharge = toAmount(o.shipping_charges, o.shippingCharge, o.shipping_charge)
      return sum + shippingCharge
    }, 0)

    // Today's revenue (what platform earns = freight_charges - courier_cost)
    const todayRevenue = todayOrders.reduce((sum, o) => {
      const freightCharge = toAmount(o.freight_charges, o.freightCharges)
      const courierCost = toAmount(o.courier_cost, o.courierCost)
      return sum + (freightCharge - courierCost)
    }, 0)

    // Total shipping charges collected (what sellers charge customers - shown on labels)
    // Database field is shipping_charges (with 's')
    // Note: Drizzle returns numeric fields as strings, so we need to parse them
    const totalShippingCharges = orders.reduce((sum, o) => {
      const shippingCharge = toAmount(o.shipping_charges, o.shippingCharge, o.shipping_charge)
      return sum + shippingCharge
    }, 0)

    // Total freight charges (what platform charges sellers - based on rate card)
    const totalFreightCharges = orders.reduce((sum, o) => {
      const freightCharge = toAmount(o.freight_charges, o.freightCharges)
      return sum + freightCharge
    }, 0)

    // Total courier costs (what platform pays to couriers)
    const totalCourierCosts = orders.reduce((sum, o) => {
      const courierCost = toAmount(o.courier_cost, o.courierCost)
      return sum + courierCost
    }, 0)

    // Total revenue (platform profit = freight_charges - courier_cost)
    const totalRevenue = orders.reduce((sum, o) => {
      const freightCharge = toAmount(o.freight_charges, o.freightCharges)
      const courierCost = toAmount(o.courier_cost, o.courierCost)
      return sum + (freightCharge - courierCost)
    }, 0)

    const codOrders = orders.filter(
      (o) =>
        (o.order_type || '').toLowerCase() === 'cod' ||
        (o.payment_method || '').toUpperCase() === 'COD' ||
        (o.paymentMethod || '').toUpperCase() === 'COD',
    )
    const codAmount = codOrders.reduce(
      (sum, o) =>
        sum + parseFloat(o.cod_amount || o.codAmount || o.order_amount || o.orderAmount || 0),
      0,
    )
    const codRemittanceDue = Number(codStats?.totalPending?.amount || 0)

    // ========== OPERATIONAL HEALTH ==========
    const totalOrders = orders.length
    const deliveredOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return status === 'delivered'
    })
    const deliverySuccessRate =
      operationalBaseCount > 0 ? Math.round((deliveredOrders.length / operationalBaseCount) * 100) : 0
    const ndrOrdersAffected = activeNdrOrders.length
    const ndrRate =
      operationalBaseCount > 0
        ? Number(((ndrOrdersAffected / operationalBaseCount) * 100).toFixed(1))
        : 0
    const rtoOrders = orders.filter((o) => {
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      return status.includes('rto') || status === 'returned_to_origin'
    })
    const rtoRate =
      operationalBaseCount > 0 ? Math.round((rtoOrders.length / operationalBaseCount) * 100) : 0

    // Calculate average delivery time
    const deliveredOrdersWithDates = deliveredOrders.filter((o) => {
      const created = getOrderTimestamp(o)
      const delivered = getFirstValidDate(o.delivered_at, o.deliveredAt, o.updated_at, o.updatedAt)
      return !Number.isNaN(created.getTime()) && !Number.isNaN(delivered.getTime())
    })
    const avgDeliveryTime =
      deliveredOrdersWithDates.length > 0
        ? Math.round(
            deliveredOrdersWithDates.reduce((sum, o) => {
              const created = getOrderTimestamp(o)
              const delivered = getFirstValidDate(
                o.delivered_at,
                o.deliveredAt,
                o.updated_at,
                o.updatedAt,
              )
              return sum + Math.floor((delivered - created) / (1000 * 60 * 60 * 24))
            }, 0) / deliveredOrdersWithDates.length,
          )
        : 0

    // ========== ALERTS & ACTION ITEMS ==========
    const openTickets = tickets.filter((t) => t.status === 'open')
    const inProgressTickets = tickets.filter((t) => t.status === 'in_progress')
    const overdueTickets = tickets.filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due < now && ['open', 'in_progress'].includes(t.status)
    })
    const pendingKyc = users.filter((u) => {
      const kycStatus = u.kycStatus || u.kyc_status || u.domesticKyc?.status || 'pending'
      return kycStatus === 'verification_in_progress'
    })
    const accountPendingApproval = users.filter((u) => u.approved !== true)
    const usersWithKycProgress = users.map((user) => ({
      user,
      status: user.kycStatus || user.kyc_status || user.domesticKyc?.status || 'pending',
      progress: getKycProgress(user),
    }))
    const newSignupsDocumentsNotUploaded = usersWithKycProgress.filter(
      ({ status, progress }) => status !== 'verified' && progress.uploaded === 0,
    )
    const partialDocumentsUploaded = usersWithKycProgress.filter(
      ({ status, progress }) =>
        status !== 'verified' && progress.uploaded > 0 && progress.missing > 0,
    )
    const documentsMissing = usersWithKycProgress.filter(
      ({ status, progress }) => status !== 'verified' && progress.missing > 0,
    )
    const pendingForPickup = orders.filter(isPendingForPickup)
    const pickupNotScheduled = orders.filter(isPickupNotScheduled)
    const weightDiscrepancies = orders.filter(
      (o) => o.weight_discrepancy === true || o.weightDiscrepancy === true,
    )

    // ========== COURIER PERFORMANCE ==========
    const ordersByCourier = orders.reduce((acc, o) => {
      const courierName = o.courier_partner || o.courierPartner || o.integration_type || o.integrationType || 'Unknown'
      if (!acc[courierName]) {
        acc[courierName] = {
          count: 0,
          delivered: 0,
          ndr: 0,
          rto: 0,
          revenue: 0,
          avgDeliveryTime: 0,
          deliveryTimes: [],
        }
      }
      const status = (o.order_status || o.orderStatus || '').toLowerCase()
      if (status !== 'cancelled') {
        acc[courierName].count += 1
      }
      // Calculate shipping charges (what sellers show on labels)
      // Database field is shipping_charges (with 's')
      // Note: Drizzle returns numeric fields as strings, so we need to parse them
      const shippingCharge = toAmount(o.shipping_charges, o.shippingCharge, o.shipping_charge)
      acc[courierName].shippingCharges = (acc[courierName].shippingCharges || 0) + shippingCharge

      // Calculate freight charges (what platform charges sellers)
      const freightCharge = toAmount(o.freight_charges, o.freightCharges)
      acc[courierName].freightCharges = (acc[courierName].freightCharges || 0) + freightCharge

      // Calculate courier costs (what platform pays couriers)
      const courierCost = toAmount(o.courier_cost, o.courierCost)
      acc[courierName].courierCosts = (acc[courierName].courierCosts || 0) + courierCost

      // Calculate revenue (freight_charges - courier_cost)
      acc[courierName].revenue = (acc[courierName].revenue || 0) + (freightCharge - courierCost)
      if (status === 'delivered') {
        acc[courierName].delivered += 1
        const created = getOrderTimestamp(o)
        const delivered = getFirstValidDate(o.delivered_at, o.deliveredAt, o.updated_at, o.updatedAt)
        if (!Number.isNaN(created.getTime()) && !Number.isNaN(delivered.getTime())) {
          const days = Math.floor((delivered - created) / (1000 * 60 * 60 * 24))
          acc[courierName].deliveryTimes.push(days)
        }
      }
      if (activeNdrOrderIds.has(getOrderId(o))) acc[courierName].ndr += 1
      if (rtoOrders.some((rto) => getOrderId(rto) === getOrderId(o))) acc[courierName].rto += 1

      return acc
    }, {})

    // Calculate delivery rates and avg times for each courier
    Object.keys(ordersByCourier).forEach((key) => {
      const courier = ordersByCourier[key]
      courier.deliveryRate =
        courier.count > 0 ? Math.round((courier.delivered / courier.count) * 100) : 0
      courier.ndrRate = courier.count > 0 ? Math.round((courier.ndr / courier.count) * 100) : 0
      courier.rtoRate = courier.count > 0 ? Math.round((courier.rto / courier.count) * 100) : 0
      courier.avgDeliveryTime =
        courier.deliveryTimes.length > 0
          ? Math.round(
              courier.deliveryTimes.reduce((a, b) => a + b, 0) / courier.deliveryTimes.length,
            )
          : 0
    })

    // ========== GEOGRAPHIC INSIGHTS ==========
    const topOriginCities = orders.reduce((acc, o) => {
      const city = o.pickup_city || o.pickupCity || o.city || 'Unknown'
      acc[city] = (acc[city] || 0) + 1
      return acc
    }, {})
    const topDestinationCities = orders.reduce((acc, o) => {
      const city = o.city || o.destination_city || 'Unknown'
      acc[city] = (acc[city] || 0) + 1
      return acc
    }, {})

    const highRiskPincodeMap = orders.reduce((acc, order) => {
      const pincode = String(order.pincode || order.destination_pincode || order.destinationPincode || 'Unknown').trim() || 'Unknown'
      const status = String(order.order_status || order.orderStatus || '').toLowerCase()
      if (!acc[pincode]) acc[pincode] = { total: 0, incidents: 0 }
      acc[pincode].total += 1
      if (status.includes('ndr') || status.includes('undelivered') || status.includes('rto')) acc[pincode].incidents += 1
      return acc
    }, {})
    const highRiskPincodes = Object.entries(highRiskPincodeMap)
      .filter(([, value]) => value.incidents > 0)
      .map(([pincode, value]) => ({
        pincode,
        orders: value.total,
        incidents: value.incidents,
        riskRate: value.total ? Math.round((value.incidents / value.total) * 100) : 0,
      }))
      .sort((a, b) => b.riskRate - a.riskRate || b.incidents - a.incidents)
      .slice(0, 5)

    // ========== ORDER STATUS BREAKDOWN ==========
    const orderStatusCounts = orders.reduce((acc, o) => {
      const status = o.order_status || o.orderStatus || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // ========== RECENT ORDERS ==========
    const recentOrders = [...orders]
      .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a))
      .slice(0, 10)

    const getStatusBucket = (order) => {
      const status = getOrderStatusValue(order).replace(/[\s-]+/g, '_')
      const pickupStatus = getPickupStatusValue(order).replace(/[\s-]+/g, '_')
      if (status.includes('ndr') || status.includes('undelivered') || status.includes('attempt_failed')) return 'ndr'
      if (status.includes('rto') || status.includes('returned_to_origin')) return 'rto'
      if (status === 'delivered') return 'delivered'
      if (status.includes('out_for_delivery') || status === 'ofd') return 'ofd'
      if (['picked', 'picked_up', 'pickup_completed'].includes(pickupStatus) || status === 'picked_up') return 'pickedUp'
      if (['in_transit', 'shipped', 'manifested'].includes(status)) return 'shipped'
      if (
        ['pickup_generated', 'pickup_initiated', 'pickup_scheduled', 'scheduled'].includes(status) ||
        ['pickup_generated', 'pickup_initiated', 'pickup_scheduled', 'scheduled'].includes(pickupStatus)
      ) return 'pickupGenerated'
      return null
    }

    const statusActivityByDate = {}
    const codMovementByDate = {}
    const validChartDates = [
      ...orders.map((order) => getOrderTimestamp(order)),
      ...codRemittances.map((remittance) =>
        getFirstValidDate(
          remittance.collectedAt,
          remittance.collected_at,
          remittance.creditedAt,
          remittance.credited_at,
          remittance.createdAt,
          remittance.created_at,
        ),
      ),
    ].filter((date) => !Number.isNaN(date.getTime()))
    const earliestChartDate = validChartDates.reduce(
      (earliest, date) => (date < earliest ? date : earliest),
      today,
    )
    const chartStart = hasDateFilter && filters.fromDate
      ? getFirstValidDate(filters.fromDate)
      : hasDateFilter
        ? earliestChartDate
        : new Date(earliestChartDate.getFullYear(), earliestChartDate.getMonth(), 1)
    const chartEnd = hasDateFilter && filters.toDate ? getFirstValidDate(filters.toDate) : today
    const iterateChartBuckets = (callback) => {
      const cursor = new Date(chartStart)
      if (!hasDateFilter) cursor.setDate(1)
      const end = new Date(chartEnd)
      if (!hasDateFilter) end.setDate(1)

      while (cursor <= end) {
        callback(new Date(cursor), formatChartDateKey(cursor))
        if (hasDateFilter) cursor.setDate(cursor.getDate() + 1)
        else cursor.setMonth(cursor.getMonth() + 1)
      }
    }

    iterateChartBuckets((_date, dateStr) => {
      statusActivityByDate[dateStr] = {
        date: dateStr,
        created: 0,
        pickupGenerated: 0,
        pickedUp: 0,
        shipped: 0,
        ofd: 0,
        delivered: 0,
        rto: 0,
        ndr: 0,
      }
      codMovementByDate[dateStr] = { date: dateStr, collected: 0, remitted: 0 }
    })

    orders.forEach((order) => {
      const createdAt = getOrderTimestamp(order)
      const createdKey = Number.isNaN(createdAt.getTime()) ? '' : formatChartDateKey(createdAt)
      if (statusActivityByDate[createdKey]) statusActivityByDate[createdKey].created += 1

      const statusBucket = getStatusBucket(order)
      const activityAt = getFirstValidDate(
        statusBucket === 'delivered' ? order.delivered_at || order.deliveredAt : null,
        order.updated_at,
        order.updatedAt,
        order.created_at,
        order.createdAt,
      )
      const activityKey = Number.isNaN(activityAt.getTime()) ? '' : formatChartDateKey(activityAt)
      if (statusBucket && statusActivityByDate[activityKey]) {
        statusActivityByDate[activityKey][statusBucket] += 1
      }
    })

    codRemittances.forEach((remittance) => {
      const amount = toAmount(remittance.remittableAmount, remittance.remittable_amount)
      const collectedAt = getFirstValidDate(remittance.collectedAt, remittance.collected_at, remittance.createdAt, remittance.created_at)
      const collectedKey = Number.isNaN(collectedAt.getTime()) ? '' : formatChartDateKey(collectedAt)
      if (codMovementByDate[collectedKey]) codMovementByDate[collectedKey].collected += amount

      if (String(remittance.status).toLowerCase() === 'credited') {
        const creditedAt = getFirstValidDate(remittance.creditedAt, remittance.credited_at)
        const creditedKey = Number.isNaN(creditedAt.getTime()) ? '' : formatChartDateKey(creditedAt)
        if (codMovementByDate[creditedKey]) codMovementByDate[creditedKey].remitted += amount
      }
    })
    const scopedCodRemitted = codRemittances.reduce((sum, remittance) => {
      if (String(remittance.status || '').toLowerCase() !== 'credited') return sum
      if (filters.userId && String(remittance.userId || remittance.user_id || '') !== String(filters.userId)) return sum
      if (selectedCourier) {
        const courier = String(remittance.courierPartner || remittance.courier_partner || '').trim().toLowerCase()
        if (courier !== selectedCourier) return sum
      }
      const creditedAt = getFirstValidDate(remittance.creditedAt, remittance.credited_at)
      if (hasDateFilter) {
        const from = filters.fromDate ? getFirstValidDate(filters.fromDate) : null
        const to = filters.toDate ? getFirstValidDate(filters.toDate) : null
        if (from && creditedAt < from) return sum
        if (to) {
          const inclusiveTo = new Date(to)
          inclusiveTo.setHours(23, 59, 59, 999)
          if (creditedAt > inclusiveTo) return sum
        }
      }
      return sum + toAmount(remittance.remittableAmount, remittance.remittable_amount)
    }, 0)

    const recentActivity = [
      ...recentOrders.map((order) => ({
        id: `order-${getOrderId(order)}`,
        type: 'order',
        title: order.order_number || order.orderNumber || 'Shipment updated',
        detail: `${order.courier_partner || order.courierPartner || 'Courier pending'} · ${String(order.order_status || order.orderStatus || 'created').replace(/_/g, ' ')}`,
        status: getOrderStatusValue(order),
        occurredAt: getFirstValidDate(order.updated_at, order.updatedAt, order.created_at, order.createdAt).toISOString(),
        route: '/admin/orders',
      })),
      ...tickets.slice(0, 8).map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: 'support',
        title: ticket.subject || 'Support ticket',
        detail: `${ticket.userName || ticket.userEmail || 'Seller'} · ${String(ticket.status || 'open').replace(/_/g, ' ')}`,
        status: ticket.status || 'open',
        occurredAt: getFirstValidDate(ticket.updatedAt, ticket.updated_at, ticket.createdAt, ticket.created_at).toISOString(),
        route: '/admin/support',
      })),
    ]
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 8)

    // ========== CHART DATA ==========
    const ordersByDate = {}
    const ordersByDateByIntegration = {}
    iterateChartBuckets((date, dateStr) => {
      const bucketOrders = orders.filter((o) => {
        const orderDate = getOrderTimestamp(o)
        return hasDateFilter
          ? !Number.isNaN(orderDate.getTime()) && isSameLocalDay(orderDate, date)
          : orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth()
      })
      ordersByDate[dateStr] = bucketOrders.length

      ordersByDateByIntegration[dateStr] = bucketOrders.reduce((acc, o) => {
        const courierName = o.courier_partner || o.courierPartner || o.integration_type || o.integrationType || 'Unknown'
        acc[courierName] = (acc[courierName] || 0) + 1
        return acc
      }, {})
    })

    const shippingChargesByDate = {}
    const revenueByDate = {}
    iterateChartBuckets((date, dateStr) => {
      const bucketOrders = orders.filter((o) => {
        const orderDate = getOrderTimestamp(o)
        return hasDateFilter
          ? !Number.isNaN(orderDate.getTime()) && isSameLocalDay(orderDate, date)
          : orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth()
      })

      shippingChargesByDate[dateStr] = bucketOrders.reduce((sum, o) => {
        const shippingCharge = toAmount(o.shipping_charges, o.shippingCharge, o.shipping_charge)
        return sum + shippingCharge
      }, 0)

      revenueByDate[dateStr] = bucketOrders.reduce((sum, o) => {
        const freightCharge = toAmount(o.freight_charges, o.freightCharges)
        const courierCost = toAmount(o.courier_cost, o.courierCost)
        return sum + (freightCharge - courierCost)
      }, 0)
    })

    // ========== USERS ==========
    const todayUsers = users.filter((u) => {
      const userDate = getFirstValidDate(u.createdAt, u.created_at)
      return !Number.isNaN(userDate.getTime()) && isSameLocalDay(userDate, today)
    })
    const lastWeekUsers = users.filter((u) => {
      const userDate = new Date(u.createdAt || u.created_at)
      return userDate >= lastWeek
    })

    // Active users: Users who have created at least one non-cancelled order in the last 30 days
    const activeUsers = users.filter((u) => {
      // Get user ID (handle both camelCase and snake_case)
      const userId = u.id || u.userId
      if (!userId) return false

      // Find all orders for this user
      const userOrders = orders.filter((o) => {
        const orderUserId = o.user_id || o.userId
        // Convert both to strings for comparison to handle UUID vs string mismatches
        return String(orderUserId) === String(userId)
      })

      if (userOrders.length === 0) return false

      // Check if user has at least one non-cancelled order in the last 30 days
      const activeInLast30Days = userOrders.some((o) => {
        const status = (o.order_status || o.orderStatus || '').toLowerCase()
        if (status === 'cancelled') return false

        const orderDate = getOrderTimestamp(o)
        if (Number.isNaN(orderDate.getTime())) return false
        return orderDate >= lastMonth
      })

      return activeInLast30Days
    })

    // Users with orders in last 7 days (very active)
    const veryActiveUsers = users.filter((u) => {
      const userId = u.id || u.userId
      if (!userId) return false

      const userOrders = orders.filter((o) => {
        const orderUserId = o.user_id || o.userId
        return String(orderUserId) === String(userId)
      })

      return userOrders.some((o) => {
        const orderDate = getOrderTimestamp(o)
        if (Number.isNaN(orderDate.getTime())) return false
        return orderDate >= lastWeek
      })
    })

    // Service provider distribution
    const couriersByServiceProvider = couriers.reduce((acc, c) => {
      const provider = c.serviceProvider || c.service_provider || 'unknown'
      const providerName = provider === 'delhivery' ? 'Delhivery' : 'Other'
      acc[providerName] = (acc[providerName] || 0) + 1
      return acc
    }, {})

    return {
      success: true,
      data: {
        isAllTime: !hasDateFilter,
        // Today's Operations
        todayOperations: {
          orders: todayOrders.length,
          pending: todayPendingOrders.length,
          inTransit: todayInTransitOrders.length,
          delivered: deliveredToday.length,
          ndr: todayNdrOrders.length,
          stuck: todayStuckOrders.length,
        },
        // Financial Overview
        financial: {
          todayShippingCharges, // Today's shipping charges (what sellers show on labels)
          todayRevenue, // Today's revenue (freight_charges - courier_cost)
          totalShippingCharges, // Total shipping charges (what sellers charge customers)
          totalFreightCharges, // Total freight charges (what platform charges sellers)
          totalCourierCosts, // Total courier costs (what platform pays to couriers)
          totalRevenue, // Total revenue (platform profit = freight_charges - courier_cost)
          codAmount,
          codRemittanceDue,
          codStats: {
            totalCollected: Number(codStats?.totalCredited?.amount || 0),
            remitted: scopedCodRemitted,
            pendingRemittance: Number(codStats?.totalPending?.amount || 0),
            pendingOrders: Number(codStats?.totalPending?.count || 0),
            sellersPending: Number(codStats?.usersWithPending || 0),
          },
          codPayableSummary: codPayables.summary || {},
          topCodPayables: (codPayables.customerPayables || []).slice(0, 6),
        },
        // Operational Health
        operational: {
          deliverySuccessRate,
          ndrRate,
          rtoRate,
          avgDeliveryTime,
          totalOrders,
          deliveredOrders: deliveredOrders.length,
          ndrOrders: ndrOrdersAffected,
          rtoOrders: rtoOrders.length,
        },
        // Alerts & Actions
        alerts: {
          openTickets: Number(ticketCounts.open ?? openTickets.length),
          inProgressTickets: Number(ticketCounts.in_progress ?? inProgressTickets.length),
          overdueTickets: Number(ticketCounts.overdue ?? overdueTickets.length),
          pendingKyc: pendingKyc.length,
          merchantAccounts: {
            accountPendingApproval: accountPendingApproval.length,
            documentsNotUploaded: newSignupsDocumentsNotUploaded.length,
            partialDocumentsUploaded: partialDocumentsUploaded.length,
            documentsMissing: documentsMissing.length,
          },
          shipmentPickups: {
            pendingForPickup: pendingForPickup.length,
            pickupNotScheduled: pickupNotScheduled.length,
          },
          weightDiscrepancies: weightDiscrepancies.length,
          ndrKpis: ndrKpis,
          rtoKpis: rtoKpis,
        },
        // Courier Performance
        couriers: {
          performance: ordersByCourier,
          total: couriers.length,
          byServiceProvider: couriersByServiceProvider,
        },
        // Geographic
        geographic: {
          topOriginCities: Object.entries(topOriginCities)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([city, count]) => ({ city, count })),
          topDestinationCities: Object.entries(topDestinationCities)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([city, count]) => ({ city, count })),
          highRiskPincodes,
        },
        // Users
        users: {
          total: totalUsersCount || users.length, // Use totalCount from API if available, fallback to array length
          today: todayUsers.length,
          lastWeek: lastWeekUsers.length,
          active: activeUsers.length, // Users with orders in last 30 days or non-cancelled orders
          veryActive: veryActiveUsers.length, // Users with orders in last 7 days
          pendingKyc: pendingKyc.length,
        },
        // Charts
        charts: {
          ordersByDate: Object.entries(ordersByDate).map(([date, count]) => ({
            date,
            orders: count,
          })),
          ordersByIntegration: Object.entries(ordersByDateByIntegration).map(([date, types]) => ({
            date,
            ...types,
          })),
          shippingChargesByDate: Object.entries(shippingChargesByDate).map(([date, amount]) => ({
            date,
            shippingCharges: amount,
          })),
          revenueByDate: Object.entries(revenueByDate).map(([date, amount]) => ({
            date,
            revenue: amount,
          })),
          statusActivityByDate: Object.values(statusActivityByDate),
          codMovementByDate: Object.values(codMovementByDate),
        },
        filters: {
          couriers: availableCouriers,
          users: users.map((user) => ({
            id: user.id || user.userId || user.publicId,
            name: user.companyName || user.company_name || user.email || user.phone || user.id,
          })).filter((user) => user.id),
        },
        // Breakdowns
        orderStatusCounts,
        recentOrders: recentOrders.slice(0, 10),
        recentTickets: tickets.slice(0, 10),
        recentActivity,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}
