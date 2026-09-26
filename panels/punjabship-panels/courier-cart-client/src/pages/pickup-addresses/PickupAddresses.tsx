import { Box, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { BiDownload, BiUpload } from 'react-icons/bi'
import { FiPlus } from 'react-icons/fi'
import AdminPageShell from '../../components/admin/AdminPageShell'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import AddPickupAddressForm from '../../components/pickups/AddPickupAddressForm'
import ExportConfirmDialog from '../../components/pickups/ExportConfirmDialog'
import PickupAddressesList from '../../components/pickups/PickupAddressesList'
import UploadPickupCSVModal from '../../components/pickups/UploadPickupCSV'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { toast } from '../../components/UI/Toast'
import {
  useExportPickupAddresses,
  useImportPickupAddresses,
  usePickupAddresses,
} from '../../hooks/Pickup/usePickupAddresses'
import type { HydratedPickup } from '../../types/generic.types'

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
  },
  {
    name: 'name',
    label: 'Warehouse Name',
    type: 'text',
    placeholder: 'Search warehouse',
  },
  {
    name: 'isPrimary',
    label: 'Primary',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    name: 'isPickupEnabled',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    name: 'city',
    label: 'City',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search city',
  },
  {
    name: 'state',
    label: 'State',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search state',
  },
  {
    name: 'pincode',
    label: 'Pincode',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search pincode',
  },
]

const initialFilterValues = {
  name: '',
  city: '',
  state: '',
  pincode: '',
  sortBy: 'latest',
  isPickupEnabled: '',
  isPrimary: '',
}

const PickupAddresses = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilterValues)

  const { mutate: exportAddresses, isPending: isExporting } = useExportPickupAddresses()
  const { mutateAsync: importAddresses, isPending: isImporting } = useImportPickupAddresses()
  const { data, isLoading, isFetching, isError } = usePickupAddresses({
    ...(filters as any),
    page: page + 1,
    limit: rowsPerPage,
  })

  const pickupAddresses = data?.pickupAddresses ?? []
  const totalCount = data?.totalCount ?? 0

  const appliedFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([, value]) => value !== '' && value !== undefined && value !== null && value !== 'latest',
      ).length,
    [filters],
  )

  const handleFilterApply = (nextFilters: Partial<HydratedPickup>) => {
    setFilters({ ...initialFilterValues, ...nextFilters })
    setPage(0)
  }

  const handleOpenAddDrawer = () => {
    setDrawerOpen(true)
  }

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  const handleExport = () => {
    setShowExportConfirm(true)
  }

  const confirmImport = (csvRows: HydratedPickup[]) => {
    importAddresses(csvRows, {
      onSuccess: () => {
        toast.open({ message: 'Pickup addresses imported successfully.', severity: 'success' })
        queryClient.invalidateQueries({ queryKey: ['pickupAddresses'] })
        setImportDialogOpen(false)
      },
      onError: () => {
        toast.open({ message: 'Failed to import pickup addresses.', severity: 'error' })
      },
    })
  }

  const confirmExport = () => {
    setShowExportConfirm(false)
    exportAddresses(
      { ...(filters as any), page: undefined, limit: undefined },
      {
        onSuccess: () => {
          toast.open({ message: 'Pickup addresses exported successfully.', severity: 'success' })
        },
        onError: () => {
          toast.open({ message: 'Failed to export pickup addresses.', severity: 'error' })
        },
      },
    )
  }

  if (isError) {
    return (
      <Typography color="error" textAlign="center" mt={4}>
        Failed to load pickup addresses.
      </Typography>
    )
  }

  return (
    <AdminPageShell
      title="Manage Pickup Addresses"
      badge="Warehouses"
    >
      <ListPageLayout
        title="Pickups"
        description=""
        actions={[
          {
            label: 'Add Pickup',
            onClick: handleOpenAddDrawer,
            icon: <FiPlus size={18} />,
            variant: 'contained',
          },
          {
            label: isImporting ? 'Importing...' : 'Import CSV',
            onClick: handleImport,
            icon: <BiUpload />,
            variant: 'outlined',
          },
          {
            label: isExporting ? 'Exporting...' : 'Export CSV',
            onClick: handleExport,
            icon: <BiDownload />,
            variant: 'outlined',
          },
        ]}
        controls={
          <Box sx={{ px: { xs: 0, md: 2 } }}>
            <FilterBar<Partial<HydratedPickup>>
              fields={filterFields}
              defaultValues={initialFilterValues as unknown as Partial<HydratedPickup>}
              onApply={handleFilterApply}
              mode="button"
              buttonLabel="Filter Warehouses"
              appliedCount={appliedFilterCount}
              loading={isLoading}
            />
          </Box>
        }
      >
        <Stack spacing={2}>

          {isLoading && !data ? (
            <TableSkeleton title="Loading pickup addresses" />
          ) : (
            <PickupAddressesList
              listData={pickupAddresses}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={isFetching}
              onPageChange={setPage}
              onRowsPerPageChange={(limit) => {
                setRowsPerPage(limit)
                setPage(0)
              }}
            />
          )}
        </Stack>
      </ListPageLayout>

      <ExportConfirmDialog
        open={showExportConfirm}
        onConfirm={confirmExport}
        filterCount={appliedFilterCount}
        onClose={() => setShowExportConfirm(false)}
      />

      <UploadPickupCSVModal
        onClose={() => setImportDialogOpen(false)}
        onConfirm={confirmImport}
        open={importDialogOpen}
        loading={isImporting}
      />

      <CustomDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={isMobile ? '100%' : 1100}
        anchor="right"
        title="Add New Pickup Address"
      >
        <AddPickupAddressForm setDrawer={setDrawerOpen} />
      </CustomDrawer>
    </AdminPageShell>
  )
}

export default PickupAddresses
