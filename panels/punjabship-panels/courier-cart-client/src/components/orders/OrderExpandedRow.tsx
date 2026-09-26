import { alpha, Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import { useState } from 'react'
import { FaFilePdf } from 'react-icons/fa'
import {
  MdInventory2,
  MdLocalShipping,
  MdLocationOn,
  MdPerson,
  MdReceipt,
  MdShoppingBag,
} from 'react-icons/md'
import useEmployeePermissions from '../../hooks/User/useEmployeePermissions'
import { usePresignedDownloadMutation } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { downloadBulkOrderDocumentsZip } from '../../api/order.service'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import AWBLink from '../UI/AWBLink'
import { toast } from '../UI/Toast'
import { getArchiveFileNameFromHeaders } from './bulkActionUtils'

interface OrderExpandedRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any
  type?: 'b2b' | 'b2c'
}

export const OrderExpandedRow = ({ row, type = 'b2c' }: OrderExpandedRowProps) => {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const ACCENT = '#0877C9'
  const sortCodeValue = String(row?.sort_code || '').trim()
  const { canExportOrders, canViewCustomerDetails } = useEmployeePermissions()

  const { mutateAsync, isPending } = usePresignedDownloadMutation()

  const maskedPhone = row?.buyer_phone ? 'Hidden by access policy' : 'Not available'
  const maskedAddress = 'Customer address is hidden for this employee account.'

  const getFriendlyMissingMessage = (fileType: 'label' | 'invoice' | 'manifest') =>
    `${
      fileType === 'label' ? 'Label' : fileType === 'invoice' ? 'Invoice' : 'Manifest'
    } is not available yet. Please try again in a few minutes or regenerate it if needed.`

  const handleDownload = async (
    key: string,
    fileType: 'label' | 'invoice' | 'manifest' = 'label',
  ) => {
    if (!canExportOrders) {
      toast.open({
        message: 'You do not have permission to download shipment documents.',
        severity: 'error',
      })
      return
    }

    try {
      setDownloadingKey(key)

      if (isEmbeddedShopifyContext() && row?.id) {
        const { blob, headers } = await downloadBulkOrderDocumentsZip([row.id], fileType)
        const fileName = getArchiveFileNameFromHeaders(
          headers,
          `punjabship-${fileType}-${String(row?.order_number || row.id)}.${fileType === 'label' ? 'pdf' : 'zip'}`,
        )
        saveAs(blob, fileName)
        return
      }

      const urls = await mutateAsync({ keys: [key] })
      const url = Array.isArray(urls) ? urls[0] : urls

      if (!url) {
        toast.open({
          message: getFriendlyMissingMessage(fileType),
          severity: 'error',
        })
        return
      }

      const link = document.createElement('a')
      link.href = url
      link.download = key.split('/').pop() ?? ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: unknown) {
      if (!isEmbeddedShopifyContext()) console.error('Download failed', err)
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to download file'
      toast.open({
        message:
          errorMessage.includes('not found') || errorMessage.includes('404')
            ? getFriendlyMissingMessage(fileType)
            : `Failed to download ${fileType}: ${errorMessage}`,
        severity: 'error',
      })
    } finally {
      setDownloadingKey(null)
    }
  }

  const handleDirectDownload = async (
    url: string,
    fileType: 'label' | 'invoice' | 'manifest' = 'label',
    stateKey = `${fileType}-direct`,
  ) => {
    if (!canExportOrders) {
      toast.open({
        message: 'You do not have permission to download shipment documents.',
        severity: 'error',
      })
      return
    }

    try {
      setDownloadingKey(stateKey)
      if (isEmbeddedShopifyContext() && row?.id) {
        const { blob, headers } = await downloadBulkOrderDocumentsZip([row.id], fileType)
        const fileName = getArchiveFileNameFromHeaders(
          headers,
          `punjabship-${fileType}-${String(row?.order_number || row.id)}.${fileType === 'label' ? 'pdf' : 'zip'}`,
        )
        saveAs(blob, fileName)
        return
      }

      // Validate URL before attempting download
      if (!url || !url.startsWith('http')) {
        toast.open({
          message: `Invalid ${fileType} URL`,
          severity: 'error',
        })
        return
      }

      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.download = url.split('/').pop() ?? ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      if (!isEmbeddedShopifyContext()) console.error('Direct download failed', error)
      toast.open({
        message: `Failed to open ${fileType}`,
        severity: 'error',
      })
    } finally {
      setDownloadingKey(null)
    }
  }

  // Actions (cancel/reverse) are rendered in the table Actions column now

  const renderDocAction = ({
    title,
    keyValue,
    urlValue,
    type,
  }: {
    title: string
    keyValue?: string
    urlValue?: string
    type: 'label' | 'invoice' | 'manifest'
  }) => {
    if (!keyValue && !urlValue) return null
    const downloadStateKey = keyValue || `${type}-direct`
    const isDownloading = downloadingKey === downloadStateKey

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="flex-start" gap={1.25}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FaFilePdf size={16} color={ACCENT} />
            <Typography fontWeight={600} fontSize={13}>
              {title}
            </Typography>
            {sortCodeValue && type === 'label' && (
              <Chip
                size="small"
                variant="outlined"
                label={`Sort Code: ${sortCodeValue}`}
                sx={{ fontSize: 11, borderColor: alpha(ACCENT, 0.3), color: ACCENT }}
              />
            )}
          </Stack>

          <Button
            size="small"
            variant="outlined"
            sx={{ minWidth: 0, px: 1.25, py: 0.25, textTransform: 'none' }}
            onClick={() => {
              if (keyValue) {
                handleDownload(keyValue, type)
                return
              }
              if (urlValue && /^https?:\/\//i.test(urlValue)) {
                void handleDirectDownload(urlValue, type, downloadStateKey)
                return
              }
              toast.open({
                message: `${title} not available yet.`,
                severity: 'error',
              })
            }}
            disabled={Boolean((isDownloading || isPending) && !urlValue)}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack spacing={2} p={1.5}>
      <Typography fontWeight={700} fontSize={16}>
        Order Details
      </Typography>
      <Divider />

      {/* Customer Info */}
      <Stack direction="row" spacing={1} alignItems="center">
        <MdPerson size={20} />
        <Typography>
          <strong>Customer:</strong> {row.buyer_name}{' '}
          ({canViewCustomerDetails ? row.buyer_phone : maskedPhone})
        </Typography>
      </Stack>

      {/* Address */}
      <Stack direction="row" spacing={1} alignItems="center">
        <MdLocationOn size={20} />
        <Typography>
          <strong>Address:</strong>{' '}
          {canViewCustomerDetails
            ? `${row.address}, ${row.city}, ${row.state} - ${row.pincode}`
            : maskedAddress}
        </Typography>
      </Stack>

      {/* Products */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <MdShoppingBag size={20} style={{ marginTop: 4 }} />
        <Stack spacing={0.5}>
          <Typography fontWeight={500}>Products:</Typography>
          {row.products?.map(
            (
              p: {
                name: string
                qty: number
                price: string
                box_name?: string
                height?: string
                length?: string
                breadth?: string
              },
              i: number,
            ) =>
              type === 'b2c' ? (
                <Typography key={i} fontSize={13}>
                  {p?.name} x {p?.qty} - ₹{p?.price}
                </Typography>
              ) : (
                <Stack>
                  <Typography key={i} fontSize={13}>
                    {p?.box_name}
                  </Typography>
                  <Typography key={i} fontSize={13}>
                    {p?.length} x {p?.height} x {p?.breadth}
                  </Typography>
                </Stack>
              ),
          )}
        </Stack>
      </Stack>

      {/* Pickup */}
      <Stack direction="row" spacing={1} alignItems="center">
        <MdLocalShipping size={20} />
        <Typography>
          <strong>Pickup Location:</strong> {row?.pickup_details?.name},{' '}
          {row?.pickup_details?.address}, {row?.pickup_details?.city} -{' '}
          {row?.pickup_details?.pincode}
        </Typography>
      </Stack>

      {/* AWB & Courier */}
      <Stack direction="row" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MdReceipt size={20} />
          <Typography>
            <strong>AWB:</strong> <AWBLink awb={row.awb_number} />
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <MdLocalShipping size={20} />
          <Typography>
            <strong>Courier:</strong> {row.courier_partner}
          </Typography>
        </Stack>
      </Stack>

      {sortCodeValue && (
        <Stack direction="row" spacing={1} alignItems="center">
          <MdInventory2 size={20} />
          <Typography>
            <strong>Sort Code:</strong>{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {sortCodeValue}
            </Box>
          </Typography>
        </Stack>
      )}

      {(String(row?.order_status || '').toLowerCase() === 'manifest_failed' ||
        (String(row?.manifest || '').trim().length > 0 &&
          String(row?.manifest_error || '').trim().length > 0)) && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border:
              String(row?.order_status || '').toLowerCase() === 'manifest_failed'
                ? '1px solid rgba(211, 47, 47, 0.18)'
                : '1px solid rgba(245, 158, 11, 0.24)',
            backgroundColor:
              String(row?.order_status || '').toLowerCase() === 'manifest_failed'
                ? '#FFF7F7'
                : '#FFF9ED',
          }}
        >
          <Stack spacing={0.75}>
            <Typography
              fontWeight={700}
              color={
                String(row?.order_status || '').toLowerCase() === 'manifest_failed'
                  ? 'error.main'
                  : 'warning.main'
              }
            >
              {String(row?.order_status || '').toLowerCase() === 'manifest_failed'
                ? 'Manifest failed'
                : 'Manifest warning'}
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              {row?.manifest_error || 'The courier rejected the manifest request.'}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Retry attempts: {Number(row?.manifest_retry_count ?? 0)}/3
              {row?.manifest_last_retry_at
                ? ` • Last retry: ${new Date(row.manifest_last_retry_at).toLocaleString()}`
                : ''}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Documents */}
      {canExportOrders &&
        (row.label ||
          row.label_url ||
          row.label_key ||
          row.manifest ||
          row.manifest_url ||
          row.manifest_key ||
          row.invoice_link ||
          row.invoice_url ||
          row.invoice_key) && (
        <Paper
          elevation={0}
          sx={{
            mt: 0.5,
            p: 2,
            borderRadius: 2.5,
            border: `1px solid ${alpha(ACCENT, 0.16)}`,
            backgroundColor: alpha(ACCENT, 0.03),
          }}
        >
          <Typography fontWeight={700} fontSize={14} mb={1.25}>
            Documents
          </Typography>
          <Stack spacing={1}>
            {renderDocAction({
              title: 'Label',
              keyValue: row.label_key || row.label,
              urlValue: row.label_url && /^https?:\/\//i.test(row.label_url) ? row.label_url : undefined,
              type: 'label',
            })}

            {renderDocAction({
              title: 'Manifest',
              keyValue: row.manifest_key || row.manifest,
              urlValue:
                row.manifest_url && /^https?:\/\//i.test(row.manifest_url) ? row.manifest_url : undefined,
              type: 'manifest',
            })}

            {renderDocAction({
              title: 'Invoice',
              keyValue: row.invoice_key || row.invoice_link,
              urlValue: row.invoice_url && /^https?:\/\//i.test(row.invoice_url) ? row.invoice_url : undefined,
              type: 'invoice',
            })}
          </Stack>
        </Paper>
      )}

      {/* Actions moved to Actions column in list */}
    </Stack>
  )
}
