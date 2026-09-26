import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import CustomModal from 'components/Modal/CustomModal'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import { useUserTickets } from 'hooks/useUser'
import { useEffect, useState } from 'react'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function UserTicketsPage({ userId }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const { data, isLoading } = useUserTickets(userId, page, perPage)

  const {
    data: presignedUrls,
    isLoading: loadingAttachments,
    error: attachmentError,
    refetch, // <-- this should exist
  } = usePresignedDownloadUrls({
    keys: selectedTicket?.attachments,
    enabled: selectedTicket?.attachments.length > 0,
  })

  useEffect(() => {
    if (selectedTicket?.attachments.length > 0) {
      refetch()
    }
  }, [selectedTicket?.attachments, refetch])
  console.log(data)
  const handleView = (ticketId) => {
    console.log(ticketId)
    const ticket = data?.tickets?.find((t) => t?.id === ticketId)
    setSelectedTicket(ticket)
    // setEditedStatus(ticket.status)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTicket(null)
  }

  const renderers = {
    createdAt: (value) => new Date(value).toLocaleString(),
    status: (value) => (
      <StatusBadge
        status={value}
        type={
          value === 'open'
            ? 'info'
            : value === 'closed'
            ? 'error'
            : value === 'in_progress'
            ? 'warning'
            : 'success'
        }
      />
    ),
  }
  const tickets = data?.tickets || []
  const totalCount = data?.totalCount || 0

  return (
    <>
      <GenericTable
        title="Support Tickets"
        captions={['ID', 'Subject', 'Status', 'Created At']}
        columnKeys={['id', 'subject', 'status', 'createdAt']}
        data={tickets}
        loading={isLoading}
        renderers={renderers}
        renderActions={(row) => (
          <Button size="sm" colorScheme="blue" onClick={() => handleView(row?.id)}>
            View
          </Button>
        )}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      <CustomModal
        size="2xl"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Ticket #${selectedTicket?.id}`}
        footer={
          <HStack spacing={3}>
            <Button onClick={handleCloseModal} variant="ghost">
              Cancel
            </Button>
          </HStack>
        }
      >
        {selectedTicket && (
          <>
            {/* Ticket Info */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Subject
                </Heading>
                <Text>{selectedTicket.subject}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Status
                </Heading>
                <Text textTransform="capitalize">{selectedTicket.status}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Category
                </Heading>
                <Text>{selectedTicket.category}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Sub Category
                </Heading>
                <Text>{selectedTicket.subcategory || '—'}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  AWB Number
                </Heading>
                <Text>{selectedTicket.awbNumber || '—'}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2} color="green.700">
                  Created At
                </Heading>
                <Text fontWeight="medium">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2} color="red.600">
                  Due By
                </Heading>
                <Text fontWeight="medium">
                  {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : '—'}
                </Text>
              </Box>

              <Box
                gridColumn={{ base: '1 / -1', md: '1 / -1' }}
                p={3}
                borderRadius="md"
                bg="gray.50"
              >
                <Heading as="h4" size="sm" mb={2}>
                  Description
                </Heading>
                <Text
                  whiteSpace="pre-wrap"
                  fontStyle={!selectedTicket.description ? 'italic' : 'normal'}
                >
                  {selectedTicket.description || 'No description.'}
                </Text>
              </Box>
            </SimpleGrid>

            <Divider mb={6} />

            {/* Attachments */}
            <Box>
              <Heading as="h3" size="md" mb={4}>
                Attachments
              </Heading>

              {loadingAttachments ? (
                <Spinner />
              ) : attachmentError ? (
                <Text color="red.500">Failed to load attachments</Text>
              ) : presignedUrls && presignedUrls.length > 0 ? (
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  {presignedUrls.map((url, index) => {
                    // Extract filename from URL path
                    const filename =
                      url.split('/').pop()?.split('?')[0] || `Attachment-${index + 1}`
                    return (
                      <Link
                        key={url}
                        href={url}
                        isExternal
                        rel="noopener noreferrer"
                        borderRadius="md"
                        overflow="hidden"
                        boxShadow="md"
                        cursor="pointer"
                        _hover={{
                          boxShadow: 'lg',
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s',
                        }}
                        display="block"
                      >
                        <Image
                          src={url}
                          alt={filename}
                          objectFit="cover"
                          width="100%"
                          maxHeight="150px"
                          fallbackSrc="https://via.placeholder.com/200?text=Loading..."
                          borderRadius="md"
                          mb={2}
                        />
                        <Text
                          fontSize="sm"
                          isTruncated
                          maxW="100%"
                          textAlign="center"
                          px={1}
                          mb={1}
                        >
                          {filename}
                        </Text>
                      </Link>
                    )
                  })}
                </SimpleGrid>
              ) : (
                <Text>No attachments</Text>
              )}
            </Box>
          </>
        )}
      </CustomModal>
    </>
  )
}
