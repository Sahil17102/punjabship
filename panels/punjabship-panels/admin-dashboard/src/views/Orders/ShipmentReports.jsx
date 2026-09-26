import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Select,
  Text,
  useToast,
} from '@chakra-ui/react'
import PageHeader from 'components/Admin/PageHeader'
import { useEffect, useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import {
  downloadAdminShipmentReport,
  fetchAdminShipmentReportOptions,
} from 'services/shipmentReports.service'

const dateValue = (date) => date.toISOString().slice(0, 10)
const today = () => dateValue(new Date())
const monthStart = () => {
  const value = new Date()
  value.setDate(1)
  return dateValue(value)
}
const emptyOptions = { couriers: [], companies: [], shipmentCount: 0 }

const readDownloadError = async (error) => {
  if (!(error?.response?.data instanceof Blob)) {
    return error?.response?.data?.message || error?.message || 'Failed to download shipment report'
  }
  try {
    const payload = JSON.parse(await error.response.data.text())
    return payload?.message || 'Failed to download shipment report'
  } catch {
    return 'Failed to download shipment report'
  }
}

export default function ShipmentReports() {
  const [fromDate, setFromDate] = useState(monthStart())
  const [toDate, setToDate] = useState(today())
  const [courier, setCourier] = useState('')
  const [company, setCompany] = useState('')
  const [gstMode, setGstMode] = useState('with')
  const [options, setOptions] = useState(emptyOptions)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!fromDate || !toDate || fromDate > toDate) return undefined
    let active = true
    setLoadingOptions(true)
    fetchAdminShipmentReportOptions({ fromDate, toDate })
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

  const download = async () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      toast({ title: 'Select a valid date range', status: 'warning', duration: 3000 })
      return
    }
    setDownloading(true)
    try {
      const blob = await downloadAdminShipmentReport({ fromDate, toDate, courier, company, gstMode })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `shipment_report_${fromDate}_to_${toDate}_${gstMode}_gst.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Shipment report downloaded', status: 'success', duration: 3000 })
    } catch (error) {
      toast({ title: await readDownloadError(error), status: 'error', duration: 4000 })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <PageHeader
        eyebrow="Orders"
        title="Shipment Reports"
        description="Export shipment operations and charge details by period, courier, and seller company."
        meta={[
          { label: 'Selected period', value: `${fromDate} to ${toDate}` },
          { label: 'Shipments found', value: loadingOptions ? 'Checking' : options.shipmentCount.toLocaleString() },
          { label: 'GST view', value: gstMode === 'with' ? 'With GST' : 'Without GST' },
        ]}
      />

      <Box
        mt={4}
        bg="white"
        border="1px solid"
        borderColor="#D7D1E1"
        borderRadius="8px"
        boxShadow="0 8px 24px rgba(38, 28, 71, 0.08)"
        p={{ base: 4, md: 5 }}
      >
        <Text fontFamily="Andada Pro Variable, serif" fontSize="xl" fontWeight="700" color="#221B3A">
          Report filters
        </Text>
        <Text mt={1} mb={5} fontSize="sm" color="#6B6475">
          All keeps that dimension unfiltered. GST selection changes the charge columns in the CSV.
        </Text>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }} gap={4}>
          <FormControl>
            <FormLabel fontSize="sm">From date</FormLabel>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">To date</FormLabel>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Courier</FormLabel>
            <Select value={courier} onChange={(event) => setCourier(event.target.value)}>
              <option value="">All couriers</option>
              {options.couriers.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Company</FormLabel>
            <Select value={company} onChange={(event) => setCompany(event.target.value)}>
              <option value="">All companies</option>
              {options.companies.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </FormControl>
        </Grid>

        <Flex mt={5} pt={4} borderTop="1px solid #E8E4ED" direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4}>
          <HStack spacing={3} align="center">
            <Text fontSize="sm" fontWeight="700" color="#312A40">GST values</Text>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button onClick={() => setGstMode('with')} bg={gstMode === 'with' ? '#0877C9' : 'white'} color={gstMode === 'with' ? 'white' : '#312A40'} _hover={{ bg: gstMode === 'with' ? '#563EDF' : '#F3F0FA' }}>
                With GST
              </Button>
              <Button onClick={() => setGstMode('without')} bg={gstMode === 'without' ? '#0877C9' : 'white'} color={gstMode === 'without' ? 'white' : '#312A40'} _hover={{ bg: gstMode === 'without' ? '#563EDF' : '#F3F0FA' }}>
                Without GST
              </Button>
            </ButtonGroup>
          </HStack>
          <Button leftIcon={<FiDownload />} onClick={download} isLoading={downloading} isDisabled={loadingOptions} loadingText="Preparing report" bg="#0877C9" color="white" _hover={{ bg: '#563EDF', transform: 'translateY(-1px)' }}>
            Download CSV
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}
