export const supportCategories = [
  {
    key: 'shipment_issues',
    label: 'Shipment Issues',
    description: 'Problems with pickups, delivery, or lost shipments',
    subcategories: [
      { key: 'pickup_not_done', label: 'Pickup Not Done' },
      { key: 'pickup_delayed', label: 'Pickup Delayed' },
      { key: 'shipment_lost', label: 'Shipment Lost' },
      { key: 'shipment_damaged', label: 'Shipment Damaged' },
      { key: 'rto_issue', label: 'RTO Not Returned / Stuck' },
      { key: 'delivered_to_wrong_address', label: 'Delivered to Wrong Address' },
    ],
  },
  {
    key: 'awb_issues',
    label: 'AWB & Label Issues',
    description: 'Problems with airway bills, label generation, or printing',
    subcategories: [
      { key: 'awb_not_generated', label: 'AWB Not Generated' },
      { key: 'awb_not_visible', label: 'AWB Not Visible on Portal' },
      { key: 'wrong_awb_assigned', label: 'Wrong AWB Assigned' },
      { key: 'label_format_issue', label: 'Label Format Incorrect' },
    ],
  },
  {
    key: 'payment_refund',
    label: 'Payments & Refunds',
    description: 'Wallet recharges, COD settlements, or refund issues',
    subcategories: [
      { key: 'wallet_recharge_not_reflected', label: 'Recharge Not Reflecting' },
      { key: 'cod_payment_delayed', label: 'COD Payment Delayed' },
      { key: 'cod_payment_short', label: 'COD Payment Short' },
      { key: 'refund_not_received', label: 'Refund Not Received' },
      { key: 'extra_charge_on_shipment', label: 'Extra Charges on Shipment' },
    ],
  },
  {
    key: 'courier_partner',
    label: 'Courier Partner Issues',
    description: 'Partner-specific complaints or requests',
    subcategories: [
      { key: 'courier_not_picking_up', label: 'Courier Not Picking Up Orders' },
      { key: 'bad_courier_experience', label: 'Unprofessional Courier Behavior' },
      { key: 'request_new_partner', label: 'Request New Courier Partner' },
      { key: 'disable_partner', label: 'Disable Existing Partner' },
    ],
  },
  {
    key: 'returns_rto',
    label: 'Returns & RTOs',
    description: 'Concerns with returns, buyer rejections, or fake RTOs',
    subcategories: [
      { key: 'fake_rto', label: 'Fake RTO / Buyer Not Attempted' },
      { key: 'rto_damaged_product', label: 'RTO Came Back Damaged' },
      { key: 'rto_overcharged', label: 'Overcharged for RTO' },
      { key: 'rto_not_updated', label: 'RTO Not Updated in Dashboard' },
    ],
  },
  {
    key: 'kyc_onboarding',
    label: 'KYC & Onboarding',
    description: 'Problems with account verification or profile setup',
    subcategories: [
      { key: 'kyc_pending', label: 'KYC Pending Too Long' },
      { key: 'bank_not_verified', label: 'Bank Not Verified' },
      { key: 'document_rejected', label: 'Document Rejected' },
      { key: 'cheque_upload_issue', label: 'Cannot Upload Cheque' },
    ],
  },
  {
    key: 'platform_issue',
    label: 'Platform Issues',
    description: 'Bugs or glitches in dashboard, orders, or UI',
    subcategories: [
      { key: 'dashboard_not_loading', label: 'Dashboard Not Loading' },
      { key: 'order_not_syncing', label: 'Orders Not Syncing' },
      { key: 'tracking_not_updating', label: 'Tracking Not Updating' },
      { key: 'filters_not_working', label: 'Filters Not Working' },
      { key: 'inventory_error', label: 'Inventory Mismatch/Error' },
    ],
  },
  {
    key: 'other',
    label: 'Other / General Query',
    description: 'Anything not listed above',
    subcategories: [
      { key: 'feedback_suggestion', label: 'Feedback / Suggestion' },
      { key: 'schedule_call', label: 'Request a Call from Support' },
      { key: 'account_deactivation', label: 'Deactivate My Account' },
      { key: 'other', label: 'Other (Please Specify)' },
    ],
  },
]