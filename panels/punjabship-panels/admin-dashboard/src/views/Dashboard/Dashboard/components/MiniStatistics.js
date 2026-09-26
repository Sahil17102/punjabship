// Chakra imports
import {
  Flex,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Box,
  HStack,
  VStack,
  Text,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import React from "react";

const MiniStatistics = ({ title, amount, percentage, icon, trend, gradient }) => {
  const textColor = useColorModeValue("gray.700", "white");
  const textColorSecondary = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  // Use blue as primary accent color, with subtle variations
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const iconColor = useColorModeValue("blue.600", "blue.300");

  return (
    <Card
      minH='100px'
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{
        boxShadow: "md",
        borderColor: useColorModeValue("blue.200", "blue.700"),
      }}
    >
      <CardBody p={5}>
        <Flex flexDirection='row' align='center' justify='space-between' w='100%'>
          <VStack align="flex-start" spacing={1} flex={1}>
            <Stat me='auto'>
              <StatLabel
                fontSize='xs'
                color={textColorSecondary}
                fontWeight='500'
                textTransform="uppercase"
                letterSpacing="0.5px"
                mb={2}>
                {title}
              </StatLabel>
              <HStack align="baseline" spacing={2}>
                <StatNumber fontSize='xl' fontWeight='600' color={textColor} lineHeight="1.2">
                  {amount}
                </StatNumber>
                {percentage !== undefined && percentage !== 0 && (
                  <StatHelpText
                    fontSize='xs'
                    color={percentage > 0 ? "secondary.500" : "red.500"}
                    fontWeight='500'
                    m={0}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    {percentage > 0 ? (
                      <Text as="span" fontSize="xs">↑</Text>
                    ) : (
                      <Text as="span" fontSize="xs">↓</Text>
                    )}
                    {Math.abs(percentage)}%
                  </StatHelpText>
                )}
              </HStack>
            </Stat>
          </VStack>
          <Box
            bg={iconBg}
            borderRadius="md"
            p={2.5}
            ml={4}
          >
            <Box color={iconColor}>
              {icon}
            </Box>
          </Box>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default MiniStatistics;
