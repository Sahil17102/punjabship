import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { changeAdminPassword } from 'services/auth.service'
import { useState } from 'react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/

export default function AdminChangePassword() {
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = () => {
    const nextErrors = {}

    if (!form.currentPassword.trim()) nextErrors.currentPassword = 'Current password is required'
    if (!form.newPassword.trim()) {
      nextErrors.newPassword = 'New password is required'
    } else if (!strongPasswordRegex.test(form.newPassword)) {
      nextErrors.newPassword = 'Must be 8+ chars with upper, lower, number'
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your new password'
    } else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      nextErrors.newPassword = 'New password must be different from current password'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      await changeAdminPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })

      toast({
        title: 'Password changed',
        description: 'Your admin password has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error?.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Box bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" p={6} shadow="md">
        <Heading size="md" mb={2}>
          Change Admin Password
        </Heading>
        <Text fontSize="sm" color="gray.500" mb={6}>
          Update your admin login password. You will stay logged in on this session.
        </Text>

        <FormControl isInvalid={!!errors.currentPassword} mb={4}>
          <FormLabel>Current Password</FormLabel>
          <InputGroup>
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
            <InputRightElement>
              <Button variant="ghost" size="sm" onClick={() => setShowCurrent((v) => !v)}>
                {showCurrent ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.newPassword} mb={4}>
          <FormLabel>New Password</FormLabel>
          <InputGroup>
            <Input
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <InputRightElement>
              <Button variant="ghost" size="sm" onClick={() => setShowNew((v) => !v)}>
                {showNew ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword} mb={6}>
          <FormLabel>Confirm New Password</FormLabel>
          <InputGroup>
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            <InputRightElement>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
        </FormControl>

        <Button colorScheme="purple" onClick={onSubmit} isLoading={loading} loadingText="Updating...">
          Change Password
        </Button>
      </Box>
    </Box>
  )
}
