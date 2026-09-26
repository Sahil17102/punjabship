import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useColorModeValue,
} from '@chakra-ui/react'

const CustomModal = ({
  isOpen,
  onClose,
  title = '',
  action = null,
  children,
  footer,
  size = 'lg',
  hideCloseButton = false,
  hideFooter = false,
  width = null,
}) => {
  const bg = useColorModeValue('white', '#0F1C35')
  const headerBg = useColorModeValue('rgba(248, 250, 252, 0.9)', 'rgba(15, 28, 53, 0.9)')
  const borderColor = useColorModeValue('rgba(148, 163, 184, 0.34)', 'rgba(148, 163, 184, 0.2)')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const closeBgHover = useColorModeValue('rgba(31, 79, 168, 0.1)', 'rgba(138, 178, 255, 0.2)')
  const scrollbarThumb = useColorModeValue('rgba(100, 116, 139, 0.5)', 'rgba(148, 163, 184, 0.5)')
  const scrollbarThumbHover = useColorModeValue('rgba(71, 85, 105, 0.6)', 'rgba(148, 163, 184, 0.65)')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={width ? undefined : size}
      isCentered
      scrollBehavior="inside"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="rgba(2, 6, 23, 0.55)" backdropFilter="blur(7px)" />
      <ModalContent
        w={width ? width : undefined}
        maxW={width ? width : undefined}
        bg={bg}
        borderRadius="20px"
        boxShadow="0 28px 56px rgba(15, 46, 102, 0.28)"
        overflow="hidden"
        borderWidth="1px"
        borderColor={borderColor}
        _focus={{ outline: 'none' }}
      >
        {(title || !hideCloseButton) && (
          <Box position="relative">
            <ModalHeader bg={headerBg} py={4} px={5} borderBottomWidth="1px" borderBottomColor={borderColor}>
              <Flex justify="space-between" align="center" gap={3}>
                <Flex gap={3} align="center" flex={1} minW={0}>
                  {title && (
                    <Box fontWeight="800" fontSize={{ base: 'lg', md: 'xl' }} color={textColor} lineHeight="1.2" isTruncated>
                      {title}
                    </Box>
                  )}
                  {action && <Box flexShrink={0}>{action}</Box>}
                </Flex>
                {!hideCloseButton && (
                  <ModalCloseButton
                    position="static"
                    color="gray.500"
                    size="md"
                    _hover={{ color: 'gray.700', bg: closeBgHover }}
                    borderRadius="10px"
                  />
                )}
              </Flex>
            </ModalHeader>
          </Box>
        )}

        <ModalBody
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          maxH="calc(85vh - 130px)"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: scrollbarThumb,
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: scrollbarThumbHover,
            },
          }}
        >
          {children}
        </ModalBody>

        {!hideFooter && (
          <Box>
            <Divider borderColor={borderColor} />
            <ModalFooter bg={headerBg} px={5} py={3.5}>
              {footer ? (
                <Box w="full">{footer}</Box>
              ) : (
                <Button
                  onClick={onClose}
                  bg="brand.500"
                  color="white"
                  size="sm"
                  fontWeight="700"
                  borderRadius="10px"
                  px={5}
                  _hover={{ bg: 'brand.600' }}
                >
                  Close
                </Button>
              )}
            </ModalFooter>
          </Box>
        )}
      </ModalContent>
    </Modal>
  )
}

export default CustomModal
