import {
  Badge,
  Box,
  Button,
  Flex,
  Tab,
  TabList,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import { IconPlane, IconTruck, IconUpload } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'

import CustomModal from 'components/Modal/CustomModal'
import { RateCardEditModal } from 'components/Modal/RateCardEditModal'
import FileUploader from 'components/upload/FileUploader'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

import { useImportShippingRates, useShippingRates } from 'hooks/useCouriers'
import { useZones } from 'hooks/useZones'
import { fetchAllCouriers } from 'services/courier.service'
import { PlansService } from 'services/plan.service'

const RateCard = () => {
  const toast = useToast()
  const { zones } = useZones()
  const { data: courierList } = useQuery({ queryKey: ['all-couriers'], queryFn: fetchAllCouriers })
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', { businessType: 'b2c', status: 'active' }],
    queryFn: () => PlansService.getPlans({ businessType: 'b2c', status: 'active' }),
  })

  const { mutate: importRates, isPending: isImporting } = useImportShippingRates()
  const [filters, setFilters] = useState({})
  const { data, isLoading } = useShippingRates(filters)

  const [selectedRate, setSelectedRate] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isImportModalOpen, setImportModalOpen] = useState(false)

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)

  // Set default plan filter when plans load
  useEffect(() => {
    if (plans?.length > 0) {
      setFilters((prev) => ({ ...prev, planId: plans[0].id }))
    }
  }, [plans])

  const openEditModal = (row) => {
    setSelectedRate(row)
    setModalOpen(true)
  }

  const handleSaveRates = (updated) => {
    console.log('Saving rates:', updated)
    // TODO: call backend mutation
  }

  const handleTabChange = (index) => {
    setSelectedPlanIndex(index)
    const selectedPlanId = plans[index]?.id
    setFilters((prev) => ({ ...prev, planId: selectedPlanId }))
  }

  const handleImportRates = () => setImportModalOpen(true)

  const downloadCSV = (allCouriers, allZones, existingData) => {
    if (!allZones || !allCouriers) return

    const headers = [
      'Courier ID',
      'Courier Name',
      'Service Provider',
      'Mode',
      'Min Weight',
      ...allZones.flatMap((zone) => [`${zone.name} (Forward)`, `${zone.name} (RTO)`]),
      'COD Charges',
      'COD Percent',
      'Other Charges',
    ]

    const normalize = (s) => s?.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ') ?? ''

    const rows = allCouriers.map((courier) => {
      const courierName = typeof courier === 'string' ? courier : courier.name
      const row =
        existingData?.find((rate) => normalize(rate.courier_name) === normalize(courierName)) || {}
      const mode = row.mode || (normalize(courierName).includes('air') ? 'air' : 'surface')

      const zoneValues = allZones.flatMap((zone) => {
        const zoneRates = row.rates?.[zone.name] || {}
        return [
          zoneRates.forward != null ? `₹${zoneRates.forward}` : '',
          zoneRates.rto != null ? `₹${zoneRates.rto}` : '',
        ]
      })

      return [
        row.courier_id || (typeof courier === 'object' ? courier.id : ''),
        courierName,
        row.service_provider || (typeof courier === 'object' ? courier.serviceProvider : ''),
        mode,
        row.min_weight || '0.5',
        ...zoneValues,
        row.cod_charges != null ? `₹${row.cod_charges}` : '',
        row.cod_percent != null ? `${row.cod_percent}%` : '',
        row.other_charges != null ? `₹${row.other_charges}` : '',
      ]
    })

    const csv = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'shipping_rate_card.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const zoneColumns = useMemo(() => {
    if (!zones) return []
    return zones.map((zone) => ({
      key: `${zone.code}_rates`,
      label: `${zone.name} (F | RTO)`,
      width: '190px',
      renderer: (_, row) => {
        const zoneRates = row.rates?.[zone.name] || {}
        return `${zoneRates.forward != null ? `₹${zoneRates.forward}` : 'NA'} | ${
          zoneRates.rto != null ? `₹${zoneRates.rto}` : 'NA'
        }`
      },
    }))
  }, [zones])

  const preZoneColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', width: '50px' },
      {
        key: 'courier_info',
        label: 'Courier Info',
        width: '200px',
        renderer: (_, row) => {
          const serviceProvider = row.service_provider || row.serviceProvider
          return (
            <Box>
              <Text fontWeight="semibold">{row.courier_name || 'N/A'}</Text>
              {serviceProvider && (
                <Text fontSize="xs" color="gray.600" mt={0.5}>
                  Provider:{' '}
                  <Badge colorScheme="green" fontSize="xs">
                    {serviceProvider}
                  </Badge>
                </Text>
              )}
            </Box>
          )
        },
      },
      {
        key: 'mode',
        label: 'Mode',
        width: '100px',
        renderer: (value) => {
          if (!value) return '-'
          const lower = value.toLowerCase()
          if (lower === 'air')
            return (
              <Flex align="center" gap={2}>
                <IconPlane size={28} stroke={1.5} color="blue" />
              </Flex>
            )
          if (lower === 'surface')
            return (
              <Flex align="center" gap={2}>
                <IconTruck size={28} stroke={1.5} color="green" />
              </Flex>
            )
          return value
        },
      },
      ...(selectedBusinessType !== 'b2c'
        ? [{ key: 'min_weight', label: 'Min Weight', width: '120px' }]
        : []),
    ],
    [],
  )

  const postZoneColumns = useMemo(
    () => [
      {
        key: 'cod_charges',
        label: 'COD Charges (Charges | Percent)',
        width: '200px',
        renderer: (_, row) =>
          `${row.cod_charges != null ? `₹${row.cod_charges}` : 'NA'} | ${
            row.cod_percent != null ? `${row.cod_percent}%` : 'NA'
          }`,
      },
      {
        key: 'other_charges',
        label: 'Other Charges',
        width: '120px',
        renderer: (value) => (value ? `₹${value}` : '-'),
      },
    ],
    [],
  )

  const columns = [...preZoneColumns, ...zoneColumns, ...postZoneColumns]

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      {/* Plan Tabs */}
      <Tabs
        variant="soft-rounded"
        colorScheme="brand"
        index={selectedPlanIndex}
        onChange={handleTabChange}
        mb={4}
      >
        <TabList>
          {plans?.map((plan) => (
            <Tab key={plan.id}>{plan.name}</Tab>
          ))}
        </TabList>
      </Tabs>

      {/* Filters and actions */}
      <Flex justify="flex-end" gap={2} mb={4} flexWrap="wrap">
        <Button
          size="sm"
          colorScheme="pink"
          leftIcon={<IconUpload />}
          onClick={handleImportRates}
        >
          Import Rate Card
        </Button>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => downloadCSV(courierList ?? [], zones ?? [], data ?? [])}
        >
          Download CSV
        </Button>
      </Flex>

      {/* Rate Card Table */}
      <GenericTable
        title="Shipping Rate Card"
        columnKeys={columns.map((c) => c.key)}
        captions={columns.map((c) => c.label)}
        columnWidths={Object.fromEntries(columns.map((c) => [c.key, c.width]))}
        renderers={Object.fromEntries(
          columns.filter((c) => c.renderer).map((c) => [c.key, c.renderer]),
        )}
        data={data ?? []}
        loading={isLoading}
        renderActions={(row) => (
          <Button size="sm" colorScheme="blue" onClick={() => openEditModal(row)}>
            Edit Rates
          </Button>
        )}
        paginated={false}
        totalCount={data?.length}
      />

      {/* Edit Rate Modal */}
      <RateCardEditModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedRate}
        zones={zones}
        onSave={handleSaveRates}
      />

      {/* Import Modal */}
      <CustomModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Rates"
        size="xl"
        action={
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => downloadCSV(courierList ?? [], zones ?? [], data ?? [])}
          >
            Download CSV
          </Button>
        }
      >
        <FileUploader
          maxSizeMb={5}
          folderKey="rates"
          uploadLoading={isImporting}
          onUploaded={(files) => {
            if (!files.length) return
            importRates(files[0], {
              onSuccess: () => {
                toast({
                  title: 'Imported successfully',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                })
                setImportModalOpen(false)
              },
              onError: (err) => {
                toast({
                  title: 'Failed to upload rate card',
                  description: err?.message,
                  status: 'error',
                  duration: 4000,
                  isClosable: true,
                })
              },
            })
          }}
        />
      </CustomModal>
    </Flex>
  )
}

export default RateCard
