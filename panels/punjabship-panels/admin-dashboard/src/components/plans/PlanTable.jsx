import { CheckCircleIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import {
  Button,
  HStack,
  IconButton,
  Tag,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const PlanTable = ({ data, loading, onEdit, onDelete, onActivate }) => {
  const captions = ['Name', 'Description', 'Business Type', 'Status']
  const columnKeys = ['name', 'description', 'business_type', 'is_active']

  const renderers = {
    business_type: (value) => (
      <Tag colorScheme={value === 'b2b' ? 'blue' : 'orange'} variant="subtle">
        {String(value || 'b2c').toUpperCase()}
      </Tag>
    ),
    is_active: (val) => (
      <StatusBadge status={val ? 'Active' : 'Inactive'} type={val ? 'success' : 'error'} />
    ),
  }

  const renderActions = (row) => {
    const isBasicPlan = row?.name.toLowerCase() === 'basic' // Prevent basic plan deactivation

    return (
      <HStack spacing={3}>
        {/* Edit Button */}
        <IconButton
          aria-label="Edit"
          icon={<EditIcon />}
          size="sm"
          colorScheme="yellow"
          onClick={() => onEdit(row)}
        />

        {/* Delete Button with Popover */}
        {row?.is_active ? (
          <Popover placement="top" isLazy>
            <PopoverTrigger>
              <IconButton
                aria-label="Delete"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                isDisabled={isBasicPlan} // cannot delete basic plan
              />
            </PopoverTrigger>

            <Portal>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold">Confirm Delete</PopoverHeader>
                <PopoverBody>
                  <Text>
                    Deleting this plan will mark it as <b>inactive</b> and assign the{' '}
                    <b>basic plan for the same business type</b> to all users currently on this
                    plan.
                  </Text>
                </PopoverBody>
                <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => onDelete(row.id)}>
                    Confirm
                  </Button>
                </PopoverFooter>
              </PopoverContent>
            </Portal>
          </Popover>
        ) : null}

        {!isBasicPlan && !row?.is_active ? (
          <Button
            aria-label="activate"
            leftIcon={<CheckCircleIcon />}
            size="sm"
            colorScheme="messenger"
            onClick={() => onActivate?.({ ...row, is_active: true })}
          >
            Activate
          </Button>
        ) : null}
      </HStack>
    )
  }

  return (
    <GenericTable
      title="Plans"
      data={data}
      captions={captions}
      columnKeys={columnKeys}
      renderers={renderers}
      renderActions={renderActions}
      loading={loading}
      paginated={false}
    />
  )
}

export default PlanTable
