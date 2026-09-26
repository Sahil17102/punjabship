// Chakra imports
import { Box } from "@chakra-ui/react";
import React from "react";

const SalesOverview = ({ title, percentage, chart }) => {
  return (
    <Box w="100%" h={{ base: "250px", md: "320px" }}>
      {chart}
    </Box>
  );
};

export default SalesOverview;
