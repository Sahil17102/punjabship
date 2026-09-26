import { ChevronDownIcon } from '@chakra-ui/icons'
import { Box, Button, Collapse, Flex, Stack, Text, useColorModeValue } from '@chakra-ui/react'
import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PunjabShipNavIcon from './PunjabShipNavIcon'

const BRAND_RED = '#0877C9'

const SidebarContent = ({ logoText, routes, sidebarWidth, onHoverChange }) => {
  const location = useLocation()
  const [state, setState] = React.useState({})
  const [isHovered, setIsHovered] = React.useState(false)

  const sidebarBg = useColorModeValue('#FBFAFE', '#171820')
  const sidebarBorder = useColorModeValue('#D7DCE5', 'rgba(255,255,255,0.08)')
  const activeBg = useColorModeValue('#E9E3FF', 'rgba(8,119,201,0.26)')
  const inactiveBg = useColorModeValue('#F4F1FC', 'rgba(255,255,255,0.055)')
  const childBg = useColorModeValue('#FAF6EE', 'rgba(255,255,255,0.035)')
  const hoverBg = useColorModeValue('#EEE8FF', 'rgba(255,255,255,0.10)')
  const itemBorder = useColorModeValue('#E2DCF1', 'rgba(255,255,255,0.10)')
  const activeBorder = useColorModeValue('#0877C9', '#8B79F7')
  const textColor = useColorModeValue('#202938', 'rgba(255,255,255,0.86)')
  const activeText = useColorModeValue('#4B35B5', '#FFFFFF')
  const iconColor = useColorModeValue('#475467', 'rgba(255,255,255,0.66)')
  const dividerColor = useColorModeValue('#E1E5ED', 'rgba(255,255,255,0.08)')
  const thumbColor = useColorModeValue('#C5CBD6', 'rgba(255,255,255,0.18)')
  const brandText = useColorModeValue('#171820', 'white')

  const activeRoute = (routeName) => location.pathname.startsWith(routeName)

  const toggleCollapse = (key) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    routes.forEach((route) => {
      if (route.category && route.views) {
        const isChildActive = route.views.some((view) =>
          location.pathname.startsWith(view.layout + view.path.split('/:')[0]),
        )
        if (isChildActive) {
          setState((prev) => ({ ...prev, [route.state]: true }))
        }
      }
    })
  }, [location.pathname, routes])

  const collapsed = sidebarWidth <= 160
  const compact = sidebarWidth > 160 && sidebarWidth < 220
  const textSize = compact ? 'sm' : 'sm'
  const showText = !collapsed || isHovered
  const effectiveWidth = collapsed && isHovered ? 268 : sidebarWidth

  const renderLinkButton = (prop, isActive, depth = 0) => (
    <Button
      justifyContent={collapsed ? 'center' : 'flex-start'}
      w="100%"
      bg={isActive ? activeBg : depth ? childBg : inactiveBg}
      borderRadius="8px"
      mb="1"
      px={collapsed ? '2' : '2.5'}
      py={depth ? '6px' : '7px'}
      h="auto"
      border="1px solid"
      borderColor={isActive ? '#C5B9F5' : itemBorder}
      borderLeftColor={isActive ? activeBorder : itemBorder}
      boxShadow={isActive ? '0 3px 0 rgba(75,53,181,0.10)' : '0 2px 0 rgba(39,31,62,0.035)'}
      _hover={{ bg: isActive ? activeBg : hoverBg, borderColor: isActive ? '#A995F2' : '#CEC2EB', borderLeftColor: isActive ? activeBorder : '#CEC2EB', transform: 'translateX(2px)' }}
      transition="background-color 0.14s ease, border-color 0.14s ease, transform 0.14s ease"
    >
      <Flex
        align="center"
        justify={collapsed && !isHovered ? 'center' : 'flex-start'}
        gap="8px"
        w="100%"
      >
        {prop.icon && (
          <PunjabShipNavIcon
            icon={prop.icon}
            name={prop.name}
            path={prop.path}
            active={isActive}
            compact={depth > 0}
          />
        )}
        {showText && (
              <Text color={isActive ? activeText : textColor} fontWeight={isActive ? '700' : '600'} fontSize="13px" lineHeight="1.15">
                {prop.name}
              </Text>
        )}
      </Flex>
    </Button>
  )

  const renderLinks = (items, depth = 0) =>
    items
      .filter((prop) => prop.show !== false)
      .map((prop) => {
        if (prop.redirect) return null

        if (prop.category) {
          const isChildActive = prop.views.some((view) =>
            location.pathname.startsWith(view.layout + view.path.split('/:')[0]),
          )

          return (
            <Box key={prop.name} mb="1">
              <Button
                onClick={() => toggleCollapse(prop.state)}
                justifyContent={collapsed ? 'center' : 'space-between'}
                w="100%"
                bg={isChildActive ? activeBg : depth ? childBg : inactiveBg}
                borderRadius="8px"
                mb="1"
                px={collapsed ? '2' : '2.5'}
                py="7px"
                h="auto"
                border="1px solid"
                borderColor={isChildActive ? '#C5B9F5' : itemBorder}
                borderLeftColor={isChildActive ? activeBorder : itemBorder}
                boxShadow={isChildActive ? '0 3px 0 rgba(75,53,181,0.10)' : '0 2px 0 rgba(39,31,62,0.035)'}
                _hover={{ bg: isChildActive ? activeBg : hoverBg, borderColor: isChildActive ? '#A995F2' : '#CEC2EB', borderLeftColor: isChildActive ? activeBorder : '#CEC2EB', transform: 'translateX(2px)' }}
                transition="background-color 0.14s ease, border-color 0.14s ease, transform 0.14s ease"
              >
                <Flex
                  align="center"
                  justify={collapsed && !isHovered ? 'center' : 'flex-start'}
                  gap="8px"
                  w="100%"
                >
                  <PunjabShipNavIcon
                    icon={prop.icon}
                    name={prop.name}
                    path={prop.path}
                    active={isChildActive}
                  />
                  {showText && (
                    <Text
                      color={isChildActive ? activeText : textColor}
                      fontWeight={isChildActive ? '700' : '600'}
                      fontSize="13px"
                      lineHeight="1.15"
                      textAlign="left"
                      flex="1"
                    >
                      {prop.name}
                    </Text>
                  )}
                </Flex>
                {showText && (
                  <Box
                    transition="transform 0.2s"
                    transform={state[prop.state] ? 'rotate(180deg)' : 'rotate(0deg)'}
                    color={isChildActive ? BRAND_RED : iconColor}
                  >
                    <ChevronDownIcon />
                  </Box>
                )}
              </Button>
              <Collapse in={state[prop.state]} animateOpacity>
                <Box pl={showText ? '10px' : '0'} pr={showText ? '6px' : '0'} mt="0.5">
                  <Stack spacing="0.5">{renderLinks(prop.views, depth + 1)}</Stack>
                </Box>
              </Collapse>
            </Box>
          )
        }

        const isActive = activeRoute(prop.layout + prop.path)
        return (
          <NavLink to={prop.layout + prop.path} key={prop.name}>
            {renderLinkButton(prop, isActive, depth)}
          </NavLink>
        )
      })

  return (
    <Box
      pt="14px"
      pb="14px"
      h="100vh"
      w={`${effectiveWidth}px`}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={sidebarBorder}
      boxShadow="8px 0 24px rgba(35, 29, 52, 0.08)"
      position="fixed"
      left="0"
      top="0"
      transition="width 0.2s ease"
      zIndex="1500"
      onMouseEnter={() => {
        setIsHovered(true)
        onHoverChange?.(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        onHoverChange?.(false)
      }}
      overflowY="auto"
      overflowX="hidden"
      pr={collapsed && !isHovered ? '0' : '2'}
      css={{
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: thumbColor,
          borderRadius: '4px',
        },
      }}
    >
      <Box mb="12px" px="14px" textAlign="center" transition="all 0.3s ease">
        {showText ? (
          <Flex
            align="center"
            justify="center"
            gap="10px"
            px="12px"
            py="7px"
            borderRadius="4px"
          >
            <Box textAlign="center"><Box as="img" src="/logo/punjabship-logo.png" alt="PunjabShip" h="60px" w="185px" objectFit="contain" /><Text fontSize="11px" fontWeight="600" color={iconColor}>Admin Console</Text></Box>
          </Flex>
        ) : (
          <Box
            as="img"
            src="/logo/punjabship-mark.svg"
            alt="PunjabShip"
            h="38px"
            w="38px"
            mx="auto"
            objectFit="contain"
            p="2px"
            borderRadius="4px"
          />
        )}
      </Box>

      <Box h="1px" bg={dividerColor} mx="14px" mb="10px" />

      <Stack direction="column" spacing="0.5" px="10px">
        {renderLinks(routes)}
      </Stack>
    </Box>
  )
}

export default SidebarContent
