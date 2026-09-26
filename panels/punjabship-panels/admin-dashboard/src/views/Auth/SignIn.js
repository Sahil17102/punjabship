import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiPackage,
  FiShield,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import { useHistory } from "react-router-dom";
import { loginAdmin } from "../../services/auth.service";
import { useAuthStore } from "../../store/useAuthStore";
import { getAdminHomePath } from '../../utils/adminRouteAccess'

const activity = [
  { icon: FiPackage, label: "Orders processed", value: "1,248", bg: "#EEEaff" },
  { icon: FiTruck, label: "Couriers online", value: "18", bg: "#EAF8FF" },
  { icon: FiUsers, label: "Active merchants", value: "326", bg: "#F1FFE7" },
];

function isTokenValid(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function SignIn() {
  const pageBg = useColorModeValue("#FFFFFF", "#111113");
  const textPrimary = useColorModeValue("#17171A", "white");
  const textSecondary = useColorModeValue("#68666F", "rgba(255,255,255,0.72)");
  const inputBg = useColorModeValue("#F8F7FA", "rgba(255,255,255,0.04)");
  const inputBorder = useColorModeValue("#E8E6ED", "rgba(255,255,255,0.1)");
  const iconHoverBg = useColorModeValue(
    "rgba(8,119,201,0.08)",
    "rgba(255,255,255,0.08)"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const history = useHistory();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await loginAdmin(email, password);
      login(data.token, data?.user?.id, data.refreshToken, data.user);

      toast({
        title: "Login successful",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      history.push(getAdminHomePath(data?.user?.adminAccess));
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.error || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken && isTokenValid(refreshToken)) {
      history.replace("/admin/dashboard");
    }
  }, [history]);

  return (
    <Grid
      minH="100vh"
      templateColumns={{
        base: "1fr",
        lg: "minmax(480px, 0.92fr) minmax(540px, 1.08fr)",
      }}
    >
      <GridItem bg={pageBg}>
        <Flex
          minH="100vh"
          align="center"
          justify="center"
          px={{ base: 6, md: 10, xl: 16 }}
          py={{ base: 10, md: 12 }}
        >
          <Box as="main" w="100%" maxW="470px">
            <Stack spacing={2} mb={{ base: 10, md: 14 }}>
              <Box as="img" src="/logo/punjabship-logo.png" alt="PunjabShip - Ship the world" w="225px" h="75px" objectFit="contain" objectPosition="left" />
              <Text color="brand.500" fontSize="10px" fontWeight="800" textTransform="uppercase" letterSpacing="0.12em">Admin operations</Text>
            </Stack>

            <Stack spacing={3} mb={8}>
              <HStack color="brand.500" spacing={2}>
                <FiShield size={14} />
                <Text
                  fontSize="11px"
                  fontWeight="800"
                  textTransform="uppercase"
                  letterSpacing="0.12em"
                >
                  Authorized access
                </Text>
              </HStack>
              <Heading
                color={textPrimary}
                fontSize={{ base: "3xl", md: "42px" }}
                lineHeight="1.08"
                fontWeight="750"
                letterSpacing="0"
              >
                Run PunjabShip with complete visibility.
              </Heading>
              <Text color={textSecondary} fontSize="sm" lineHeight="1.8">
                Sign in to manage merchants, pricing, serviceability, support,
                and platform operations from one control center.
              </Text>
            </Stack>

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={5} align="stretch">
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="700"
                    color={textPrimary}
                    mb={2}
                  >
                    Work email
                  </FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@punjabshiplogistics.com"
                    h="52px"
                    borderRadius="9px"
                    bg={inputBg}
                    borderColor={inputBorder}
                    _hover={{ borderColor: "brand.300" }}
                    _focus={{
                      borderColor: "brand.500",
                      boxShadow: "0 0 0 3px rgba(8,119,201,0.10)",
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="700"
                    color={textPrimary}
                    mb={2}
                  >
                    Password
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      h="52px"
                      borderRadius="9px"
                      bg={inputBg}
                      borderColor={inputBorder}
                      pr="48px"
                      _hover={{ borderColor: "brand.300" }}
                      _focus={{
                        borderColor: "brand.500",
                        boxShadow: "0 0 0 3px rgba(8,119,201,0.10)",
                      }}
                    />
                    <InputRightElement h="52px" pr="8px">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        size="sm"
                        color={textSecondary}
                        onClick={() => setShowPassword((current) => !current)}
                        _hover={{ bg: iconHoverBg, color: "brand.500" }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  h="52px"
                  borderRadius="9px"
                  bg="brand.500"
                  color="white"
                  fontWeight="800"
                  isLoading={loading}
                  loadingText="Signing in"
                  boxShadow="0 12px 26px rgba(8,119,201,0.22)"
                  _hover={{ bg: "brand.600", transform: "translateY(-1px)" }}
                  _active={{ bg: "brand.700", transform: "none" }}
                >
                  Sign in to Admin
                </Button>
              </VStack>
            </Box>

            <HStack
              mt={7}
              pt={5}
              borderTop="1px solid"
              borderColor={inputBorder}
              justify="space-between"
              color={textSecondary}
            >
              <HStack spacing={2}>
                <FiCheckCircle size={14} />
                <Text fontSize="xs">Encrypted administrator login</Text>
              </HStack>
              <Text color={textPrimary} fontSize="xs" fontWeight="700">
                PunjabShip Logistics
              </Text>
            </HStack>
          </Box>
        </Flex>
      </GridItem>

      <GridItem
        display={{ base: "none", lg: "block" }}
        position="relative"
        overflow="hidden"
        color="white"
        bgGradient="linear(135deg, #7659FF 0%, #0877C9 48%, #8A5CF6 100%)"
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      >
        <Flex
          position="relative"
          zIndex="1"
          minH="100vh"
          direction="column"
          justify="space-between"
          px={{ lg: 12, xl: 16 }}
          py={{ lg: 12, xl: 16 }}
        >
          <Box maxW="620px">
            <Text
              color="#DFFF1F"
              fontSize="11px"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="0.14em"
              mb={3}
            >
              Live platform control
            </Text>
            <Heading
              fontSize={{ lg: "40px", xl: "52px" }}
              lineHeight="1.08"
              fontWeight="720"
              letterSpacing="0"
            >
              Every operation. One clear command view.
            </Heading>
            <Text
              mt={4}
              maxW="540px"
              color="rgba(255,255,255,0.76)"
              lineHeight="1.8"
            >
              Monitor the platform, resolve exceptions, and keep every merchant
              moving with the operational clarity PunjabShip was built for.
            </Text>
          </Box>

          <Box w="100%" maxW="680px" mx="auto" my={10}>
            <Box
              bg="rgba(255,255,255,0.96)"
              color="#17171A"
              borderRadius="12px"
              border="1px solid rgba(255,255,255,0.8)"
              boxShadow="0 28px 70px rgba(45,34,85,0.24)"
              p={{ lg: 6, xl: 7 }}
              transform="rotate(1deg)"
            >
              <HStack justify="space-between" mb={6}>
                <Box>
                  <Text color="#68666F" fontSize="xs" fontWeight="700">
                    Platform overview
                  </Text>
                  <Heading mt={1} fontSize="lg" fontWeight="800">
                    Today at PunjabShip
                  </Heading>
                </Box>
                <Badge
                  px={3}
                  py={2}
                  borderRadius="full"
                  bg="#E9FFF3"
                  color="#0C8D72"
                  textTransform="none"
                >
                  <HStack spacing={1.5}>
                    <FiActivity size={13} />
                    <Text>All systems healthy</Text>
                  </HStack>
                </Badge>
              </HStack>

              <SimpleGrid columns={3} spacing={3}>
                {activity.map(({ icon: Icon, label, value, bg }) => (
                  <Box key={label} minW="0" bg={bg} borderRadius="8px" p={4}>
                    <Flex
                      boxSize="34px"
                      align="center"
                      justify="center"
                      borderRadius="8px"
                      bg="white"
                      color="brand.500"
                      mb={3}
                    >
                      <Icon size={16} />
                    </Flex>
                    <Text fontSize="xl" fontWeight="800">
                      {value}
                    </Text>
                    <Text
                      mt={1}
                      color="#68666F"
                      fontSize="10px"
                      lineHeight="1.4"
                    >
                      {label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <Box mt={5} pt={5} borderTop="1px solid #EEEAF4">
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Flex
                      boxSize="38px"
                      borderRadius="8px"
                      align="center"
                      justify="center"
                      bg="#F1FFE7"
                      color="#566300"
                    >
                      <FiCheckCircle size={17} />
                    </Flex>
                    <Box>
                      <Text fontSize="sm" fontWeight="800">
                        Operations are on track
                      </Text>
                      <Text mt={1} color="#68666F" fontSize="10px">
                        98.4% of shipments are moving within SLA
                      </Text>
                    </Box>
                  </HStack>
                  <Badge
                    bg="#DFFF1F"
                    color="#263000"
                    borderRadius="full"
                    px={3}
                    py={2}
                    textTransform="none"
                  >
                    Live
                  </Badge>
                </HStack>
              </Box>
            </Box>
          </Box>

          <HStack justify="space-between" color="rgba(255,255,255,0.72)">
            <Text fontSize="xs" fontWeight="700">
              Pricing · Operations · Support · Finance
            </Text>
            <Box as="img" src="/logo/punjabship-mark.svg" alt="" boxSize="40px" />
          </HStack>
        </Flex>
      </GridItem>
    </Grid>
  );
}

export default SignIn;
