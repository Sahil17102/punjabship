import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  GridItem,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import { MultiSelect } from 'components/Input/MultiSelect'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCalendar, FiSearch, FiX } from 'react-icons/fi'
import { IoFilterCircleOutline } from 'react-icons/io5'

const TableFilters = ({
  filters = [],
  values = {},
  onApply,
  actions = [],
  showActiveFiltersCount = true,
  cardStyle = false,
  compact = false,
}) => {
  const [localValues, setLocalValues] = useState(() => values || {})
  const [showAll, setShowAll] = useState(false)
  const prevValuesStrRef = useRef(JSON.stringify(values || {}))

  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const cardBg = useColorModeValue('white', '#171820')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const labelColor = useColorModeValue('gray.700', 'gray.100')

  useEffect(() => {
    const currentValues = values || {}
    const currentValuesStr = JSON.stringify(currentValues)

    if (currentValuesStr !== prevValuesStrRef.current) {
      setLocalValues(currentValues)
      prevValuesStrRef.current = currentValuesStr
    }
  }, [values])

  const isAnyFilterApplied = Object.values(values || {}).some((val) => {
    if (Array.isArray(val)) return val.length > 0
    return !!val
  })

  const activeFiltersCount = useMemo(() => {
    return Object.values(values || {}).filter((val) => {
      if (Array.isArray(val)) return val.length > 0
      return !!val
    }).length
  }, [values])

  const handleChange = (key, value) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    const resetValues = filters.reduce((acc, filter) => {
      acc[filter.key] = filter.type === 'multiselect' ? [] : ''
      return acc
    }, {})
    setLocalValues(resetValues)
    onApply(resetValues)
  }

  const hasFilters = useMemo(() => {
    return Object.values(localValues || {}).some((val) =>
      Array.isArray(val) ? val.length > 0 : val?.toString().trim(),
    )
  }, [localValues])

  const DEFAULT_VISIBLE_COUNT = 4
  const shouldLimit = !showAll && filters.length > DEFAULT_VISIBLE_COUNT
  const visibleFilters = shouldLimit ? filters.slice(0, DEFAULT_VISIBLE_COUNT) : filters

  const commonInputProps = {
    bg: useColorModeValue('white', 'rgba(15, 28, 53, 0.85)'),
    borderColor,
    borderRadius: '6px',
    h: compact ? '36px' : '40px',
    _focus: {
      borderColor: 'brand.500',
      boxShadow: '0 0 0 1px #0877C9',
    },
  }

  const renderFilterField = (filter) => {
    const { key, label, type, options, dependsOn, placeholder, icon } = filter
    const value = localValues[key] || (type === 'multiselect' ? [] : '')
    const parentValue = dependsOn ? localValues[dependsOn] : undefined
    const isDisabled = dependsOn && !parentValue
    const resolvedOptions = typeof options === 'function' ? options(localValues) : options

    if (type === 'text' || type === 'search') {
      return (
        <Box key={key}>
          <Text mb={compact ? 1 : 1.5} fontWeight="700" fontSize={compact ? 'xs' : 'sm'} color={labelColor}>
            {label}
          </Text>
          <InputGroup>
            {icon && (
              <InputLeftElement pointerEvents="none">
                <Icon as={icon} color="gray.400" />
              </InputLeftElement>
            )}
            {type === 'search' && !icon && (
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
            )}
            <Input
              placeholder={placeholder ?? label}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              {...commonInputProps}
            />
            {value && (
              <InputRightElement>
                <IconButton
                  icon={<FiX />}
                  size="xs"
                  variant="ghost"
                  onClick={() => handleChange(key, '')}
                  aria-label="Clear"
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>
      )
    }

    if (type === 'date') {
      return (
        <Box key={key}>
          <Text mb={compact ? 1 : 1.5} fontWeight="700" fontSize={compact ? 'xs' : 'sm'} color={labelColor}>
            {label}
          </Text>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiCalendar} color="gray.400" />
            </InputLeftElement>
            <Input
              type="date"
              placeholder={placeholder ?? label}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              {...commonInputProps}
            />
          </InputGroup>
        </Box>
      )
    }

    if (type === 'number') {
      return (
        <Box key={key}>
          <Text mb={compact ? 1 : 1.5} fontWeight="700" fontSize={compact ? 'xs' : 'sm'} color={labelColor}>
            {label}
          </Text>
          <Input
            type="number"
            placeholder={placeholder ?? label}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            {...commonInputProps}
          />
        </Box>
      )
    }

    if (type === 'select') {
      return (
        <Box key={key}>
          <Text mb={compact ? 1 : 1.5} fontWeight="700" fontSize={compact ? 'xs' : 'sm'} color={labelColor}>
            {label}
          </Text>
          <Select
            placeholder={placeholder || `Select ${label}`}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            isDisabled={isDisabled}
            {...commonInputProps}
          >
            {resolvedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Box>
      )
    }

    if (type === 'multiselect') {
      return (
        <Box key={key}>
          <MultiSelect
            label={label}
            options={resolvedOptions}
            value={value}
            onChange={(val) => handleChange(key, val)}
            isDisabled={isDisabled}
          />
        </Box>
      )
    }

    return null
  }

  const filterContent = (
    <Box
      bg={cardStyle ? cardBg : 'transparent'}
      borderWidth={cardStyle ? '1px' : '0'}
      borderColor={cardStyle ? borderColor : 'transparent'}
      borderRadius={cardStyle ? '6px' : '0'}
      px={cardStyle ? { base: 4, md: 5 } : 0}
      py={cardStyle ? { base: 4, md: 5 } : 0}
      boxShadow={cardStyle ? useColorModeValue('0 4px 0 rgba(31,35,48,0.05), 0 12px 28px rgba(31,35,48,0.07)', '0 14px 34px rgba(0,0,0,0.28)') : 'none'}
      position="relative"
      overflow="hidden"
    >
      <Flex
        direction={compact ? { base: 'column', xl: 'row' } : 'column'}
        align={compact ? { base: 'stretch', xl: 'flex-end' } : 'stretch'}
        gap={compact ? 3 : 0}
      >
        <Grid
          flex="1"
          w="full"
          templateColumns={{
            base: '1fr',
            md: compact
              ? 'repeat(auto-fit, minmax(160px, 1fr))'
              : visibleFilters.length === 2
              ? 'repeat(2, 1fr)'
              : visibleFilters.length === 3
              ? 'repeat(3, 1fr)'
              : visibleFilters.length === 4
              ? 'repeat(4, 1fr)'
              : 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
          gap={compact ? 3 : 4}
          mb={compact ? 0 : 4}
        >
          {(isMobile ? filters : visibleFilters).map((filter) => (
            <GridItem key={filter.key}>{renderFilterField(filter)}</GridItem>
          ))}
        </Grid>

        <Flex justify="space-between" align="center" flexWrap="wrap" gap={compact ? 2 : 3} flexShrink={0}>
        <Stack direction="row" spacing={3} align="center" flexWrap="wrap">
          <Button
            bg="brand.500"
            color="white"
            size="sm"
            onClick={() => {
              onApply(localValues)
              if (isMobile) onClose()
            }}
            isDisabled={!hasFilters}
            _hover={{ bg: 'brand.600' }}
          >
            Apply Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} isDisabled={!hasFilters} borderColor={borderColor} borderRadius="6px">
            Clear All
          </Button>
          {showActiveFiltersCount && activeFiltersCount > 0 && (
            <Badge bg="gray.100" color="gray.700" fontSize="xs">
              {activeFiltersCount} active
            </Badge>
          )}
          {compact && filters.length > DEFAULT_VISIBLE_COUNT && (
            <Button variant="link" color="brand.500" onClick={() => setShowAll((prev) => !prev)} size="xs">
              {showAll ? 'Fewer filters' : 'More filters'}
            </Button>
          )}
        </Stack>

        {actions.length > 0 && (
          <Stack direction="row" spacing={2} align="center" flexWrap="wrap">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                leftIcon={action.icon}
                colorScheme={action.colorScheme || 'gray'}
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                isLoading={action.isLoading}
                loadingText={action.loadingText}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        )}
        </Flex>
      </Flex>
    </Box>
  )

  const desktopContent = (
    <Box
      bg="transparent"
      borderWidth="0"
      p={0}
    >
      {filterContent}

      {!compact && filters.length > DEFAULT_VISIBLE_COUNT && (
        <Button variant="link" color="brand.500" onClick={() => setShowAll((prev) => !prev)} size="sm" mt={2}>
          {showAll ? 'Hide extra filters' : 'Show more filters'}
        </Button>
      )}
    </Box>
  )

  return (
    <>
      {isMobile ? (
        <>
          <Flex justify="space-between" align="center" p={4}>
            {actions.length > 0 && (
              <Stack direction="row" spacing={2}>
                {actions.map((action, idx) => (
                  <IconButton
                    key={idx}
                    icon={action.icon}
                    aria-label={action.label}
                    size="sm"
                    colorScheme={action.colorScheme}
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                    isLoading={action.isLoading}
                  />
                ))}
              </Stack>
            )}
            <Box position="relative">
              <IconButton
                aria-label="Open filters"
                icon={<IoFilterCircleOutline size={18} />}
                onClick={onOpen}
                variant={isAnyFilterApplied ? 'solid' : 'outline'}
                colorScheme={isAnyFilterApplied ? 'blue' : 'gray'}
                size="sm"
              />
              {activeFiltersCount > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  fontSize="xs"
                  px={1.5}
                  py={0.5}
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Box>
          </Flex>

          <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="lg">
            <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
            <DrawerContent borderTopRadius="18px" p={4} maxH="85vh" bg={cardBg}>
              <DrawerHeader px={0}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="800">Filters</Text>
                  {activeFiltersCount > 0 && (
                    <Badge bg="secondary.100" color="secondary.700" fontSize="xs" px={2.5} py={1} borderRadius="full">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </Flex>
              </DrawerHeader>
              <DrawerBody px={0}>{filterContent}</DrawerBody>
              <DrawerFooter px={0}>
                <Button variant="ghost" onClick={onClose} w="full">
                  Close
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        desktopContent
      )}
    </>
  )
}

export default TableFilters
