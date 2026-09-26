import { Box, Button, Flex, HStack, Link, Text, useColorModeValue } from '@chakra-ui/react'
import { DocumentIcon, HomeIcon, PersonIcon, RocketIcon } from 'components/Icons/Icons'
import SidebarResponsive from 'components/Sidebar/SidebarResponsive'
import PropTypes from 'prop-types'
import React from 'react'
import { NavLink } from 'react-router-dom'
import routes from 'routes.js'

export default function AuthNavbar(props) {
  const { logoText, secondary, ...rest } = props

  const navbarIcon = secondary ? 'white' : useColorModeValue('gray.700', 'gray.200')
  const mainText = secondary ? 'white' : useColorModeValue('gray.800', 'gray.100')
  const navbarBg = secondary
    ? 'none'
    : useColorModeValue(
        'linear-gradient(110deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.88) 100%)',
        'linear-gradient(110deg, rgba(16, 28, 52, 0.92) 0%, rgba(10, 18, 36, 0.9) 100%)',
      )
  const navbarBorder = secondary ? 'none' : useColorModeValue('1px solid rgba(148, 163, 184, 0.35)', '1px solid rgba(148, 163, 184, 0.25)')
  const navbarShadow = secondary ? 'none' : useColorModeValue('0 12px 30px rgba(15, 46, 102, 0.12)', '0 14px 36px rgba(2, 8, 23, 0.5)')

  const brand = (
    <Link href={`${process.env.PUBLIC_URL}/#/`} display="flex" lineHeight="100%" fontWeight="700" justifyContent="center" alignItems="center" color={mainText}>
      <Box as="img" src="/logo/punjabship-mark.svg" alt="PunjabShip" h="34px" w="34px" objectFit="contain" borderRadius="10px" me="10px" />
      <Text fontSize="sm" mt="1px">
        {logoText || 'PunjabShip'}
      </Text>
    </Link>
  )

  const linksAuth = (
    <HStack display={{ sm: 'none', lg: 'flex' }}>
      <NavLink to="/admin/dashboard">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<HomeIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Dashboard</Text>
        </Button>
      </NavLink>
      <NavLink to="/admin/profile">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<PersonIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Profile</Text>
        </Button>
      </NavLink>
      <NavLink to="/auth/signup">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<RocketIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Sign Up</Text>
        </Button>
      </NavLink>
      <NavLink to="/auth/signin">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<DocumentIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Sign In</Text>
        </Button>
      </NavLink>
    </HStack>
  )

  return (
    <Flex
      position={secondary ? 'absolute' : 'fixed'}
      top="16px"
      left="50%"
      transform="translate(-50%, 0px)"
      background={navbarBg}
      border={navbarBorder}
      boxShadow={navbarShadow}
      backdropFilter={secondary ? 'none' : 'blur(12px)'}
      borderRadius="16px"
      px="16px"
      py="16px"
      mx="auto"
      width="1100px"
      maxW="92%"
      alignItems="center"
    >
      <Flex w="100%" justifyContent={{ sm: 'start', lg: 'space-between' }}>
        {brand}
        <Box ms={{ base: 'auto', lg: '0px' }} display={{ base: 'flex', lg: 'none' }}>
          <SidebarResponsive logoText={logoText || 'PunjabShip'} secondary={secondary} routes={routes} {...rest} />
        </Box>
        {linksAuth}
        <Link href="/auth/signin">
          <Button
            bg="brand.500"
            color="white"
            fontSize="xs"
            borderRadius="10px"
            px="18px"
            display={{ sm: 'none', lg: 'flex' }}
            _hover={{ bg: 'brand.600' }}
          >
            Admin Login
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}

AuthNavbar.propTypes = {
  color: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  brandText: PropTypes.string,
}
