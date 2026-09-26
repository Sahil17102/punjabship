import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'
import { NavLink } from 'react-router-dom'

function SignUp() {
  const pageBg = useColorModeValue('#F8F7FA', '#111113')
  const shellBg = useColorModeValue('rgba(255,255,255,0.96)', 'rgba(24, 24, 27, 0.94)')
  const shellBorder = useColorModeValue('rgba(17, 17, 19, 0.12)', 'rgba(148, 163, 184, 0.14)')
  const panelBg = useColorModeValue('#FAF4F2', '#141417')
  const titleColor = useColorModeValue('#171414', 'white')
  const textColor = useColorModeValue('#6E6763', 'rgba(255,255,255,0.72)')
  const inputBg = useColorModeValue('white', 'rgba(255,255,255,0.04)')
  const inputBorder = useColorModeValue('rgba(29,21,46,0.12)', 'rgba(255,255,255,0.12)')

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={pageBg}
      px={{ base: 4, md: 6 }}
      py={{ base: 8, md: 10 }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        bgImage={useColorModeValue(
          'radial-gradient(circle at 12% 10%, rgba(8,119,201,0.08) 0%, transparent 36%), radial-gradient(circle at 90% 14%, rgba(23,23,26,0.08) 0%, transparent 30%)',
          'radial-gradient(circle at 12% 10%, rgba(8,119,201,0.16) 0%, transparent 36%), radial-gradient(circle at 90% 14%, rgba(255,255,255,0.08) 0%, transparent 30%)',
        )}
      />

      <Grid
        templateColumns={{ base: '1fr', lg: '1.02fr 0.98fr' }}
        maxW="1180px"
        w="100%"
        bg={shellBg}
        borderWidth="1px"
        borderColor={shellBorder}
        borderRadius="20px"
        overflow="hidden"
        boxShadow={useColorModeValue('0 26px 70px rgba(17,17,19,0.1)', '0 28px 64px rgba(2, 8, 23, 0.46)')}
        position="relative"
        zIndex="1"
      >
        <GridItem bg={panelBg} borderRightWidth={{ base: '0', lg: '1px' }} borderColor={shellBorder}>
          <Flex h="100%" direction="column" p={{ base: 6, md: 8, lg: 10 }}>
            <Flex align="center" gap={4} mb={8}>
              <Box
                as="img"
                src="/logo/punjabship-mark.svg"
                alt="PunjabShip"
                h="56px"
                w="56px"
                objectFit="contain"
                borderRadius="10px"
                bg="white"
                p="1"
              />
              <Box>
                <Text fontSize="xs" fontWeight="800" letterSpacing="0.16em" textTransform="uppercase" color="brand.500">
                  PunjabShip
                </Text>
                <Text fontSize="sm" fontWeight="700" color={titleColor}>
                  Admin onboarding
                </Text>
              </Box>
            </Flex>

            <Stack spacing={5} maxW="520px">
              <Heading fontSize={{ base: '3xl', md: '4xl' }} lineHeight="1.04" letterSpacing="-0.04em" color={titleColor}>
                Create a controlled access point for your operations team.
              </Heading>
              <Text color={textColor} lineHeight="1.9">
                Set up administrator access for pricing, support, shipping operations and internal
                platform control inside PunjabShip.
              </Text>
            </Stack>

            <Stack spacing={4} mt={10}>
              {[
                'Use dedicated administrator credentials for pricing, support and ops.',
                'Keep access limited to internal operators and decision makers.',
                'Continue to the admin workspace after approval.',
              ].map((item) => (
                <Box key={item} p={4} borderRadius="10px" bg="white" borderWidth="1px" borderColor={shellBorder}>
                  <Text color={titleColor} fontWeight="600" lineHeight="1.8">
                    {item}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Flex>
        </GridItem>

        <GridItem>
          <Flex h="100%" align="center" justify="center" p={{ base: 6, md: 8 }}>
            <Box w="100%" maxW="430px">
              <Stack spacing={6}>
                <Box>
                  <Text fontSize="xs" fontWeight="800" letterSpacing="0.16em" textTransform="uppercase" color="secondary.500" mb={2}>
                    Create account
                  </Text>
                  <Heading fontSize={{ base: '2xl', md: '3xl' }} color={titleColor} letterSpacing="-0.03em">
                    Register a PunjabShip admin
                  </Heading>
                  <Text mt={2} fontSize="sm" color={textColor} lineHeight="1.8">
                    The form is intentionally minimal and professional. Connect it to your live
                    admin creation flow when ready.
                  </Text>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700" color={titleColor}>
                    Full name
                  </FormLabel>
                  <Input placeholder="Operations administrator" h="50px" borderRadius="10px" bg={inputBg} borderColor={inputBorder} />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700" color={titleColor}>
                    Work email
                  </FormLabel>
                  <Input placeholder="admin@punjabshiplogistics.com" type="email" h="50px" borderRadius="10px" bg={inputBg} borderColor={inputBorder} />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="700" color={titleColor}>
                    Password
                  </FormLabel>
                  <Input placeholder="Create a secure password" type="password" h="50px" borderRadius="10px" bg={inputBg} borderColor={inputBorder} />
                </FormControl>

                <Button h="50px" borderRadius="10px" bg="brand.500" color="white" _hover={{ bg: 'brand.600' }}>
                  Create Admin Account
                </Button>

                <Text fontSize="sm" color={textColor}>
                  Already have access?{' '}
                  <Link as={NavLink} to="/auth/signin" color="brand.500" fontWeight="700">
                    Sign in
                  </Link>
                </Text>
              </Stack>
            </Box>
          </Flex>
        </GridItem>
      </Grid>
    </Flex>
  )
}

export default SignUp
