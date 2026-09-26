import { BellIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { ItemContent } from 'components/Menu/ItemContent'
import { useSocket } from 'hooks/useSocket'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from 'services/notification.service'
import { useNotificationsStore } from 'store/useNotificationsStore'
import { getAdminNotificationTarget } from 'utils/notificationNavigation'

export default function NotificationMenu({ themeStyles }) {
  const {
    notifications,
    setNotifications,
    markAsRead,
    unreadCount,
    markAllAsRead,
  } = useNotificationsStore()
  const [isLoading, setIsLoading] = useState(false)
  const history = useHistory()
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700')
  const unreadBg = useColorModeValue('gray.100', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  useSocket()

  // Initial fetch on mount
  useEffect(() => {
    setIsLoading(true)
    getNotifications()
      .then((data) => {
        setNotifications(data?.notifications)
      })
      .catch(() => setNotifications([]))
      .finally(() => setIsLoading(false))
  }, [setNotifications])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id)
      markAsRead(id)
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      markAllAsRead()
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await handleMarkRead(notification.id)
    history.push(getAdminNotificationTarget(notification))
  }

  return (
    <Menu>
      <MenuButton
        position="relative"
        p={2}
        borderRadius="full"
        _hover={{ bg: menuHoverBg }}
      >
        <BellIcon color={themeStyles.navbarIcon} w="22px" h="22px" />

        {unreadCount > 0 && (
          <Flex
            position="absolute"
            top="0px"
            right="0px"
            bg="red.500"
            color="white"
            fontSize="xs"
            fontWeight="bold"
            minW="18px"
            h="18px"
            borderRadius="full"
            align="center"
            justify="center"
            boxShadow="0 0 0 2px white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Flex>
        )}
      </MenuButton>

      <MenuList p="8px" minW="360px">
        <Flex align="center" px="8px" py="8px" borderBottomWidth="1px" borderColor={borderColor}>
          <Box>
            <Text fontWeight="700">Notifications</Text>
            <Text fontSize="xs" color="gray.500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </Box>
          <Spacer />
          <Button
            size="xs"
            variant="ghost"
            onClick={handleMarkAllRead}
            isDisabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </Flex>
        <Flex direction="column" maxH="320px" overflowY="auto" py="8px">
          {isLoading ? (
            <Text px="12px">Loading...</Text>
          ) : notifications?.length ? (
            notifications.slice(0, 8).map((n) => (
              <MenuItem
                key={n.id}
                borderRadius="8px"
                mb="6px"
                bg={!n.isRead ? unreadBg : 'transparent'}
                onClick={() => handleNotificationClick(n)}
                whiteSpace="normal"
                cursor="pointer"
              >
                <ItemContent
                  time={new Date(n.createdAt).toLocaleString()}
                  info={n.message}
                  boldInfo={n.title}
                  aName={n.senderName || ''}
                />
              </MenuItem>
            ))
          ) : (
            <Text px="12px">No notifications</Text>
          )}
        </Flex>
        <Box borderTopWidth="1px" borderColor={borderColor} pt="8px">
          <Button
            size="sm"
            variant="ghost"
            w="full"
            onClick={() => history.push('/admin/notifications')}
          >
            View all notifications
          </Button>
        </Box>
      </MenuList>
    </Menu>
  )
}
