import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import Card from 'components/Card/Card'
import { useEffect, useState } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { useHistory } from 'react-router-dom'
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from 'services/notification.service'
import { useNotificationsStore } from 'store/useNotificationsStore'
import { getAdminNotificationTarget } from 'utils/notificationNavigation'

export default function AdminNotificationsPage() {
  const history = useHistory()
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } =
    useNotificationsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const panelBg = useColorModeValue('white', 'navy.800')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const unreadBg = useColorModeValue('blue.50', 'whiteAlpha.100')
  const mutedText = useColorModeValue('gray.500', 'gray.300')
  const bodyText = useColorModeValue('gray.700', 'white')

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    getNotifications()
      .then((data) => {
        if (mounted) setNotifications(data?.notifications || [])
      })
      .catch(() => {
        if (mounted) setNotifications([])
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [setNotifications])

  const handleReadAll = async () => {
    setActiveId('all')
    try {
      await markAllNotificationsAsRead()
      markAllAsRead()
    } finally {
      setActiveId(null)
    }
  }

  const handleOpen = async (notification) => {
    setActiveId(notification.id)
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id)
        markAsRead(notification.id)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setActiveId(null)
      history.push(getAdminNotificationTarget(notification))
    }
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} mb="20px" gap="12px" wrap="wrap">
        <Box>
          <Heading size="md">Notifications</Heading>
          <Text fontSize="sm" color={mutedText} mt="4px">
            Admin alerts, COD remittance updates, NDR, RTO, and operational events.
          </Text>
        </Box>
        <Button onClick={handleReadAll} isDisabled={unreadCount === 0} isLoading={activeId === 'all'}>
          Mark all read
        </Button>
      </Flex>

      <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} p="0" overflow="hidden">
        {isLoading ? (
          <Flex py="50px" justify="center">
            <Spinner />
          </Flex>
        ) : notifications.length === 0 ? (
          <Box p="24px">
            <Text color={mutedText}>No notifications yet.</Text>
          </Box>
        ) : (
          <Stack spacing="0">
            {notifications.map((notification) => (
              <Flex
                key={notification.id}
                p="18px"
                borderBottomWidth="1px"
                borderColor={borderColor}
                bg={notification.isRead ? 'transparent' : unreadBg}
                align={{ base: 'flex-start', md: 'center' }}
                justify="space-between"
                gap="16px"
                direction={{ base: 'column', md: 'row' }}
                role="link"
                tabIndex={0}
                cursor="pointer"
                transition="background-color 140ms ease, box-shadow 140ms ease"
                _hover={{ bg: notification.isRead ? 'gray.50' : 'blue.100' }}
                _focusVisible={{ boxShadow: 'inset 0 0 0 2px var(--chakra-colors-blue-500)' }}
                onClick={() => handleOpen(notification)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleOpen(notification)
                  }
                }}
              >
                <Box flex="1">
                  <Flex align="center" gap="10px" mb="6px" wrap="wrap">
                    <Text fontWeight="700" color={bodyText}>
                      {notification.title}
                    </Text>
                    {!notification.isRead ? <Badge colorScheme="blue">Unread</Badge> : null}
                  </Flex>
                  <Text color={bodyText} mb="8px">
                    {notification.message}
                  </Text>
                  <Text fontSize="xs" color={mutedText}>
                    {notification.createdAt
                      ? new Date(notification.createdAt).toLocaleString()
                      : 'Unknown time'}
                  </Text>
                </Box>
                <Flex align="center" gap="6px" color="blue.600" fontWeight="700" flexShrink={0}>
                  <Text fontSize="sm">{activeId === notification.id ? 'Opening...' : 'Open'}</Text>
                  <IconChevronRight size={18} />
                </Flex>
              </Flex>
            ))}
          </Stack>
        )}
      </Card>
    </Flex>
  )
}
