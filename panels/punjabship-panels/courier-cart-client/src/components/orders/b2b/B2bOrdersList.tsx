import { Button, Link, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReactNode } from 'react'
import moment from 'moment'
import { useB2BOrdersByUser, useGenerateManifest } from '../../../hooks/Orders/useOrders'
import type { B2BOrder } from '../../../types/generic.types'
import {
  getOrderCourierDisplayName,
  getOrderSourceChipStatus,
  getOrderSourceLabel,
} from '../../../utils/orderSource'
import StatusChip from '../../UI/chip/StatusChip'
import DataTable, { type Column } from '../../UI/table/DataTable'
import AWBLink from '../../UI/AWBLink'
import TableSkeleton from '../../UI/table/TableSkeleton'
import { OrderExpandedRow } from '../OrderExpandedRow'
import ShipmentTrackingDialog from '../ShipmentTrackingDialog'

export const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  delivered: 'success',
  processing: 'pending',
  cancelled: 'error',
  pending: 'info',
  shipment_booked: 'info',
  manifest_generated: 'success',
}

interface B2BOrdersListProps {
  page: number
  rowsPerPage: number
  setPage: (page: number) => void
  setRowsPerPage: (rows: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any
}

const getCourierDisplayName = (order: B2BOrder) =>
  getOrderCourierDisplayName({
    ...order,
    courier_partner: order.courier_partner,
  }) || '-'

const B2BOrdersList = ({
  page,
  rowsPerPage,
  setPage,
  setRowsPerPage,
  filters,
}: B2BOrdersListProps) => {
  const { data, isLoading, isFetching, isError } = useB2BOrdersByUser(
    page,
    rowsPerPage,
    filters,
  )
  const { mutate: triggerManifest, isPending: isGeneratingManifest } = useGenerateManifest()
  const [manifestingAwb, setManifestingAwb] = useState<string | null>(null)
  const [trackingAwb, setTrackingAwb] = useState<string | null>(null)

  const handleGenerateManifest = (order: B2BOrder) => {
    if (!order.awb_number) return
    setManifestingAwb(order.awb_number)
    triggerManifest(
      { awbs: [order.awb_number], type: 'b2b' },
      {
        onSettled: () => {
          setManifestingAwb((current) => (current === order.awb_number ? null : current))
        },
      },
    )
  }

  const columns: Column<B2BOrder>[] = [
    {
      label: 'Source',
      id: 'source',
      render: (_, row) => (
        <StatusChip
          label={getOrderSourceLabel(row)}
          status={getOrderSourceChipStatus(row)}
        />
      ),
    },
    { label: 'Order #', id: 'order_number' },
    {
      label: 'AWB',
      id: 'awb_number',
      render: (value) => value ? <AWBLink awb={String(value)} compact /> : '-',
    },
    { label: 'Buyer', id: 'buyer_name' },
    { label: 'Amount', id: 'order_amount', render: (v) => `₹${Number(v)?.toFixed(2)}` },
    {
      label: 'Courier',
      id: 'courier_partner',
      minWidth: 170,
      render: (_value, row) => getCourierDisplayName(row),
    },
    {
      label: 'Status',
      id: 'order_status',
      render: (v) => <StatusChip label={v} status={statusColorMap[v] || 'info'} />,
    },
    { label: 'Order Date', id: 'order_date', render: (v) => moment(v).format('DD MMM YYYY') },
    { label: 'Last Updated', id: 'updated_at', render: (v) => moment(v).format('DD MMM YYYY') },
    {
      label: 'Actions',
      id: 'id',
      showCellTooltip: false,
      render: (_, row) => {
        const courierText = (row.courier_partner || '').toLowerCase()
        const integrationText = (((row as any).integration_type as string) || '').toLowerCase()
        const isXpressbees =
          integrationText === 'xpressbees' || courierText.includes('xpressbees')
        const isEkart = integrationText === 'ekart' || courierText.includes('ekart')

        const canManifest = !!row.awb_number && !row.manifest && (isXpressbees || isEkart)

        const actions: ReactNode[] = []

        if (row.awb_number) {
          actions.push(
            <Button
              key="track"
              size="small"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation()
                setTrackingAwb(row.awb_number || null)
              }}
            >
              Track
            </Button>,
          )
        }

        if (canManifest) {
          const isThisManifesting = isGeneratingManifest && manifestingAwb === row.awb_number
          actions.push(
            <Button
              key="manifest"
              size="small"
              variant="contained"
              disabled={isThisManifesting}
              onClick={(e) => {
                e.stopPropagation()
                handleGenerateManifest(row)
              }}
            >
              {isThisManifesting ? 'Manifesting…' : 'Manifest'}
            </Button>,
          )
        }

        if (row.manifest) {
          actions.push(
            <Link
              key="view-manifest"
              href={row.manifest}
              target="_blank"
              rel="noopener"
              underline="hover"
              onClick={(e) => e.stopPropagation()}
            >
              View
            </Link>,
          )
        }

        if (!actions.length) return null

        return <Stack direction="row" spacing={1}>{actions}</Stack>
      },
    },
  ]

  if (isError)
    return (
      <Typography color="error" textAlign="center" py={4}>
        Failed to fetch B2B orders
      </Typography>
    )

  return (
    <Stack spacing={2}>
      {isLoading && !data ? (
        <TableSkeleton title="Loading B2B orders" />
      ) : (
        <DataTable<B2BOrder>
          wrapCells
          rows={data?.orders || []}
          columns={columns}
          title="My B2B Orders"
          loading={isFetching}
          loadingLabel="Updating B2B orders..."
          emptyMessage="No B2B orders match the current filters."
          pagination
          currentPage={page - 1}
          expandable
          renderExpandedRow={(row) => <OrderExpandedRow type="b2b" row={row} />}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(newLimit) => {
            setRowsPerPage(newLimit)
            setPage(1)
          }}
        />
      )}
      <ShipmentTrackingDialog awb={trackingAwb} onClose={() => setTrackingAwb(null)} />
    </Stack>
  )
}

export default B2BOrdersList
