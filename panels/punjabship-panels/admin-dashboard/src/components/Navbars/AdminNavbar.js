import {
  Box,
  Flex,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import AdminNavbarLinks from './AdminNavbarLinks'

export default function AdminNavbar(props) {
  const { brandText = 'PunjabShip Admin', fixed, secondary, onOpen, sidebarWidth = 76 } = props
  const titleColor = useColorModeValue('#30236E', 'white')

  let navbarPosition = fixed ? 'fixed' : 'absolute'
  let navbarShadow = 'none'
  let navbarBg = useColorModeValue('#FFFFFF', '#171820')
  let navbarBorder = useColorModeValue('#D7DCE5', 'rgba(255,255,255,0.08)')
  let secondaryMargin = '0px'
  let paddingX = '18px'

  const fixedNavbarBg = useColorModeValue('#FFFFFF', '#171820')
  const fixedNavbarBorder = useColorModeValue(
    '#E2E5EA',
    'rgba(255, 255, 255, 0.12)',
  )

  if (fixed === true) {
    navbarShadow = 'none'
    navbarBg = fixedNavbarBg
    navbarBorder = fixedNavbarBorder
  }

  if (secondary) {
    navbarPosition = 'absolute'
    secondaryMargin = '0px'
    paddingX = '26px'
  }

  return (
    <Flex
      data-testid="admin-top-navbar"
      position={navbarPosition}
      boxShadow={navbarShadow}
      bg={navbarBg}
      borderColor={navbarBorder}
      borderBottomWidth="1px"
      borderStyle="solid"
      boxSizing="border-box"
      transition="left 0.2s ease, width 0.2s ease"
      zIndex="1400"
      alignItems={{ xl: 'center' }}
      borderRadius="0"
      display="flex"
      minH={{ base: '104px', md: '64px' }}
      justifyContent={{ xl: 'center' }}
      mx="auto"
      mt={secondaryMargin}
      left={{ base: '0', xl: document.documentElement.dir === 'rtl' ? '0' : `${sidebarWidth}px` }}
      right="0"
      px={{ sm: paddingX, md: '24px' }}
      py="10px"
      top="0"
      w="auto"
    >
      <Flex
        w="100%"
        alignItems={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '8px', md: '18px' }}
      >
        <Text
          as="h1"
          color={secondary ? 'white' : titleColor}
          fontFamily="'Hahmlet Variable', Georgia, serif"
          fontSize={{ base: '16px', md: '18px' }}
          fontWeight="700"
          lineHeight="1.2"
          maxW={{ base: '100%', md: '280px' }}
          minW="0"
          noOfLines={1}
          title={brandText}
        >
          {brandText}
        </Text>

        <Box ms={{ base: '0', md: 'auto' }} w={{ base: '100%', md: 'unset' }}>
          <AdminNavbarLinks onOpen={onOpen} logoText={props.logoText} secondary={secondary} fixed={fixed} />
        </Box>
      </Flex>
    </Flex>
  )
}

AdminNavbar.propTypes = {
  variant: PropTypes.string,
  secondary: PropTypes.bool,
  fixed: PropTypes.bool,
  onOpen: PropTypes.func,
  sidebarWidth: PropTypes.number,
  brandText: PropTypes.string,
}
