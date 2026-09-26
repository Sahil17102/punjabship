import { ChevronDownIcon, CopyIcon } from '@chakra-ui/icons'
import {
  Avatar,
  Box,
  Button,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
  useClipboard,
  useColorModeValue,
} from '@chakra-ui/react'
import { RiMoreFill } from 'react-icons/ri'

const Header = ({
  backgroundHeader,
  backgroundProfile,
  avatarImage,
  name,
  email,
  phone,
  userId, // <-- added
  publicUserId,
  companyLogo,
  tabs,
  onTabClick,
  activeTab,
  actionSlot,
}) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const borderProfileColor = useColorModeValue('white', 'rgba(255, 255, 255, 0.31)')
  const emailColor = useColorModeValue('gray.400', 'gray.300')
  const displayUserId = publicUserId || userId
  const { hasCopied, onCopy } = useClipboard(displayUserId ? String(displayUserId) : '')

  const visibleTabs = tabs.slice(0, 3)
  const extraTabs = tabs.length > 3 ? tabs.slice(3) : []

  const handleTabClick = (tab) => {
    if (onTabClick) {
      onTabClick(tab)
    }
  }

  return (
    <Box
      mb={{ sm: '205px', md: '75px', xl: '70px' }}
      borderRadius="15px"
      px="0px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      align="center"
    >
      <Box
        bgImage={backgroundHeader}
        w="100%"
        h="300px"
        borderRadius="25px"
        bgPosition="50%"
        bgRepeat="no-repeat"
        position="relative"
        display="flex"
        justifyContent="center"
      >
        {/* Company Logo */}
        {companyLogo && (
          <Image
            src={companyLogo}
            alt="Company Logo"
            position="absolute"
            top="20px"
            right="20px"
            boxSize="60px"
            borderRadius="full"
            objectFit="cover"
            border="2px solid white"
            shadow="md"
            bg="white"
          />
        )}

        <Flex
          direction={{ sm: 'column', md: 'row' }}
          mx="1.5rem"
          maxH="330px"
          w={{ sm: '90%', xl: '100%' }}
          justifyContent={{ sm: 'center', md: 'space-between' }}
          align="center"
          backdropFilter="saturate(200%) blur(50px)"
          position="absolute"
          boxShadow="0px 2px 5.5px rgba(0, 0, 0, 0.02)"
          border="2px solid"
          borderColor={borderProfileColor}
          bg={backgroundProfile}
          p="24px"
          borderRadius="20px"
          transform={{
            sm: 'translateY(45%)',
            md: 'translateY(110%)',
            lg: 'translateY(160%)',
          }}
        >
          {/* Profile Info */}
          <Flex
            align="center"
            mb={{ sm: '10px', md: '0px' }}
            direction={{ sm: 'column', md: 'row' }}
            w={{ sm: '100%' }}
            textAlign={{ sm: 'center', md: 'start' }}
          >
            <Avatar me={{ md: '22px' }} src={avatarImage} w="80px" h="80px" borderRadius="15px" />
            <Flex direction="column" maxWidth="100%" my={{ sm: '14px' }}>
              <Text fontSize={{ sm: 'lg', lg: 'xl' }} color={textColor} fontWeight="bold">
                {name}
              </Text>

              {/* Email + Phone same line if both exist */}
              {email && phone ? (
                <Text fontSize={{ sm: 'sm', md: 'md' }} color={emailColor} fontWeight="semibold">
                  {email} &nbsp;|&nbsp; {phone}
                </Text>
              ) : (
                <>
                  {email && (
                    <Text
                      fontSize={{ sm: 'sm', md: 'md' }}
                      color={emailColor}
                      fontWeight="semibold"
                    >
                      {email}
                    </Text>
                  )}
                  {phone && (
                    <Text
                      fontSize={{ sm: 'sm', md: 'md' }}
                      color={emailColor}
                      fontWeight="semibold"
                    >
                      {phone}
                    </Text>
                  )}
                </>
              )}

              {/* User ID with copy */}
              {displayUserId && (
                <Flex align="center" mt={1}>
                  <Text fontSize="xs" color={emailColor} fontWeight="medium">
                    User ID: #{displayUserId}
                  </Text>
                  <Tooltip label={hasCopied ? 'Copied!' : 'Copy ID'}>
                    <IconButton
                      icon={<CopyIcon />}
                      size="xs"
                      ml={2}
                      variant="ghost"
                      onClick={onCopy}
                      aria-label="Copy User ID"
                    />
                  </Tooltip>
                </Flex>
              )}
            </Flex>
          </Flex>

          <Flex
            direction="column"
            align={{ sm: 'center', md: 'flex-end' }}
            gap="12px"
            w={{ sm: '100%', md: '50%', lg: '100%' }}
          >
            {actionSlot && (
              <Flex justify={{ sm: 'center', md: 'flex-end' }} w="100%" minH="40px" align="center">
                {actionSlot}
              </Flex>
            )}

            {/* Tabs */}
            <Flex
              direction={{ sm: 'column', lg: 'row' }}
              w="100%"
              justify={{ lg: 'flex-end' }}
              align="center"
              gap={2}
              flexWrap="wrap"
            >
              {visibleTabs.map((tab) => (
                <Button
                  key={tab.path}
                  p="0px"
                  h="40px"
                  minW={{ base: '100%', lg: '140px' }}
                  bg="transparent"
                  _hover={{ bg: 'none' }}
                  onClick={() => handleTabClick(tab?.path)}
                >
                  <Flex
                    align="center"
                    w="100%"
                    minW={{ lg: '140px' }}
                    bg={activeTab?.path === tab.path ? 'hsla(0,0%,100%,.3)' : 'transparent'}
                    borderRadius="14px"
                    justifyContent="center"
                    py="10px"
                    px="12px"
                    boxShadow={
                      activeTab?.path === tab.path
                        ? 'inset 0 0 1px 1px hsl(0deg 0% 100% / 90%), 0 30px 27px 0 rgb(0 0 0 / 5%)'
                        : 'none'
                    }
                    border={activeTab?.path === tab.path ? '1px solid gray.700' : 'none'}
                    cursor="pointer"
                  >
                    {tab.icon}
                    <Text fontSize="xs" color={textColor} fontWeight="bold" ms="6px">
                      {tab.name}
                    </Text>
                  </Flex>
                </Button>
              ))}

              {extraTabs.length > 0 && (
                <Menu zIndex={999}>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    size="sm"
                    h="40px"
                    minW={{ base: '100%', lg: '76px' }}
                    borderRadius="14px"
                    ml={0}
                  >
                    <RiMoreFill />
                  </MenuButton>
                  <Portal>
                    <MenuList>
                      {extraTabs.map((tab) => (
                        <MenuItem
                          key={tab.path}
                          icon={tab.icon}
                          bg={activeTab?.path === tab.path ? 'gray.100' : 'transparent'}
                          onClick={() => handleTabClick(tab?.path)}
                        >
                          {tab.name}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Portal>
                </Menu>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

export default Header
