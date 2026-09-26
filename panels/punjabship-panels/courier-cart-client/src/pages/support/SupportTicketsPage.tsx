import { Box, Skeleton, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { FiMail, FiPlus } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SupportTicketPrefill } from '../../api/support.api'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { SupportTicketForm } from '../../components/support/SupportTicketForm'
import SupportTicketList from '../../components/support/SupportTicketList'
import TicketStatusSummaryCard from '../../components/support/TicketStatusSummaryCard'
import { useMyTickets } from '../../hooks/User/useSupport'

const supportTicketFilterFields: FilterField[] = [
  {
    name: 'sortBy',
    label: 'Sort By',
    type: 'select',
    options: [
      { label: 'Latest First', value: 'latest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Due Soon', value: 'dueSoon' },
      { label: 'Due Latest', value: 'dueLatest' },
    ],
    placeholder: 'Select sort order',
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    placeholder: 'Search by subject',
  },
  {
    name: 'awbNumber',
    label: 'AWB Number',
    type: 'text',
    placeholder: 'Search by AWB',
    isAdvanced: true,
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Shipment Issues', value: 'shipment_issues' },
      { label: 'AWB & Label Issues', value: 'awb_issues' },
      { label: 'Payments & Refunds', value: 'payment_refund' },
      { label: 'Courier Partner Issues', value: 'courier_partner' },
      { label: 'Returns & RTOs', value: 'returns_rto' },
      { label: 'KYC & Onboarding', value: 'kyc_onboarding' },
      { label: 'Platform Issues', value: 'platform_issue' },
      { label: 'Other / General Query', value: 'other' },
    ],
    placeholder: 'Select category',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Open', value: 'open' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Closed', value: 'closed' },
    ],
    placeholder: 'Select status',
    isAdvanced: true,
  },
  {
    name: 'subcategory',
    label: 'Subcategory',
    type: 'text',
    isAdvanced: true,
    placeholder: 'Search by subcategory',
  },
]

const initialFilterValues = {
  sortBy: 'latest',
  subject: '',
  awbNumber: '',
  category: '',
  status: '',
  subcategory: '',
}

export const SupportTicketsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState(initialFilterValues)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [ticketPrefill, setTicketPrefill] = useState<SupportTicketPrefill | null>(null)

  const routePrefill = useMemo(
    () =>
      (location.state as { ticketPrefill?: SupportTicketPrefill } | null)?.ticketPrefill ?? null,
    [location.state],
  )

  useEffect(() => {
    if (!routePrefill) return

    setTicketPrefill(routePrefill)
    setDrawerOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, navigate, routePrefill])

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTicketPrefill(null)
  }

  const { data: tickets, isLoading } = useMyTickets({
    page,
    limit: rowsPerPage,
    filters: filters,
  })

  const appliedCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sortBy' && Boolean(value),
  ).length

  const controls = (
    <Box sx={{ px: 2 }}>
      <FilterBar
        fields={supportTicketFilterFields}
        defaultValues={initialFilterValues}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setPage(0)
        }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={appliedCount}
      />
    </Box>
  )

  const summaryCard = isLoading ? (
    <Skeleton />
  ) : (
    <TicketStatusSummaryCard
      counts={tickets?.statusCounts ?? { closed: 0, in_progress: 0, open: 0, resolved: 0 }}
    />
  )

  const list = (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <SupportTicketList
          rows={tickets?.data ?? []}
          currentPage={page}
          rowsPerPage={rowsPerPage}
          totalCount={tickets?.totalCount ?? 0}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows)
            setPage(1)
          }}
        />
      )}
    </>
  )

  return (
    <>
      <ListPageLayout
        title="Support Tickets"
        description="Manage your support requests and track resolutions"
        actions={[
          {
            label: 'Create Ticket',
            onClick: () => setDrawerOpen(true),
            icon: <FiPlus />,
            variant: 'contained',
          },
          {
            label: 'Email Support',
            onClick: () =>
              (window.location.href =
                'mailto:info@punjabshiplogistics.com?subject=PunjabShip%20Support%20Request'),
            icon: <FiMail />,
            variant: 'outlined',
          },
        ]}
        controls={controls}
      >
        <Box sx={{ px: 2, mb: 2 }}>{summaryCard}</Box>
        {list}
      </ListPageLayout>

      <CustomDrawer
        title="Create Support Ticket"
        open={drawerOpen}
        width={1100}
        onClose={closeDrawer}
        anchor="right"
      >
        <Stack sx={{ color: '#fff', p: 2 }} gap={2}>
          <SupportTicketForm
            onSuccess={() => {
              closeDrawer()
            }}
            onCancel={closeDrawer}
            initialPrefill={ticketPrefill}
          />
        </Stack>
      </CustomDrawer>
    </>
  )
}
