import { Box, ButtonBase, Typography } from '@mui/material'

export type ShipmentStage = { label: string; value: string; statuses?: string[] }
export type ShipmentStageGroup = { label: string; stages: ShipmentStage[] }

export const b2cShipmentStageGroups: ShipmentStageGroup[] = [
  {
    label: 'Shipment Booking',
    stages: [
      { label: 'New', value: 'pending', statuses: ['pending', 'new', 'draft'] },
      { label: 'Courier Assigned', value: 'booked', statuses: ['booked', 'shipment_created'] },
      { label: 'Pickup & Manifest', value: 'pickup_initiated', statuses: ['pickup_initiated', 'picked_up', 'pickup_scheduled', 'manifested'] },
      { label: 'Manifest Failed', value: 'manifest_failed' },
    ],
  },
  {
    label: 'Shipment Journey',
    stages: [
      { label: 'In Transit', value: 'in_transit' },
      { label: 'Out For Delivery', value: 'out_for_delivery' },
      { label: 'Delivered', value: 'delivered', statuses: ['delivered', 'ndr_delivered'] },
    ],
  },
  {
    label: 'NDR Exceptions',
    stages: [
      { label: 'NDR', value: 'ndr', statuses: ['ndr', 'undelivered'] },
      { label: 'RTO In-Transit', value: 'rto_in_transit', statuses: ['rto', 'rto_in_transit'] },
      { label: 'RTO Delivered', value: 'rto_delivered' },
    ],
  },
  {
    label: 'Records',
    stages: [
      { label: 'All', value: '', statuses: ['all'] },
      { label: 'Cancelled', value: 'cancelled', statuses: ['cancelled', 'cancellation_requested'] },
    ],
  },
]

export const b2bShipmentStageGroups = b2cShipmentStageGroups

interface ShipmentStageFilterProps {
  value: string
  onChange: (value: string) => void
  groups?: ShipmentStageGroup[]
  ariaLabel?: string
  counts?: Record<string, number>
}

const ShipmentStageFilter = ({
  value,
  onChange,
  groups = b2cShipmentStageGroups,
  ariaLabel = 'Shipment stage',
  counts = {},
}: ShipmentStageFilterProps) => (
  <Box
    role="group"
    aria-label={ariaLabel}
    sx={{
      width: '100%',
      overflowX: 'auto',
      overflowY: 'hidden',
      pb: 0.5,
      scrollbarWidth: 'thin',
      '&::-webkit-scrollbar': { height: 4 },
      '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, minWidth: 'max-content' }}>
      {groups.map((group) => (
        <Box key={group.label}>
          <Typography
            sx={{
              mb: 0.45,
              pl: 0.25,
              color: '#64748B',
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: 0,
            }}
          >
            {group.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            {group.stages.map((stage, index) => {
              const selected = value === stage.value
              const stageStatuses = stage.statuses || [stage.value]
              const count = stageStatuses.reduce(
                (total, status) => total + Number(counts[status] || 0),
                0,
              )
              const first = index === 0
              const last = index === group.stages.length - 1

              return (
                <ButtonBase
                  key={`${group.label}-${stage.value}`}
                  aria-pressed={selected}
                  onClick={() => onChange(stage.value)}
                  sx={{
                    minHeight: 36,
                    minWidth: 68,
                    px: 1.35,
                    py: 0.65,
                    ml: first ? 0 : '-1px',
                    border: '1px solid',
                    borderColor: selected ? '#0877C9' : '#D8E0E9',
                    borderRadius: first && last ? '7px' : first ? '7px 0 0 7px' : last ? '0 7px 7px 0' : 0,
                    bgcolor: selected ? '#0877C9' : '#FFFFFF',
                    color: selected ? '#FFFFFF' : '#2A3547',
                    fontSize: '11px',
                    fontWeight: selected ? 700 : 500,
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                    zIndex: selected ? 1 : 0,
                    transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
                    '&:hover': {
                      bgcolor: selected ? '#5940DE' : '#F7F5FF',
                      borderColor: selected ? '#5940DE' : '#B8ADF8',
                      zIndex: 2,
                    },
                    '&:focus-visible': {
                      outline: '2px solid #0877C9',
                      outlineOffset: 2,
                      zIndex: 3,
                    },
                  }}
                >
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <Box component="span">{stage.label}</Box>
                    <Box
                      component="span"
                      sx={{
                        minWidth: 20,
                        height: 20,
                        px: 0.65,
                        display: 'inline-grid',
                        placeItems: 'center',
                        borderRadius: '999px',
                        bgcolor: selected ? 'rgba(255,255,255,0.2)' : '#EEF1F6',
                        color: selected ? '#FFFFFF' : '#475569',
                        fontSize: '10px',
                        fontWeight: 800,
                      }}
                    >
                      {count.toLocaleString('en-IN')}
                    </Box>
                  </Box>
                </ButtonBase>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

export default ShipmentStageFilter
