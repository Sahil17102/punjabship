import { Box, Button, Chip, Grid, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import moment from 'moment'
import { useState } from 'react'
import { BiCheckCircle } from 'react-icons/bi'
import { CiEdit } from 'react-icons/ci'
import { useUpdatePickupAddress } from '../../hooks/Pickup/usePickupAddresses'
import type { HydratedPickup } from '../../types/generic.types'
import CustomDrawer from '../UI/drawer/CustomDrawer'
import CustomSwitch from '../UI/inputs/CustomSwitch'
import MapViewer from '../UI/map/MapViewer'
import DataTable, { type Column } from '../UI/table/DataTable'
import AddPickupAddressForm from './AddPickupAddressForm'

interface IPickupAddressListProps {
  listData: HydratedPickup[]
  totalCount: number
  page: number
  rowsPerPage: number
  loading?: boolean
  onPageChange: (page: number) => void
  onRowsPerPageChange: (limit: number) => void
}

const PickupAddressesList = ({
  listData,
  totalCount,
  page,
  rowsPerPage,
  loading = false,
  onPageChange,
  onRowsPerPageChange,
}: IPickupAddressListProps) => {
  const { mutate: updatePickupAddress } = useUpdatePickupAddress()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'))

  let drawerWidth: string | number = '100%'
  if (isXs) drawerWidth = '100%'
  else if (isSm) drawerWidth = '95%'
  else if (isMd) drawerWidth = '95%'
  else if (isLgUp) drawerWidth = 1120

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<HydratedPickup | undefined>(undefined)

  const handleMakePrimary = (id: string) => {
    updatePickupAddress({ id, payload: { isPrimary: true } })
  }

  const handleEdit = (address: HydratedPickup) => {
    setSelectedAddress(address)
    setDrawerOpen(true)
  }

  const handleStatusToggle = (id: string, enabled: boolean) => {
    updatePickupAddress({ id, payload: { isPickupEnabled: enabled } })
  }

  const columns: Column<HydratedPickup>[] = [
    {
      id: 'pickup',
      label: 'Warehouse',
      minWidth: 250,
      render: (_, row) => (
        <Stack spacing={0.55}>
          <Stack direction="row" alignItems="center" gap={0.8} flexWrap="wrap">
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>
              {row.pickup?.addressNickname || 'Unnamed warehouse'}
            </Typography>
            {row.isPrimary ? (
              <Chip
                label="Primary"
                size="small"
                icon={<BiCheckCircle style={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 700,
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#047857',
                  '& .MuiChip-icon': { color: '#047857' },
                }}
              />
            ) : null}
          </Stack>
          <Typography sx={{ fontSize: '0.76rem', color: '#6B7280' }}>
            {row.pickup?.contactName || 'No contact'} • {row.pickup?.contactPhone || 'No phone'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'pickup',
      label: 'Pickup Address',
      minWidth: 290,
      hiddenBelow: 'xl',
      render: (_, row) => (
        <Stack spacing={0.45}>
          <Typography sx={{ fontSize: '0.8rem', color: '#111827' }}>
            {row.pickup?.addressLine1}
            {row.pickup?.addressLine2 ? `, ${row.pickup.addressLine2}` : ''}
            {row.pickup?.landmark ? `, ${row.pickup.landmark}` : ''}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: '#6B7280' }}>
            {row.pickup?.city}, {row.pickup?.state} • {row.pickup?.pincode}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'pickup',
      label: 'Coverage',
      minWidth: 170,
      render: (_, row) => (
        <Stack spacing={0.35}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
            {row.pickup?.city || '-'}, {row.pickup?.state || '-'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: '#6B7280' }}>
            PIN {row.pickup?.pincode || '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'rto',
      label: 'RTO Setup',
      minWidth: 180,
      render: (_, row) => (
        <Stack spacing={0.35}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
            {row.isRTOSame ? 'Same as pickup' : row.rto?.addressNickname || 'Separate RTO'}
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: '#6B7280' }}>
            {row.isRTOSame ? 'Returns use pickup origin' : `${row.rto?.city || '-'}, ${row.rto?.state || '-'}`}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'isPickupEnabled',
      label: 'Status',
      minWidth: 145,
      render: (value, row) => (
        <Stack spacing={0.7} alignItems="flex-start">
          <Chip
            label={value ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              bgcolor: value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.12)',
              color: value ? '#047857' : '#4B5563',
              fontWeight: 700,
            }}
          />
          <CustomSwitch
            onChange={(event) => handleStatusToggle(row.pickupId, event?.target?.checked)}
            checked={Boolean(value)}
          />
        </Stack>
      ),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      minWidth: 160,
      hiddenBelow: 'lg',
      render: (value) => (
        <Typography sx={{ fontSize: '0.78rem', color: '#6B7280' }}>
          {moment(String(value)).format('DD MMM YYYY, hh:mm A')}
        </Typography>
      ),
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 180,
      align: 'right',
      showCellTooltip: false,
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          {!row.isPrimary ? (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleMakePrimary(row.pickupId)}
              sx={{ textTransform: 'none', fontSize: '0.76rem' }}
            >
              Make Primary
            </Button>
          ) : null}
          <Button
            size="small"
            variant="contained"
            onClick={() => handleEdit(row)}
            startIcon={<CiEdit />}
            sx={{ textTransform: 'none', fontSize: '0.76rem', boxShadow: 'none' }}
          >
            Edit
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <>
      <DataTable<HydratedPickup>
        rows={listData}
        columns={columns}
        title="Pickup Warehouse Directory"
        subTitle="Search, activate, promote, and edit warehouse origins without leaving the table."
        maxHeight={560}
        loading={loading}
        loadingLabel="Updating warehouse list..."
        emptyMessage="No pickup addresses match the current filters."
        pagination
        currentPage={page}
        defaultRowsPerPage={rowsPerPage}
        expandable
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        renderExpandedRow={(row) => (
          <Box mt={1} mb={1}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="subtitle2" mb={1} fontWeight={800}>
                  Pickup Origin Details
                </Typography>
              </Grid>

              {row.pickup?.contactName ? (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={12} color="text.secondary">Contact Name</Typography>
                  <Typography fontWeight={600} fontSize={13}>{row.pickup.contactName}</Typography>
                </Grid>
              ) : null}
              {row.pickup?.contactPhone ? (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={12} color="text.secondary">Contact Phone</Typography>
                  <Typography fontWeight={600} fontSize={13}>{row.pickup.contactPhone}</Typography>
                </Grid>
              ) : null}
              {row.pickup?.contactEmail ? (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={12} color="text.secondary">Contact Email</Typography>
                  <Typography fontWeight={600} fontSize={13}>{row.pickup.contactEmail}</Typography>
                </Grid>
              ) : null}
              {row.pickup?.addressLine1 ? (
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography fontSize={12} color="text.secondary">Address</Typography>
                  <Typography fontWeight={600} fontSize={13}>
                    {row.pickup.addressLine1}
                    {row.pickup.addressLine2 ? `, ${row.pickup.addressLine2}` : ''}
                    {row.pickup.landmark ? `, ${row.pickup.landmark}` : ''}
                  </Typography>
                </Grid>
              ) : null}
              {row.pickup?.gstNumber ? (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography fontSize={12} color="text.secondary">GST Number</Typography>
                  <Typography fontWeight={600} fontSize={13}>{row.pickup.gstNumber}</Typography>
                </Grid>
              ) : null}

              {row.pickup?.latitude && row.pickup?.longitude ? (
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography fontSize={13} mb={1.2} fontWeight={700}>
                    Pickup Map
                  </Typography>
                  <MapViewer
                    coords={{
                      lat: parseFloat(String(row.pickup.latitude)),
                      lng: parseFloat(String(row.pickup.longitude)),
                    }}
                    currentLocation={false}
                    draggable={false}
                    setCoords={() => {}}
                    height="160px"
                    width="100%"
                    zoom={15}
                  />
                </Grid>
              ) : null}

              {row.rto ? (
                <>
                  <Grid size={12}>
                    <Typography variant="subtitle2" mt={2} mb={1} fontWeight={800}>
                      RTO Details
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography fontSize={12} color="text.secondary">RTO Warehouse</Typography>
                    <Typography fontWeight={600} fontSize={13}>
                      {row.rto.addressNickname || 'Separate RTO'}
                    </Typography>
                  </Grid>
                  {row.rto.contactName ? (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography fontSize={12} color="text.secondary">RTO Contact</Typography>
                      <Typography fontWeight={600} fontSize={13}>{row.rto.contactName}</Typography>
                    </Grid>
                  ) : null}
                  {row.rto.contactPhone ? (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography fontSize={12} color="text.secondary">RTO Phone</Typography>
                      <Typography fontWeight={600} fontSize={13}>{row.rto.contactPhone}</Typography>
                    </Grid>
                  ) : null}
                </>
              ) : null}

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography fontSize={12} color="text.secondary">Last Updated</Typography>
                <Typography fontWeight={600} fontSize={13}>
                  {moment(row.updatedAt).format('DD MMM YYYY, hh:mm A')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      />

      <CustomDrawer
        width={drawerWidth}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedAddress(undefined)
        }}
        title={selectedAddress ? 'Edit Pickup Address' : 'Add New Pickup Address'}
      >
        <AddPickupAddressForm
          key={selectedAddress?.id ?? 'new'}
          setDrawer={setDrawerOpen}
          initialData={selectedAddress}
        />
      </CustomDrawer>
    </>
  )
}

export default PickupAddressesList
