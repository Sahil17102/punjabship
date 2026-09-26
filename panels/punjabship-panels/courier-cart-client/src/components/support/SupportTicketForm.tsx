import { Alert, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { SupportTicketPrefill } from '../../api/support.api'
import { useCreateTicket } from '../../hooks/User/useSupport'
import { toast } from '../UI/Toast'
import AutocompleteDropdown from '../UI/inputs/AutoCompleteDropdown'
import CustomInput from '../UI/inputs/CustomInput'
import FileUploader, { type UploadedFileInfo } from '../UI/uploader/FileUploader'

interface FormValues {
  subject: string
  category: string
  subcategory: string
  awbNumber?: string
  description: string
  attachments: UploadedFileInfo[] | null
}

interface SupportTicketFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialPrefill?: SupportTicketPrefill | null
}

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

const buildPrefillDescription = (prefill?: SupportTicketPrefill | null) => {
  if (!prefill?.orderReferences?.length) return ''

  const lines = prefill.orderReferences.map((order, index) => {
    const parts = [
      `${index + 1}. Order ${order.orderNumber}`,
      order.awbNumber ? `AWB ${order.awbNumber}` : null,
      order.buyerName ? `Buyer ${order.buyerName}` : null,
      order.warehouseName ? `Warehouse ${order.warehouseName}` : null,
      order.courierPartner ? `Courier ${order.courierPartner}` : null,
      order.orderStatus ? `Status ${order.orderStatus}` : null,
    ].filter(Boolean)

    return parts.join(' | ')
  })

  return `Affected orders:\n${lines.join('\n')}\n\nIssue details:\n`
}

export const SupportTicketForm: React.FC<SupportTicketFormProps> = ({
  onSuccess,
  onCancel,
  initialPrefill,
}) => {
  const defaultDescription = useMemo(
    () => buildPrefillDescription(initialPrefill),
    [initialPrefill],
  )
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      subject: '',
      category: '',
      subcategory: '',
      awbNumber:
        initialPrefill?.orderReferences?.length === 1
          ? initialPrefill.orderReferences[0]?.awbNumber || ''
          : '',
      description: defaultDescription,
      attachments: null,
    },
  })

  const categoryKey = useWatch({ control, name: 'category' })
  const selectedCategory = supportCategories.find((c) => c.key === categoryKey)

  const { mutateAsync: createTicket } = useCreateTicket()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    reset({
      subject: '',
      category: '',
      subcategory: '',
      awbNumber:
        initialPrefill?.orderReferences?.length === 1
          ? initialPrefill.orderReferences[0]?.awbNumber || ''
          : '',
      description: buildPrefillDescription(initialPrefill),
      attachments: null,
    })
  }, [initialPrefill, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      setUploading(true)
      if (values.attachments) {
        const files = Array.from(values.attachments)
        if (files.length > 5) {
          throw new Error('You can only upload up to 5 files.')
        }

        const oversized = files.find((f) => f.size > 2 * 1024 * 1024) // 2MB
        if (oversized) {
          throw new Error(`File "${oversized.originalName}" exceeds the 2MB size limit.`)
        }
      }

      const uploadedUrls: string[] = []
      if (values.attachments) {
        for (const file of Array.from(values.attachments)) {
          uploadedUrls.push(file?.key)
        }
      }

      await createTicket({
        subject: values.subject,
        category: values.category,
        subcategory: values.subcategory,
        awbNumber: values.awbNumber,
        description: values.description,
        attachments: uploadedUrls,
      })

      toast.open({ message: 'Support ticket submitted successfully', severity: 'success' })
      reset()
      // After successful creation, let parent close drawer / refresh list
      onSuccess?.()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      toast.open({ message: err.message || 'Failed to submit ticket', severity: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {initialPrefill?.orderReferences?.length ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>
              {initialPrefill.orderReferences.length} linked order
              {initialPrefill.orderReferences.length > 1 ? 's' : ''} will be attached to this
              ticket
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {initialPrefill.orderReferences.map((order) => (
                <Chip
                  key={order.orderId}
                  label={order.awbNumber ? `${order.orderNumber} • ${order.awbNumber}` : order.orderNumber}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Stack>
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="subject"
            control={control}
            rules={{
              required: 'Subject is required',
              minLength: { value: 5, message: 'Subject must be at least 5 characters' },
            }}
            render={({ field, fieldState }) => (
              <CustomInput
                {...field}
                label="Subject"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="category"
            control={control}
            rules={{ required: 'Category is required' }}
            render={({ field, fieldState }) => {
              return (
                <AutocompleteDropdown
                  label="Category"
                  required
                  value={field.value}
                  inputValue={supportCategories?.find((c) => c.key === field.value)?.label ?? ''}
                  onInputChange={() => {}}
                  onChange={(val) => field.onChange(val || '')}
                  options={supportCategories.map((c) => ({
                    key: c.key,
                    label: c.label,
                    description: c.description,
                  }))}
                  helperText={fieldState.error?.message}
                />
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="subcategory"
            control={control}
            rules={{ required: 'Subcategory is required' }}
            render={({ field, fieldState }) => (
              <AutocompleteDropdown
                label="Subcategory"
                required
                value={field.value}
                inputValue={
                  selectedCategory?.subcategories.find((s) => s.key === field.value)?.label ?? ''
                }
                onInputChange={() => {}}
                onChange={(val) => field.onChange(val)}
                options={
                  selectedCategory?.subcategories.map((s) => ({
                    key: s.key,
                    label: s.label,
                  })) ?? []
                }
                helperText={
                  selectedCategory ? fieldState.error?.message : 'Select a category first'
                }
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="awbNumber"
            control={control}
            rules={{
              pattern: {
                value: /^[a-zA-Z0-9-]{5,30}$/,
                message: 'Invalid AWB format',
              },
            }}
            render={({ field, fieldState }) => (
              <CustomInput
                {...field}
                label="AWB Number (Optional)"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="description"
            control={control}
            rules={{
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description should be at least 10 characters',
              },
            }}
            render={({ field, fieldState }) => (
              <CustomInput
                {...field}
                label="Description"
                multiline
                rows={4}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="attachments"
            control={control}
            render={({ field }) => (
              <FileUploader
                label="Attachments (Max 5 files, 2MB each)"
                multiple
                variant="dnd"
                onUploaded={(files) => {
                  field.onChange(files)
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={1.25}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || uploading}
            >
              {uploading ? 'Uploading...' : 'Submit Ticket'}
            </Button>
            {onCancel ? (
              <Button type="button" variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
