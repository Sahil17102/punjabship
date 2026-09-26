/*eslint-disable*/
import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from 'store/useAuthStore'
import { filterAdminRoutes } from 'utils/adminRouteAccess'
import PunjabShipNavIcon from './PunjabShipNavIcon'

function SidebarResponsive(props) {
  const location = useLocation()
  const mainPanel = React.useRef()

  const activeRoute = (routeName) => (location.pathname.startsWith(routeName) ? 'active' : '')

  const drawerBg = useColorModeValue('#FFFFFF', '#171820')
  const activeBg = useColorModeValue('#5B3FD1', 'rgba(8,119,201,0.28)')
  const hoverBg = useColorModeValue('#EEF0F5', 'rgba(148, 163, 184, 0.14)')
  const textColor = useColorModeValue('#202938', 'gray.100')
  const activeTextColor = '#FFFFFF'
  const dividerColor = useColorModeValue('rgba(148, 163, 184, 0.28)', 'rgba(148, 163, 184, 0.24)')

  const createLinks = (routes) => {
    return routes
      .filter((prop) => prop.show !== false)
      .map((prop) => {
        if (prop.redirect) return null

        if (prop.category) {
          const isChildActive = prop.views.some((view) =>
            location.pathname.startsWith(view.layout + view.path.split('/:')[0]),
          )
          return (
            <Box key={prop.name}>
              <Flex align="center" gap="10px" mb="10px" ps="8px" pt="8px">
                <PunjabShipNavIcon icon={prop.icon} name={prop.name} path={prop.path} active={isChildActive} compact />
                <Text color={textColor} fontWeight="700">
                  {document.documentElement.dir === 'rtl' ? prop.rtlName : prop.name}
                </Text>
              </Flex>
              {createLinks(prop.views)}
            </Box>
          )
        }

        const isActive = activeRoute(prop.layout + prop.path) === 'active'

        return (
          <NavLink to={prop.layout + prop.path} key={prop.name}>
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              bg={isActive ? activeBg : 'transparent'}
              mb="8px"
              px="12px"
              py="11px"
              borderRadius="10px"
              w="100%"
              border="1px solid"
              borderColor={isActive ? 'rgba(217, 4, 22, 0.26)' : 'transparent'}
              _hover={{ bg: hoverBg, transform: 'translateX(2px)' }}
              _active={{ bg: 'inherit', transform: 'none' }}
              _focus={{ boxShadow: 'none' }}
              transition="all 0.2s ease"
            >
              <Flex align="center">
                <Box me="12px">
                  <PunjabShipNavIcon icon={prop.icon} name={prop.name} path={prop.path} active={isActive} compact />
                </Box>
                <Text color={isActive ? activeTextColor : textColor} my="auto" fontSize="sm" fontWeight={isActive ? '700' : '600'}>
                  {document.documentElement.dir === 'rtl' ? prop.rtlName : prop.name}
                </Text>
              </Flex>
            </Button>
          </NavLink>
        )
      })
  }

  const { logoText, routes } = props
  const adminAccess = useAuthStore((state) => state.adminAccess)
  const visibleRoutes = filterAdminRoutes(routes, adminAccess)
  const links = <>{createLinks(visibleRoutes)}</>

  const brand = (
    <Box pt="24px" mb="10px">
      <Flex align="center" justify="center" gap="10px" mb="16px" fontWeight="bold">
        <Box as="img" src="/logo/punjabship-mark.svg" alt="PunjabShip" h="32px" w="32px" objectFit="contain" borderRadius="10px" />
        <Text fontSize="sm" color={textColor} fontWeight="700">
          {logoText}
        </Text>
      </Flex>
      <Box h="1px" bg={dividerColor} mx="4px" mb="12px" />
    </Box>
  )

  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  const hamburgerColor = props.secondary ? 'white' : useColorModeValue('gray.600', 'gray.200')

  return (
    <Flex display={{ sm: 'flex', xl: 'none' }} ref={mainPanel} alignItems="center">
      <HamburgerIcon
        color={hamburgerColor}
        w="20px"
        h="20px"
        ref={btnRef}
        cursor="pointer"
        onClick={onOpen}
      />
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={document.documentElement.dir === 'rtl' ? 'right' : 'left'}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(5px)" />
        <DrawerContent w="280px" maxW="280px" borderRadius="0 18px 18px 0" bg={drawerBg}>
          <DrawerCloseButton _focus={{ boxShadow: 'none' }} color={textColor} />
          <DrawerBody px="14px" pt="2">
            <Box maxW="100%" h="100vh">
              {brand}
              <Stack direction="column" mb="40px">
                <Box>{links}</Box>
              </Stack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}

export default SidebarResponsive
