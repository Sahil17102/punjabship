import { AddIcon, EditIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react'
import { MultiSelect } from 'components/Input/MultiSelect'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import {
  useCreateLocation,
  useDeleteLocation,
  useLocations,
  useUpdateLocation,
} from 'hooks/useLocations'
import { useState } from 'react'
import { locationService, normalizePincodeInput } from 'services/location.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

// MultiSelect options you wanted
const TAG_OPTIONS = [
  { label: 'North', value: 'north' },
  { label: 'South', value: 'south' },
  { label: 'East', value: 'east' },
  { label: 'West', value: 'west' },
  { label: 'Metros', value: 'metros' },
  { label: 'Special Zone', value: 'special_zone' },
]

const ServiceabilityPage = () => {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selectedRows, setSelectedRows] = useState([])
  const [filters, setFilters] = useState({ pincode: '', city: '', state: '' }) // filter state

  const { data, isLoading } = useLocations({ page, limit: perPage, ...filters })
  const { mutate: addLocation } = useCreateLocation()
  const { mutate: deleteLocation } = useDeleteLocation()
  const { mutate: updateLocation } = useUpdateLocation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    tags: [],
  })
  const [pincodeError, setPincodeError] = useState('')

  const handleOpenModal = () => {
    setEditingId(null)
    setFormData({ pincode: '', city: '', state: '', country: 'India', tags: [] })
    setPincodeError('')
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ pincode: '', city: '', state: '', country: 'India', tags: [] })
    setPincodeError('')
  }

  const handleChange = async (e) => {
    const { name, value } = e.target

    if (name === 'pincode') {
      const pincode = normalizePincodeInput(value)
      setFormData((prev) => ({
        ...prev,
        pincode,
        ...(pincode.length === 6 ? {} : { city: '', state: '' }),
      }))
      setPincodeError('')

      if (pincode.length === 6) {
        try {
          const loc = await locationService.lookupPincode(pincode)

          if (loc) {
            setFormData((prev) => ({
              ...prev,
              city: loc.city || '',
              state: loc.state || '',
            }))
          } else {
            setFormData((prev) => ({ ...prev, city: '', state: '' }))
            setPincodeError('Invalid pincode')
          }
        } catch (err) {
          console.error('Error fetching location:', err)
          setFormData((prev) => ({ ...prev, city: '', state: '' }))
          setPincodeError('Failed to fetch location')
        }
      } else {
        setFormData((prev) => ({ ...prev, city: '', state: '' }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const dataToSave = { ...formData, country: 'India' }

    if (!dataToSave.pincode || !dataToSave.city || !dataToSave.state) {
      alert('Please fill all fields')
      return
    }
    if (pincodeError) {
      alert('Please correct the errors before saving')
      return
    }

    if (editingId) {
      updateLocation({ id: editingId, data: dataToSave })
    } else {
      addLocation(dataToSave)
    }
    handleCloseModal()
  }

  const handleDeleteSelected = () => {
    selectedRows.forEach((id) => deleteLocation(id))
    setSelectedRows([])
  }

  const openEditModal = (row) => {
    setEditingId(row.id)
    setFormData({
      pincode: row.pincode ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country ?? 'India',
      tags: Array.isArray(row.tags)
        ? row.tags
        : typeof row.tags === 'string' && row.tags.length
        ? JSON.parse(row.tags)
        : [],
    })
    setPincodeError('')
    setIsModalOpen(true)
  }

  const columns = ['pincode', 'city', 'state', 'country', 'tags']
  const captions = ['Pincode', 'City', 'State', 'Country', 'Tags']

  // Filter definitions for TableFilters component
  const filterDefinitions = [
    { key: 'pincode', label: 'Pincode', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
  ]

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Stack justifyContent="flex-end" direction="row" spacing={3} mb={4}>
        <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={handleOpenModal}>
          Add Location
        </Button>
        <Button
          colorScheme="red"
          onClick={handleDeleteSelected}
          isDisabled={selectedRows.length === 0}
        >
          Delete Selected
        </Button>
      </Stack>

      {/* Table filters */}
      <TableFilters
        filters={filterDefinitions}
        values={filters}
        onApply={(vals) => {
          setFilters(vals)
          setPage(1) // reset page on filter apply
        }}
      />

      <GenericTable
        title="Serviceable Locations"
        data={data?.data || []}
        captions={captions}
        perPageOptions={[50, 100, 1000, 2000]}
        columnKeys={columns}
        renderers={{
          tags: (row) => {
            const tags = Array.isArray(row) ? row : []
            return Array.isArray(tags) ? (
              <HStack spacing={1}>
                {tags.map((tag, idx) => (
                  <Badge key={idx} colorScheme="purple">
                    {tag}
                  </Badge>
                ))}
              </HStack>
            ) : (
              row
            )
          },
        }}
        renderActions={(row) => (
          <IconButton
            aria-label="Edit"
            icon={<EditIcon />}
            size="sm"
            colorScheme="yellow"
            onClick={() => openEditModal(row)}
          />
        )}
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={data?.total || 0}
        perPage={perPage}
        setPerPage={setPerPage}
        paginated
        showCheckboxes
        onSelectionChange={setSelectedRows}
        selectedRows={selectedRows}
      />

      <CustomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Location' : 'Add New Location'}
        footer={
          <Stack direction="row" spacing={3}>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
          </Stack>
        }
      >
        <Stack spacing={3}>
          <Input
            placeholder="Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            isInvalid={!!pincodeError}
          />
          {pincodeError && <Text color="red.500">{pincodeError}</Text>}
          <Input placeholder="City" name="city" value={formData.city} onChange={handleChange} />
          <Input placeholder="State" name="state" value={formData.state} onChange={handleChange} />
          <Select name="country" value="India" isDisabled>
            <option value="India">India</option>
          </Select>

          {/* MultiSelect for tags */}
          <Box>
            <MultiSelect
              label="Tags"
              options={TAG_OPTIONS}
              value={formData.tags}
              onChange={(vals) => setFormData((prev) => ({ ...prev, tags: vals }))}
            />
          </Box>
        </Stack>
      </CustomModal>
    </Flex>
  )
}

export default ServiceabilityPage
