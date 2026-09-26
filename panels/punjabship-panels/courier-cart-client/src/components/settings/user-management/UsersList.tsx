import {
  alpha,
  Avatar,
  Box,
  Button,
  Container,
  Fade,
  IconButton,
  Popover,
  Skeleton,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useEffect, useMemo, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { TbTrashFilled } from 'react-icons/tb'
import type { IEmployeePayload } from '../../../api/employee.service'
import {
  useDeleteEmployee,
  useEmployees,
  useToggleEmployeeStatus,
} from '../../../hooks/User/useUserManagement'
import StatusChip from '../../UI/chip/StatusChip'
import CustomInput from '../../UI/inputs/CustomInput'
import CustomSwitch from '../../UI/inputs/CustomSwitch'
import UserForm from './UserForm'

const UsersList = () => {
  const queryClient = useQueryClient()
  const limit = 15
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useEmployees(
    limit,
    query,
  )

  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee()
  const { mutate: toggleEmployeeStatus, isPending: isToggling } = useToggleEmployeeStatus()

  const users = data?.pages.flatMap((page) => page.employees) ?? []

  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedUser, setSelectedUser] = useState<IEmployeePayload | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editUser, setEditUser] = useState<IEmployeePayload | null>(null)

  const openPopover = (event: React.MouseEvent<HTMLElement>, user: IEmployeePayload) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const closePopover = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const confirmDelete = () => {
    if (selectedUser && selectedUser?.id) {
      deleteEmployee(selectedUser?.id, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
      })
    }
    closePopover()
  }

  const SkeletonUserCard = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        background: '#FAF7F5',
        border: '1px solid rgba(17, 17, 19, 0.08)',
        borderRadius: 3,
        gap: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="text" width={200} height={20} />
      </Box>
      <Skeleton variant="rounded" width={80} height={32} />
    </Box>
  )

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((val: string) => {
        setQuery(val)
        queryClient.invalidateQueries({ queryKey: ['employees'] })
      }, 400),
    [queryClient],
  )

  useEffect(() => {
    debouncedSearch(search)
    return debouncedSearch.cancel
  }, [search])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const glass = {
    background: '#FFFFFF',
    border: '1px solid rgba(17, 17, 19, 0.08)',
    p: 2,
    borderRadius: 3,
    boxShadow: '0 18px 34px rgba(17, 17, 19, 0.08)',
  }

  return (
    <Container maxWidth="lg">
      {/* Search input */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <CustomInput
          type="text"
          width="420px"
          placeholder="Search employees by name, email or phone..."
          value={search}
          onChange={handleSearchChange}
          prefix={<FaSearch style={{ marginRight: 8, color: '#555' }} />}
          postfix={
            search && (
              <span
                onClick={() => setSearch('')}
                style={{ cursor: 'pointer', marginLeft: 8, fontWeight: 'bold' }}
              >
                ×
              </span>
            )
          }
        />
      </Box>

      {/* Users list */}
      <Box
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
          if (scrollTop + clientHeight >= scrollHeight - 50 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        sx={{
          maxHeight: '75vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {isLoading && Array.from({ length: limit }).map((_, idx) => <SkeletonUserCard key={idx} />)}

        {users?.map((user) => (
          <Box
            key={user.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              gap: 2,
              borderRadius: 3,
              border: '1px solid rgba(17, 17, 19, 0.08)',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F5 100%)',
              boxShadow: '0 12px 24px rgba(17, 17, 19, 0.04)',
            }}
          >
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Box position="relative">
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  {user.name[0]}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: user.isOnline ? 'success.main' : 'error.main',
                    border: '1px solid white',
                  }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                {user.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {user.phone}
                  </Typography>
                )}
                <StatusChip
                  label={user?.isActive ? 'Active' : 'Inactive'}
                  status={user?.isActive ? 'success' : 'info'}
                />

                <StatusChip label={user?.role} status={'info'} />
              </Box>
            </Box>

            {/* Actions */}
            <Box display="flex" gap={1} alignItems="center">
              <CustomSwitch
                label="Active Status"
                checked={user.isActive}
                onChange={(e) =>
                  toggleEmployeeStatus(
                    { id: user.id, isActive: e.target.checked },
                    {
                      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
                    },
                  )
                }
                disabled={isToggling}
                helperText={isToggling ? 'Updating status...' : 'Enable/disable employee access'}
              />
              <Button
                size="small"
                variant="contained"
                sx={{ borderRadius: 2 }}
                onClick={() => {
                  setEditUser(user)
                  setOpenForm(true)
                }}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                color="error"
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha('#0877C9', 0.16)}`,
                  backgroundColor: alpha('#0877C9', 0.05),
                }}
                onClick={(e) => openPopover(e, user)}
              >
                {' '}
                <TbTrashFilled />
              </IconButton>
            </Box>
          </Box>
        ))}

        {isFetchingNextPage &&
          Array.from({ length: 5 }).map((_, idx) => <SkeletonUserCard key={`sk-${idx}`} />)}

        {!hasNextPage && !isLoading && (
          <Typography align="center" variant="body2" color="text.secondary" mt={1}>
            No more users
          </Typography>
        )}
      </Box>

      {/* Delete Confirmation Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        sx={{ mt: 1 }}
        onClose={closePopover}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: glass } }}
      >
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Confirm Deletion
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Are you sure you want to delete <b>{selectedUser?.name}</b>?
        </Typography>
        <Box display="flex" gap={1} justifyContent="flex-end">
          <Button size="small" onClick={closePopover}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Popover>

      <UserForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setEditUser(null)
        }}
        defaultValues={editUser || undefined}
      />
    </Container>
  )
}

export default UsersList
