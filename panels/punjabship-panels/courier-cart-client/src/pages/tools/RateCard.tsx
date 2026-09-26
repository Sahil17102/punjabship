import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Papa from 'papaparse'
import { useState } from 'react'
import { MdCalculate, MdDownload, MdExpandMore } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { useShippingRates } from '../../hooks/Integrations/useCouriers'
import { useZones } from '../../hooks/useZones'
import { courierLogos, defaultLogo } from '../../utils/constants'

interface RateSlab {
  id?: string | number
  weight_from: number
  weight_to: number | null
  rate: number
  extra_rate?: number | null
  extra_weight_unit?: number | null
}

interface Zone {
  code: string
  id?: string
  description?: string
  name: string
}

interface ShippingRate {
  id: string | number
  courier_name: string
  mode: string
  min_weight: number
  cod_charges?: number | string
  cod_percent?: number | string
  other_charges?: number | string
  rates: Record<string, { forward?: number | string; rto?: number | string; forward_per_kg?: number | string; rto_per_kg?: number | string; min_weight?: number }>
  zone_slabs?: Record<string, { forward?: RateSlab[]; rto?: RateSlab[] }>
}

const formatMoney = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === '' ? 'NA' : `Rs ${Number(value).toFixed(2)}`

const getSlabs = (courier: ShippingRate, zoneName: string, type: 'forward' | 'rto') => {
  const configured = courier.zone_slabs?.[zoneName]?.[type] || []
  if (configured.length) return configured

  const legacyRate = courier.rates?.[zoneName]?.[type]
  return legacyRate === undefined || legacyRate === null || legacyRate === ''
    ? []
    : [{ weight_from: Number(courier.min_weight || 0), weight_to: Number(courier.min_weight || 0), rate: Number(legacyRate) }]
}

const SlabList = ({ slabs }: { slabs: RateSlab[] }) => (
  <Stack spacing={0.5}>
    {slabs.map((slab, index) => (
      <Box key={slab.id || `${slab.weight_from}-${slab.weight_to}-${index}`}>
        <Typography variant="body2" fontWeight={600}>
          {slab.weight_from}-{slab.weight_to === null ? '+' : slab.weight_to} kg · {formatMoney(slab.rate)}
        </Typography>
        {slab.extra_rate !== null && slab.extra_rate !== undefined && (
          <Typography variant="caption" color="text.secondary">
            Above slab: {formatMoney(slab.extra_rate)} / {slab.extra_weight_unit || 1} kg
          </Typography>
        )}
      </Box>
    ))}
  </Stack>
)

const CourierAccordion = ({ courier, zones }: { courier: ShippingRate; zones: Zone[] }) => {
  const zoneRows = zones
    .map((zone) => ({ ...zone, forward: getSlabs(courier, zone.name, 'forward'), rto: getSlabs(courier, zone.name, 'rto') }))
    .filter((zone) => zone.forward.length || zone.rto.length)
  const slabCount = zoneRows.reduce((count, zone) => count + zone.forward.length + zone.rto.length, 0)
  const logoSrc = Object.entries(courierLogos).find(([key]) => courier.courier_name?.toLowerCase().includes(key.toLowerCase()))?.[1] ?? defaultLogo

  return (
    <Accordion disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' }, '&.Mui-expanded': { margin: 0 } }}>
      <AccordionSummary expandIcon={<MdExpandMore />} sx={{ px: 2, minHeight: 64 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5} width="100%">
          <Stack direction="row" alignItems="center" spacing={1} flex={1}>
            <Avatar src={logoSrc || defaultLogo} alt={courier.courier_name} sx={{ width: 28, height: 28 }} />
            <Box>
              <Typography fontWeight={700}>{courier.courier_name}</Typography>
              <Typography variant="caption" color="text.secondary">{courier.mode || 'Standard'} · Min weight {courier.min_weight} kg</Typography>
            </Box>
          </Stack>
          <Chip label={`${slabCount} slabs`} size="small" color="primary" variant="outlined" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: { xs: 1, sm: 2 }, pb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1.5}>
          <Typography variant="caption" color="text.secondary">COD: {formatMoney(courier.cod_charges ?? 0)} · {courier.cod_percent ?? 0}%</Typography>
          <Typography variant="caption" color="text.secondary">Other charges: {formatMoney(courier.other_charges ?? 0)}</Typography>
        </Stack>
        <Table size="small">
          <TableHead><TableRow><TableCell>Zone</TableCell><TableCell>Forward slabs</TableCell><TableCell>RTO slabs</TableCell></TableRow></TableHead>
          <TableBody>
            {zoneRows.map((zone) => (
              <TableRow key={zone.code || zone.name}>
                <TableCell sx={{ fontWeight: 700, verticalAlign: 'top' }}>{zone.name}</TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}><SlabList slabs={zone.forward} /></TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}><SlabList slabs={zone.rto} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!zoneRows.length && <Typography color="text.secondary" variant="body2">No slabs configured for this courier.</Typography>}
      </AccordionDetails>
    </Accordion>
  )
}

const B2CClientTable = ({ data, zones }: { data: ShippingRate[]; zones: Zone[] }) => {
  if (!data?.length) return <Typography>No B2C rates available</Typography>
  return <Stack spacing={1.5}>{data.map((courier) => <CourierAccordion key={`${courier.courier_name}-${courier.mode}`} courier={courier} zones={zones} />)}</Stack>
}

const B2BClientTable = ({ data, zones }: { data: ShippingRate[]; zones: Zone[] }) => {
  if (!data?.length) return <Typography>No B2B rates available</Typography>
  return (
    <Stack spacing={1.5}>
      {data.map((courier) => (
        <Accordion key={`${courier.courier_name}-${courier.mode}`} disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' }, '&.Mui-expanded': { margin: 0 } }}>
          <AccordionSummary expandIcon={<MdExpandMore />}><Typography variant="h6" fontWeight={700}>{courier.courier_name}</Typography></AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <Typography variant="body2">Min Weight: {courier.min_weight} kg</Typography>
              <Typography variant="body2">COD: {formatMoney(courier.cod_charges ?? 0)} | {courier.cod_percent ?? 0}%</Typography>
              <Typography variant="body2">Other: {formatMoney(courier.other_charges ?? 0)}</Typography>
            </Stack>
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead><TableRow><TableCell>Zone</TableCell><TableCell>Forward (Per Kg)</TableCell><TableCell>RTO (Per Kg)</TableCell><TableCell>Min Weight</TableCell></TableRow></TableHead>
              <TableBody>
                {zones.map((zone) => {
                  const rates = courier.rates?.[zone.name] || {}
                  return <TableRow key={zone.code}><TableCell>{zone.name}</TableCell><TableCell>{formatMoney(rates.forward_per_kg)}</TableCell><TableCell>{formatMoney(rates.rto_per_kg)}</TableCell><TableCell>{rates.min_weight ?? courier.min_weight ?? 'NA'} kg</TableCell></TableRow>
                })}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}

const RateCard = () => {
  const navigate = useNavigate()
  const [businessType, setBusinessType] = useState<'b2c' | 'b2b'>('b2c')
  const { zones } = useZones(businessType)
  const queryFilters = {
    businessType,
  }
  const { data, isLoading, isError } = useShippingRates(queryFilters)
  const rates: ShippingRate[] = data || []

  const handleExportCSV = (): void => {
    const csvData = rates.map((rate) => {
      const base: Record<string, unknown> = { Courier: rate.courier_name, Mode: rate.mode, 'Min Weight': rate.min_weight }
      zones.forEach((zone: Zone) => {
        const zoneRates = rate.rates?.[zone.name] || {}
        const forwardSlabs = rate.zone_slabs?.[zone.name]?.forward || []
        const rtoSlabs = rate.zone_slabs?.[zone.name]?.rto || []
        if (businessType === 'b2b') {
          base[`${zone.name} (Per Kg)`] = `F: ${formatMoney(zoneRates.forward_per_kg)} | RTO: ${formatMoney(zoneRates.rto_per_kg)}`
        } else {
          base[`${zone.name} (Forward Slabs)`] = forwardSlabs.length ? forwardSlabs.map((slab) => `${slab.weight_from}-${slab.weight_to ?? '+'}kg: ${formatMoney(slab.rate)}`).join(' ; ') : formatMoney(zoneRates.forward)
          base[`${zone.name} (RTO Slabs)`] = rtoSlabs.length ? rtoSlabs.map((slab) => `${slab.weight_from}-${slab.weight_to ?? '+'}kg: ${formatMoney(slab.rate)}`).join(' ; ') : formatMoney(zoneRates.rto)
        }
      })
      base['COD Charges'] = rate.cod_charges ?? 'NA'
      base['COD %'] = rate.cod_percent ?? 'NA'
      base['Other Charges'] = rate.other_charges ?? 'NA'
      return base
    })
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `rate_card_${businessType}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const controls = (
    <Box sx={{ px: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="flex-start" alignItems="center">
        <SmartTabs
          tabs={[{ label: 'B2C', value: 'b2c' }, { label: 'B2B', value: 'b2b' }]}
          value={businessType}
          onChange={setBusinessType}
        />
      </Stack>
    </Box>
  )

  const table = isLoading ? <TableSkeleton /> : isError ? <Typography color="error">Error loading shipping rates</Typography> : businessType === 'b2b' ? <B2BClientTable zones={zones} data={rates} /> : <B2CClientTable data={rates} zones={zones} />

  return (
    <ListPageLayout
      title="Rate Card"
      description="View shipping rates and expand any courier to see every configured slab"
      actions={[
        { label: 'Calculate Rates', onClick: () => navigate('/tools/rate_calculator'), icon: <MdCalculate />, variant: 'outlined' },
        { label: 'Download Rate Card', onClick: handleExportCSV, icon: <MdDownload />, variant: 'contained' },
      ]}
      controls={controls}
    >
      {table}
    </ListPageLayout>
  )
}

export default RateCard
