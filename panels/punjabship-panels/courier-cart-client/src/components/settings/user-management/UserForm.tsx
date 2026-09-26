import { Box, Chip, Paper, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import type { IEmployeePayload } from '../../../api/employee.service'
import { useCreateEmployee, useUpdateEmployee } from '../../../hooks/User/useUserManagement'
import { glassStyles } from '../../UI/accordion/FormSectionAccordion'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import PageHeading from '../../UI/heading/PageHeading'
import CustomInput from '../../UI/inputs/CustomInput'
import PasswordField from '../../UI/inputs/PasswordField'
import CustomDialog from '../../UI/modal/CustomModal'
import {
  DEFAULT_EMPLOYEE_MODULE_FLAGS,
  EMPLOYEE_MODULES,
  type EmployeeModule,
} from '../../../utils/employeeAccess'

type FormValues = {
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  role: string
  access: {
    modules: Record<EmployeeModule, boolean>
    orders: {
      cancelOrders: boolean
      exportOrders: boolean
      exportCustomerDetails: boolean
      viewCustomerDetails: boolean
      changePaymentMode: boolean
    }
  }
}

interface UserFormProps {
  open: boolean
  onClose: () => void
  defaultValues?: IEmployeePayload
}

const UserForm: React.FC<UserFormProps> = ({ open, onClose, defaultValues }) => {
  const isEdit = Boolean(defaultValues?.id)
  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaultValues || {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      access: {
        modules: { ...DEFAULT_EMPLOYEE_MODULE_FLAGS },
        orders: {
          cancelOrders: false,
          exportOrders: false,
          exportCustomerDetails: false,
          viewCustomerDetails: false,
          changePaymentMode: false,
        },
      },
    },
  })

  const { mutate: createEmployee, isPending } = useCreateEmployee()
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee()

  const buildLegacyModuleDefaults = () =>
    Object.fromEntries(EMPLOYEE_MODULES.map((module) => [module, true])) as FormValues['access']['modules']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitHandler: SubmitHandler<any> = (data) => {
    if (!isEdit && data.password !== data.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    const payload = {
      ...data,
      moduleAccess: data.access,
    }

    if (isEdit && defaultValues?.id) {
      updateEmployee(
        { id: defaultValues.id, data: payload },
        {
          onSuccess: () => {
            onClose()
            reset()
          },
        },
      )
    } else {
      createEmployee(payload, {
        onSuccess: () => {
          onClose()
          reset()
        },
      })
    }
  }

  useEffect(() => {
    if (defaultValues) {
      const moduleAccess = defaultValues.moduleAccess as FormValues['access'] | undefined
      reset({
        ...defaultValues,
        access: {
          modules: moduleAccess?.modules || buildLegacyModuleDefaults(),
          orders: {
            cancelOrders: moduleAccess?.orders?.cancelOrders ?? false,
            exportOrders: moduleAccess?.orders?.exportOrders ?? false,
            exportCustomerDetails: moduleAccess?.orders?.exportCustomerDetails ?? false,
            viewCustomerDetails: moduleAccess?.orders?.viewCustomerDetails ?? false,
            changePaymentMode: moduleAccess?.orders?.changePaymentMode ?? false,
          },
        },
        password: '',
        confirmPassword: '',
      })
    }
  }, [defaultValues, reset])

  const orderPermissions = [
    { key: 'cancelOrders', label: 'Cancel Orders' },
    { key: 'exportOrders', label: 'Export Orders' },
    { key: 'exportCustomerDetails', label: 'Export Customer Details' },
    { key: 'viewCustomerDetails', label: 'View Customer Details' },
    { key: 'changePaymentMode', label: 'Change Payment Mode' },
  ] as const
  const ordersModuleEnabled = watch('access.modules.orders')

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Employee' : 'Add New Employee'}
      width="87vh"
      footer={
        <CustomIconLoadingButton
          text={isEdit ? 'Update' : 'Save'}
          loadingText={isEdit ? 'Updating...' : 'Please wait..'}
          loading={isEdit ? isUpdating : isPending}
          onClick={handleSubmit(submitHandler)}
        />
      }
    >
      <form onSubmit={handleSubmit(submitHandler)}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* User Details */}
          <Paper sx={{ ...glassStyles, p: 2 }} elevation={3}>
            <PageHeading title="User Details" fontSize={19} />
            <Box mt={2} display="flex" flexDirection="column" gap={1}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Name"
                    placeholder="Enter full name"
                    required
                    helperText={errors.name?.message}
                    error={!!errors.name?.message}
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Email"
                    placeholder="Enter email"
                    required
                    helperText={errors.email?.message}
                    error={!!errors.email?.message}
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/, // exactly 10 digits
                    message: 'Phone must be exactly 10 digits',
                  },
                }}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Phone"
                    placeholder="Enter phone number"
                    required
                    helperText={errors.phone?.message}
                    error={!!errors.phone?.message}
                  />
                )}
              />

              {/* Password Field */}
              <PasswordField
                isEdit={isEdit}
                control={control}
                errors={errors}
                watchPassword={watch('password')}
              />

              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: isEdit ? false : 'Confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                }}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    type="password"
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    required
                    helperText={errors.confirmPassword?.message}
                    error={!!errors.confirmPassword?.message}
                  />
                )}
              />
            </Box>
          </Paper>

          {/* Permissions */}
          <Paper
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            }}
            elevation={3}
          >
            <PageHeading title="Permissions" fontSize={18} />
            <Box mt={2} display="flex" flexDirection="column" gap={1}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Module Visibility:
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                }}
                gap={0.8}
              >
                {EMPLOYEE_MODULES.map((module) => (
                  <Controller
                    key={module}
                    name={`access.modules.${module}`}
                    control={control}
                    render={({ field }) => (
                      <Chip
                        label={module.charAt(0).toUpperCase() + module.slice(1)}
                        size="small"
                        clickable
                        color={field.value ? 'primary' : 'default'}
                        variant={field.value ? 'filled' : 'outlined'}
                        onClick={() => field.onChange(!field.value)}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          justifySelf: 'start',
                        }}
                      />
                    )}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Order Actions:
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                  lg: 'repeat(5, 1fr)',
                }}
                gap={0.8}
              >
                {orderPermissions.map((perm) => (
                  <Controller
                    key={perm.key}
                    name={`access.orders.${perm.key}`}
                    control={control}
                    render={({ field }) => (
                      <Chip
                        label={perm.label}
                        size="small"
                        clickable
                        color={field.value || (perm.key === 'exportOrders' && ordersModuleEnabled) ? 'primary' : 'default'}
                        variant={field.value || (perm.key === 'exportOrders' && ordersModuleEnabled) ? 'filled' : 'outlined'}
                        onClick={() => field.onChange(!field.value)}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          transition: 'all 0.15s',
                          justifySelf: 'start',
                          opacity: perm.key === 'exportOrders' && ordersModuleEnabled ? 0.9 : 1,
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
                          },
                        }}
                      />
                    )}
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      </form>
    </CustomDialog>
  )
}

export default UserForm
