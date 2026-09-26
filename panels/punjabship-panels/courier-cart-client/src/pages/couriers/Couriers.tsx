import { Box } from '@mui/material'
import { useState } from 'react'
import AdminPageShell from '../../components/admin/AdminPageShell'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import CourierList from '../../components/integrations/couriers/CourierList'
import CourierSummaryCard from '../../components/integrations/couriers/CourierSummaryCard'
import { useCouriers } from '../../hooks/Integrations/useCouriers'

const filterFields: FilterField[] = [
  {
    name: 'sortBy',
    label: 'Sort By',
    type: 'select',
    options: [
      { label: 'Latest Added', value: 'latest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Name (A-Z)', value: 'az' },
      { label: 'Name (Z-A)', value: 'za' },
    ],
    placeholder: 'Select sort order',
  },
  {
    name: 'name',
    label: 'Courier Name',
    type: 'text',
    placeholder: 'Search by name',
  },
  {
    name: 'masterCompany',
    label: 'Master Company',
    type: 'text',
    placeholder: 'Search by company',
  },
  {
    name: 'isHyperlocal',
    label: 'Hyperlocal',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    name: 'podAvailable',
    label: 'POD Available',
    type: 'select',
    isAdvanced: true,
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    name: 'realtimeTracking',
    label: 'Tracking Type',
    type: 'text',
    isAdvanced: true,
    placeholder: 'e.g., API, Manual',
  },
]

const initialFilterValues = {
  sortBy: '',
  name: '',
  masterCompany: '',
  isHyperlocal: '',
  podAvailable: '',
  realtimeTracking: '',
}

const Couriers = () => {
  const [filters, setFilters] = useState(initialFilterValues)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data, isLoading } = useCouriers({
    page,
    limit: rowsPerPage,
    filters,
  })

  const summary = data?.summary ?? {
    pickupPincodesCount: 0,
    serviceablePincodesCount: 0,
    totalCourierCount: 0,
    totalOdaCount: 0,
    totalRtoCount: 0,
  }

  const appliedCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sortBy' && Boolean(value),
  ).length

  return (
    <AdminPageShell
      title="Courier master console"
      badge="Partners"
      description="Review courier coverage, master company mapping, hyperlocal readiness, and serviceability-level metadata from one structured admin view."
      metrics={[
        { label: 'Courier count', value: String(summary.totalCourierCount), hint: 'Integrated partners in the workspace' },
        { label: 'Serviceable PINs', value: String(summary.serviceablePincodesCount), hint: 'Coverage currently available' },
        { label: 'Pickup PINs', value: String(summary.pickupPincodesCount), hint: 'Origin serviceability footprint' },
      ]}
    >
      <ListPageLayout
        title="Courier Partners"
        description="Review courier coverage, master company mapping, and serviceability metadata"
      >
        <Box sx={{ px: 2, mb: 2 }}>
          <CourierSummaryCard summary={summary} />
        </Box>

        <Box sx={{ px: 2, mb: 2 }}>
          <FilterBar
            fields={filterFields}
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

        <CourierList
          loading={isLoading}
          couriers={data?.couriers ?? []}
          totalCount={data?.totalCount ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </ListPageLayout>
    </AdminPageShell>
  )
}

export default Couriers
