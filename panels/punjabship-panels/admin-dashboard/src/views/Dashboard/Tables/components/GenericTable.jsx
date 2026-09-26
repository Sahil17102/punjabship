import {
  Box,
  Center,
  Checkbox,
  Flex,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import Pagination from 'components/Tables/Pagination'
import TablesTableRow from 'components/Tables/TablesTableRow'
import { useEffect, useRef, useState } from 'react'

export const GenericTable = ({
  title,
  data = [],
  captions = [],
  titleActions = null,
  columnKeys = [],
  renderers = {},
  renderActions,
  loading = false,
  page,
  setPage,
  totalCount,
  perPage,
  setPerPage,
  paginated = true,
  sortByComponent = null,
  columnWidths = {},
  showCheckboxes = false,
  onSelectionChange,
  selectedRows = [],
  perPageOptions,
  actionsColumnWidth = '180px',
  wrapCells = false,
}) => {
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const headerBg = useColorModeValue('#F7F8FA', '#20232B')
  const headerColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const shellBg = useColorModeValue('white', '#171820')
  const emptyBg = useColorModeValue('#F8FAFC', '#111827')
  const emptyHintColor = useColorModeValue('gray.500', 'gray.400')
  const scrollRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const widthInPixels = (value, fallback) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value.trim())) {
      return Number.parseFloat(value)
    }
    return fallback
  }
  const mobileTableMinWidth =
    columnKeys.reduce((total, key) => total + widthInPixels(columnWidths[key], 150), 0) +
    (showCheckboxes ? 56 : 0) +
    (renderActions ? widthInPixels(actionsColumnWidth, 180) : 0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      setIsScrolled(el.scrollLeft > 0)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleSelectAll = () => {
    let newSelection = []
    if (selectedRows.length === data.length) newSelection = []
    else newSelection = data?.map((row) => row.id)
    onSelectionChange?.(newSelection)
  }

  const toggleRow = (id) => {
    const currentSelection = Array.isArray(selectedRows) ? selectedRows : []
    const newSelection = currentSelection.includes(id)
      ? currentSelection.filter((r) => r !== id)
      : [...currentSelection, id]

    onSelectionChange?.(newSelection)
  }

  return (
    <Card overflow="visible" bg={shellBg} borderRadius="6px" p={0} w="full" minW={0}>
      <CardHeader px={{ base: 3, md: 4 }} py={3} borderBottomWidth="1px" borderColor={borderColor}>
        <Flex width="100%" alignItems="center" justifyContent="space-between" direction={{ base: 'column', md: 'row' }} gap={2}>
          <Stack
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 1, sm: 4 }}
            align={{ base: 'stretch', sm: 'center' }}
            w={{ base: '100%', md: 'auto' }}
            minW={0}
          >
            <Text fontFamily="'Andada Pro Variable', Georgia, serif" fontSize={{ base: '17px', md: '19px' }} color={textColor} fontWeight="620" letterSpacing="0">
              {title}
            </Text>
            {sortByComponent}
          </Stack>
          {titleActions && (
            <Box w={{ base: '100%', md: 'auto' }} minW={0}>
              {titleActions}
            </Box>
          )}
          {paginated && (
            <Box mt={{ base: 1, md: 0 }} w={{ base: '100%', md: 'auto' }} minW={0}>
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={totalCount ?? 0}
                perPage={perPage}
                perPageOptions={perPageOptions}
                setPerPage={setPerPage}
              />
            </Box>
          )}
        </Flex>
      </CardHeader>

      <CardBody p={{ base: 0, md: 3 }} pt="0 !important" minW={0}>
        <Box
          ref={scrollRef}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="4px"
          w="full"
          maxW="full"
          overflowX="auto"
          overflowY="visible"
          sx={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        >
          <Table
            variant="simple"
            color={textColor}
            size="sm"
            w="full"
            minW={{ base: `${Math.max(mobileTableMinWidth, 640)}px`, md: '100%' }}
            tableLayout={{ base: 'auto', md: 'fixed' }}
          >
            <Thead>
              <Tr>
                {showCheckboxes && (
                  <Th ps={8} bg={headerBg} position="sticky" top={0} zIndex={3} color={headerColor}>
                    <Checkbox
                      isChecked={selectedRows.length === data.length && data.length > 0}
                      isIndeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                      onChange={toggleSelectAll}
                    />
                  </Th>
                )}
                {columnKeys.map((key, idx) => (
                  <Th
                    key={key}
                    ps={4}
                    color={headerColor}
                    minW={columnWidths[key] || 'auto'}
                    maxW={columnWidths[key] || 'auto'}
                    w={columnWidths[key] || 'auto'}
                    position="sticky"
                    top={0}
                    zIndex={2}
                    bg={headerBg}
                    fontWeight="700"
                    fontSize="12px"
                    letterSpacing="0"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {captions[idx]}
                  </Th>
                ))}
                {renderActions && (
                  <Th
                    bg={headerBg}
                    color={headerColor}
                    px={5}
                    minW={actionsColumnWidth}
                    w={actionsColumnWidth}
                    position="sticky"
                    right={0}
                    top={0}
                    zIndex={4}
                    whiteSpace="nowrap"
                    fontSize="12px"
                    letterSpacing="0"
                    borderColor={borderColor}
                  >
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>

            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={columnKeys.length + (renderActions ? 1 : 0)}>
                    <Center py={8}>
                      <Spinner size="md" color="brand.500" />
                    </Center>
                  </Td>
                </Tr>
              ) : data.length === 0 ? (
                <Tr>
                  <Td colSpan={columnKeys.length + (renderActions ? 1 : 0)}>
                    <Center py={14} bg={emptyBg}>
                      <Stack spacing={1} textAlign="center">
                        <Text color={textColor} fontWeight="800">No records found</Text>
                        <Text color={emptyHintColor} fontSize="sm">Adjust the filters or add the first record.</Text>
                      </Stack>
                    </Center>
                  </Td>
                </Tr>
              ) : (
                data.map((row, idx) => (
                  <TablesTableRow
                    key={idx}
                    row={row}
                    checkboxComponent={
                      showCheckboxes ? (
                        <Td ps={8}>
                          <Checkbox isChecked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} />
                        </Td>
                      ) : null
                    }
                    columnKeys={columnKeys}
                    renderers={renderers}
                    renderActions={renderActions}
                    columnWidths={columnWidths}
                    isScrolled={isScrolled}
                    actionsColumnWidth={actionsColumnWidth}
                    wrapCells={wrapCells}
                    rowIndex={idx}
                  />
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </CardBody>
    </Card>
  )
}
