import { Button, Flex, HStack, IconButton, Select, Text, useColorModeValue } from '@chakra-ui/react'
import { IconCaretLeft, IconCaretRight } from '@tabler/icons-react'

const Pagination = ({
  page,
  setPage,
  totalCount,
  perPage = 10,
  setPerPage,
  perPageOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.max(Math.ceil(totalCount / perPage), 1)
  const textColor = useColorModeValue('gray.700', 'gray.100')
  const borderColor = useColorModeValue('rgba(148, 163, 184, 0.4)', 'rgba(148, 163, 184, 0.28)')
  const pageHoverBg = useColorModeValue('gray.100', 'rgba(148, 163, 184, 0.18)')

  const handlePrev = () => {
    setPage((p) => Math.max(p - 1, 1))
  }

  const handleNext = () => {
    setPage((p) => Math.min(p + 1, totalPages))
  }

  return (
    <Flex justify="space-between" align="center" gap={{ base: 1.5, sm: 3 }} wrap="nowrap" w="full" minW={0}>
      <HStack spacing={2}>
        <Text fontWeight="600" minW="max-content" color={textColor} fontSize="sm">
          Rows:
        </Text>
        <Select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value))
            setPage(1)
          }}
          width="84px"
          size="sm"
          borderColor={borderColor}
          borderRadius="10px"
        >
          {perPageOptions?.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </HStack>

      <HStack spacing={2}>
        <IconButton
          size="sm"
          onClick={handlePrev}
          icon={<IconCaretLeft stroke={2} />}
          isDisabled={page <= 1}
          borderRadius="10px"
          borderWidth="1px"
          borderColor={borderColor}
          aria-label="Previous page"
        />
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          {page} / {totalPages}
        </Text>

        {totalPages > 1 && (
          <HStack spacing={1} display={{ base: 'none', sm: 'flex' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                page <= 3 ? i + 1 : page <= totalPages - 2 ? page - 2 + i : totalPages - 4 + i
              if (pageNum < 1 || pageNum > totalPages) return null
              return (
                <Button
                  key={pageNum}
                  size="xs"
                  minW="28px"
                  h="28px"
                  variant={pageNum === page ? 'solid' : 'outline'}
                  bg={pageNum === page ? 'brand.500' : 'transparent'}
                  color={pageNum === page ? 'white' : textColor}
                  borderColor={borderColor}
                  _hover={{ bg: pageNum === page ? 'brand.600' : pageHoverBg }}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </HStack>
        )}

        <IconButton
          size="sm"
          onClick={handleNext}
          icon={<IconCaretRight stroke={2} />}
          isDisabled={page >= totalPages}
          borderRadius="10px"
          borderWidth="1px"
          borderColor={borderColor}
          aria-label="Next page"
        />
      </HStack>
    </Flex>
  )
}

export default Pagination
