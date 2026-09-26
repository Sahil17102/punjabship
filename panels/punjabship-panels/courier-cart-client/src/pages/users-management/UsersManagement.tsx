import { Button } from '@mui/material'
import { useState } from 'react'
import { FaUserPlus } from 'react-icons/fa'
import AdminPageShell from '../../components/admin/AdminPageShell'
import UserForm from '../../components/settings/user-management/UserForm'
import UsersList from '../../components/settings/user-management/UsersList'

const UsersManagement = () => {
  const [openDialog, setOpenDialog] = useState(false)

  return (
    <>
      <AdminPageShell
        title="User access management"
        badge="Team"
        description="Create employee accounts, control access, and keep the PunjabShip admin workspace limited to the right operators."
        metrics={[
          { label: 'Access model', value: 'Role-based', hint: 'Employee access stays structured' },
          { label: 'Account actions', value: 'Create, edit, disable', hint: 'All key controls in one place' },
          { label: 'Ops readiness', value: 'Always visible', hint: 'Status and availability stay clear' },
        ]}
        primaryAction={
          <Button
            variant="contained"
            startIcon={<FaUserPlus />}
            sx={{ borderRadius: 2, minHeight: 44 }}
            onClick={() => setOpenDialog(true)}
          >
            Add user
          </Button>
        }
      >
        <UsersList />
      </AdminPageShell>

      <UserForm open={openDialog} onClose={() => setOpenDialog(false)} />
    </>
  )
}

export default UsersManagement
