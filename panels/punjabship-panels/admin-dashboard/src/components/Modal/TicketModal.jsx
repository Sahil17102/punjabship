import { Box, Button, FormControl, FormLabel, HStack, Select, Text, VStack } from '@chakra-ui/react'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import { useUpdateTicket } from 'hooks/useTickets'
import { useEffect, useMemo, useState } from 'react'

const toValidDate = (value) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const toTimestamp = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? value.getTime() : null

export const TicketModal = ({ selectedTicket, onClose }) => {
  const [editedStatus, setEditedStatus] = useState(selectedTicket?.status)
  const [editedDueDate, setEditedDueDate] = useState(toValidDate(selectedTicket?.dueDate))

  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket(onClose)

  useEffect(() => {
    setEditedStatus(selectedTicket?.status || 'open')
    setEditedDueDate(toValidDate(selectedTicket?.dueDate))
  }, [selectedTicket])

  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    setEditedStatus(newStatus)

    if (selectedTicket?.status === 'closed' && newStatus === 'open') {
      setEditedDueDate(undefined)
    }
  }

  const statusChanged = editedStatus !== selectedTicket?.status
  const dueDateChanged = useMemo(
    () => toTimestamp(editedDueDate) !== toTimestamp(toValidDate(selectedTicket?.dueDate)),
    [editedDueDate, selectedTicket?.dueDate],
  )
  const hasChanges = statusChanged || dueDateChanged

  const handleUpdate = () => {
    if (!selectedTicket?.id || !hasChanges || isUpdating) return

    const payload = {
      ticketId: selectedTicket?.id,
      data: {},
    }

    if (statusChanged) payload.data.status = editedStatus
    if (dueDateChanged) payload.data.dueDate = editedDueDate?.toISOString() || null

    updateTicket(payload)
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel fontWeight="700">Status</FormLabel>
          <Select
            value={editedStatus || 'open'}
            onChange={handleStatusChange}
            bg="white"
            borderColor="gray.300"
            _hover={{ borderColor: 'brand.400' }}
            _focus={{
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #0877C9',
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </FormControl>

        <FormControl>
          <HStack justify="space-between" align="center" mb={2}>
            <FormLabel fontWeight="700" mb={0}>
              Due By
            </FormLabel>
            {editedDueDate && (
              <Button
                size="xs"
                variant="ghost"
                color="gray.600"
                onClick={() => setEditedDueDate(undefined)}
              >
                Clear date
              </Button>
            )}
          </HStack>
          <CustomDatePicker
            selectedDate={editedDueDate}
            onChange={setEditedDueDate}
            minDate={new Date()}
          />
          <Text mt={1.5} fontSize="xs" color="gray.500">
            Optional. Use this to prioritise tickets that need follow-up.
          </Text>
        </FormControl>

        <Button
          mt={2}
          bg="brand.500"
          color="white"
          onClick={handleUpdate}
          isDisabled={!hasChanges || isUpdating}
          isLoading={isUpdating}
          loadingText="Saving"
          _hover={{ bg: 'brand.600' }}
          _disabled={{
            bg: 'gray.200',
            color: 'gray.500',
            cursor: 'not-allowed',
          }}
        >
          Save Changes
        </Button>
      </VStack>
    </Box>
  )
}
