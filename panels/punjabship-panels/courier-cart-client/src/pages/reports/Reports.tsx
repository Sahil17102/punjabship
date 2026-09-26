import {
  alpha,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import { HiOutlineDocumentArrowDown } from 'react-icons/hi2'
import { MdWarningAmber, MdStickyNote2, MdPayments, MdCreditCard } from 'react-icons/md'
import {
  downloadShipmentReportCsv,
  fetchShipmentReportOptions,
} from '../../api/reports.api'
import type { ShipmentReportOptions } from '../../api/reports.api'
import { toast } from '../../components/UI/Toast'
import { fetchSellerInsights } from '../../api/insights.api'
import type { SellerInsights } from '../../api/insights.api'

const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const value = new Date()
  value.setDate(1)
  return value.toISOString().slice(0, 10)
}

const emptyOptions: ShipmentReportOptions = { couriers: [], companies: [], shipmentCount: 0 }
const emptyInsights: SellerInsights = {
  summary: { highRiskPincodes: 0, orderNotes: 0, codOrders: 0, prepaidOrders: 0 },
  highRiskPincodes: [], orderNotes: [], codOrders: [], prepaidOrders: [],
}

const readDownloadError = async (error: any) => {
  if (!(error?.response?.data instanceof Blob)) return 'Failed to download shipment report'
  try {
    const payload = JSON.parse(await error.response.data.text())
    return payload?.message || 'Failed to download shipment report'
  } catch {
    return 'Failed to download shipment report'
  }
}

export default function Reports() {
  const [fromDate, setFromDate] = useState(monthStart())
  const [toDate, setToDate] = useState(today())
  const [courier, setCourier] = useState('')
  const [company, setCompany] = useState('')
  const [gstMode, setGstMode] = useState<'with' | 'without'>('with')
  const [options, setOptions] = useState<ShipmentReportOptions>(emptyOptions)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [insights, setInsights] = useState<SellerInsights>(emptyInsights)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const insightCards: Array<{ label: string; value: number; icon: ReactNode; color: string }> = [
    { label: 'High Risk Pincode', value: insights.summary.highRiskPincodes, icon: <MdWarningAmber />, color: '#A33249' },
    { label: 'Order Notes', value: insights.summary.orderNotes, icon: <MdStickyNote2 />, color: '#0877C9' },
    { label: 'COD Orders', value: insights.summary.codOrders, icon: <MdPayments />, color: '#C46A00' },
    { label: 'Prepaid Orders', value: insights.summary.prepaidOrders, icon: <MdCreditCard />, color: '#16805B' },
  ]

  useEffect(() => {
    if (!fromDate || !toDate || fromDate > toDate) return
    let active = true
    setLoadingOptions(true)
    fetchShipmentReportOptions({ fromDate, toDate })
      .then((data) => {
        if (!active) return
        setOptions(data)
        setCourier((current) => (current && !data.couriers.includes(current) ? '' : current))
        setCompany((current) => (current && !data.companies.includes(current) ? '' : current))
      })
      .catch(() => active && setOptions(emptyOptions))
      .finally(() => active && setLoadingOptions(false))
    return () => {
      active = false
    }
  }, [fromDate, toDate])

  useEffect(() => {
    let active = true
    setLoadingInsights(true)
    fetchSellerInsights().then((data) => active && setInsights(data)).catch(() => active && setInsights(emptyInsights)).finally(() => active && setLoadingInsights(false))
    return () => { active = false }
  }, [])

  const download = async () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      toast.open({ message: 'Select a valid date range', severity: 'warning' })
      return
    }
    setDownloading(true)
    try {
      const blob = await downloadShipmentReportCsv({ fromDate, toDate, courier, company, gstMode })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `shipment_report_${fromDate}_to_${toDate}_${gstMode}_gst.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      toast.open({ message: 'Shipment report downloaded', severity: 'success' })
    } catch (error) {
      toast.open({ message: await readDownloadError(error), severity: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Stack spacing={2.2} sx={{ py: 2.5 }}>
      <Box
        sx={{
          p: { xs: 2.2, md: 3 },
          border: '1px solid #DED9E8',
          borderRadius: 2,
          backgroundColor: '#FBFAFE',
          backgroundImage:
            'linear-gradient(rgba(8,119,201,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(8,119,201,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography sx={{ fontFamily: 'Hahmlet Variable, serif', fontSize: { xs: 25, md: 31 }, fontWeight: 760 }}>
              Insights Overview
            </Typography>
            <Typography sx={{ mt: 0.7, color: '#625C6C', fontSize: 14 }}>
              Download shipment-level operational and billing data for the exact slice you need.
            </Typography>
          </Box>
          <Box sx={{ alignSelf: 'flex-start', px: 1.4, py: 0.8, border: '1px solid #D8D0F7', bgcolor: '#F0ECFF' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#4E38C8' }}>
              {loadingOptions ? 'Checking shipments...' : `${options.shipmentCount.toLocaleString()} in selected period`}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
        {insightCards.map(({ label, value, icon, color }) => (
          <Box key={label} sx={{ p: 2, border: `1px solid ${color}55`, borderTop: `4px solid ${color}`, borderRadius: 2, bgcolor: '#FFF', boxShadow: '0 6px 18px rgba(27,20,54,0.06)' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#625C6C' }}>{label}</Typography>
              <Box sx={{ color, display: 'flex' }}>{icon}</Box>
            </Stack>
            <Typography sx={{ mt: 1, fontSize: 26, fontWeight: 800, color }}>{loadingInsights ? '—' : Number(value).toLocaleString()}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2 }}>
        <InsightList title="High Risk Pincode" columns={['Pincode', 'Risk', 'NDR', 'RTO']} rows={insights.highRiskPincodes.map((row) => [row.pincode, `${row.riskRate}%`, row.ndrOrders, row.rtoOrders])} empty="No NDR or RTO risk recorded." />
        <InsightList title="Order Notes" columns={['Order', 'Status', 'Note']} rows={insights.orderNotes.map((row) => [row.orderNumber, row.status, row.note])} empty="No order notes captured." />
        <InsightList title="COD Orders" columns={['Order', 'Status', 'Pincode', 'Courier']} rows={insights.codOrders.map((row) => [row.orderNumber, row.status, row.pincode, row.courier])} empty="No COD orders found." />
        <InsightList title="Prepaid Orders" columns={['Order', 'Status', 'Pincode', 'Courier']} rows={insights.prepaidOrders.map((row) => [row.orderNumber, row.status, row.pincode, row.courier])} empty="No prepaid orders found." />
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.6 }, border: '1px solid #D8D4DF', borderRadius: 2, bgcolor: '#FFFFFF', boxShadow: '0 8px 24px rgba(27,20,54,0.07)' }}>
        <Typography sx={{ fontFamily: 'Andada Pro Variable, serif', fontSize: 20, fontWeight: 700, mb: 0.4 }}>
          Report filters
        </Typography>
        <Typography sx={{ color: '#716A78', fontSize: 13, mb: 2.2 }}>
          All keeps that dimension unfiltered. GST selection changes the charge columns in the CSV.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          <TextField label="From date" type="date" size="small" value={fromDate} onChange={(event) => setFromDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="To date" type="date" size="small" value={toDate} onChange={(event) => setToDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <FormControl size="small">
            <InputLabel>Courier</InputLabel>
            <Select value={courier} label="Courier" onChange={(event) => setCourier(event.target.value)}>
              <MenuItem value="">All couriers</MenuItem>
              {options.couriers.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Company</InputLabel>
            <Select value={company} label="Company" onChange={(event) => setCompany(event.target.value)}>
              <MenuItem value="">All companies</MenuItem>
              {options.companies.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" gap={2} sx={{ mt: 2.2, pt: 2, borderTop: '1px solid #ECE9F0' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.2}>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>GST values</Typography>
            <ToggleButtonGroup exclusive size="small" value={gstMode} onChange={(_, value) => value && setGstMode(value)}>
              <ToggleButton value="with" sx={{ px: 2, fontWeight: 750 }}>With GST</ToggleButton>
              <ToggleButton value="without" sx={{ px: 2, fontWeight: 750 }}>Without GST</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Button
            variant="contained"
            onClick={download}
            disabled={downloading || loadingOptions}
            startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <HiOutlineDocumentArrowDown />}
            sx={{ px: 2.4, bgcolor: '#0877C9', boxShadow: `0 8px 18px ${alpha('#0877C9', 0.24)}`, '&:hover': { bgcolor: '#563EDF' } }}
          >
            {downloading ? 'Preparing report...' : 'Download CSV'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}

function InsightList({ title, columns, rows, empty }: { title: string; columns: string[]; rows: Array<Array<string | number>>; empty: string }) {
  return (
    <Box sx={{ border: '1px solid #D8D4DF', borderRadius: 2, bgcolor: '#FFF', overflow: 'hidden', boxShadow: '0 8px 24px rgba(27,20,54,0.06)' }}>
      <Typography sx={{ px: 2, py: 1.5, fontFamily: 'Andada Pro Variable, serif', fontSize: 19, fontWeight: 700, borderBottom: '1px solid #ECE9F0' }}>{title}</Typography>
      {rows.length ? <Box sx={{ overflowX: 'auto' }}><Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { textAlign: 'left', px: 1.5, py: 1, borderBottom: '1px solid #F0EDF4', fontSize: 12 }, '& th': { color: '#716A78', fontWeight: 800, bgcolor: '#FBFAFE' }, '& td': { color: '#282331', verticalAlign: 'top' } }}><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(0, 10).map((row, index) => <tr key={`${title}-${index}`}>{row.map((value, cellIndex) => <td key={`${index}-${cellIndex}`}>{value}</td>)}</tr>)}</tbody></Box></Box> : <Typography sx={{ px: 2, py: 2, color: '#716A78', fontSize: 13 }}>{empty}</Typography>}
    </Box>
  )
}
