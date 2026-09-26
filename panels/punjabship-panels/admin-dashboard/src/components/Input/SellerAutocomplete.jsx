import {
  Box,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { useDebounce } from 'hooks/useDebounce'
import { useSearchSellers } from 'hooks/useUsers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch } from 'react-icons/fi'

export const SellerAutocomplete = ({
  value,
  onChange,
  placeholder = 'Search seller by name...',
  isRequired = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const menuRef = useRef(null)
  const processedValueRef = useRef(null) // Track if we've already processed a value

  const debouncedSearch = useDebounce(searchTerm, 300)

  // Memoize shouldFetchById to prevent infinite loops
  const shouldFetchById = useMemo(
    () => value && !selectedOption && value.length > 10 && !searchTerm,
    [value, selectedOption, searchTerm],
  )

  // Memoize searchQuery to prevent unnecessary re-renders
  const searchQuery = useMemo(() => (shouldFetchById ? value : debouncedSearch), [
    shouldFetchById,
    value,
    debouncedSearch,
  ])

  const { data: searchData, isLoading, isError } = useSearchSellers(searchQuery, 20)

  const options = searchData?.data || []

  useEffect(() => {
    // Reset processed value when value prop changes
    if (value !== processedValueRef.current && value) {
      processedValueRef.current = null
    }
  }, [value])

  useEffect(() => {
    // Handle fetching seller by ID when value prop is set
    // Only run once per value to prevent infinite loops
    if (
      shouldFetchById &&
      searchData?.success &&
      searchData?.data?.length > 0 &&
      !selectedOption &&
      value &&
      processedValueRef.current !== value
    ) {
      const seller = searchData.data.find((s) => s.value === value) || searchData.data[0]
      if (seller && seller.value === value) {
        processedValueRef.current = value
        setSelectedOption(seller)
        setSearchTerm(seller.label)
      }
    }
  }, [shouldFetchById, searchData?.success, searchData?.data?.length, value, selectedOption])

  useEffect(() => {
    // Show dropdown when searching or when there are results/errors
    if (debouncedSearch.trim().length >= 2 || isLoading) {
      setIsOpen(true)
    } else if (!debouncedSearch.trim() && !shouldFetchById) {
      setIsOpen(false)
    }
  }, [debouncedSearch, isLoading, shouldFetchById])

  const handleSelect = (option) => {
    setSelectedOption(option)
    setSearchTerm(option.label)
    setIsOpen(false)
    onChange(option.value)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    if (selectedOption && selectedOption.label !== value) {
      setSelectedOption(null)
      processedValueRef.current = null // Reset processed value when user types
      onChange('')
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.trim().length >= 2 && options.length > 0) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay closing to allow menu item click
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <Box position="relative" width="100%">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          isRequired={isRequired}
          autoComplete="off"
        />
      </InputGroup>
      {isOpen && (searchQuery.trim().length >= 2 || isLoading) && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={9999}
          maxH="300px"
          overflowY="auto"
          ref={menuRef}
        >
          {isLoading ? (
            <Box p={3} display="flex" alignItems="center" justifyContent="center">
              <Spinner size="sm" mr={2} />
              <Text color="gray.600">Searching...</Text>
            </Box>
          ) : isError ? (
            <Box p={3} textAlign="center">
              <Text color="red.500">Error searching sellers</Text>
            </Box>
          ) : options.length > 0 ? (
            <List spacing={0}>
              {options.map((option) => (
                <ListItem
                  key={option.value}
                  px={4}
                  py={3}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => handleSelect(option)}
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _last={{ borderBottom: 'none' }}
                >
                  <Text fontWeight="medium">{option.label}</Text>
                  {option.email && (
                    <Text fontSize="sm" color="gray.500">
                      {option.email}
                    </Text>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={3} textAlign="center">
              <Text color="gray.500">No sellers found</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
