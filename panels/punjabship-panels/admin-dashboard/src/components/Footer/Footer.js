/* eslint-disable */
import { Flex, Link, Text, useColorModeValue } from "@chakra-ui/react";

export default function Footer() {
  const textColor = useColorModeValue("gray.500", "gray.400");
  const linkColor = useColorModeValue("brand.500", "brand.300");

  return (
    <Flex
      flexDirection={{ base: "column", xl: "row" }}
      alignItems={{ base: "center", xl: "start" }}
      justifyContent="space-between"
      px="30px"
      py="20px"
      w="100%"
    >
      <Text
        color={textColor}
        textAlign={{ base: "center", xl: "start" }}
        mb={{ base: "20px", xl: "0px" }}
        fontSize="sm"
      >
        &copy; {new Date().getFullYear()}{" "}
        <Text as="span">
          {document.documentElement.dir === "rtl"
            ? "كل الحقوق محفوظة لـ"
            : "All rights reserved – "}
        </Text>
        <Link
          color={linkColor}
          href="https://punjabship.onrender.com"
          target="_blank"
          fontWeight="semibold"
        >
          PunjabShip Admin
        </Link>
      </Text>
      <Link
        color={textColor}
        href="https://searchcraftdigital.com/"
        target="_blank"
        fontWeight="semibold"
        fontSize="sm"
        _hover={{ color: linkColor, textDecoration: "none" }}
      >
        Crafted by SearchCraft Digital
      </Link>
    </Flex>
  );
}
