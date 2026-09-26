import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Grid,
  Text,
  Badge,
  Divider,
  Flex,
  Icon,
  Table,
  Tbody,
  Tr,
  Td,
  useColorModeValue,
  VStack,
  HStack,
  Heading,
} from '@chakra-ui/react'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import CopyableAwb from 'components/Orders/CopyableAwb'
import {
  FiPackage,
  FiUser,
  FiMapPin,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiCopy,
  FiExternalLink,
} from 'react-icons/fi'

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const labelColor = useColorModeValue('gray.600', 'gray.400')
  const sectionBg = useColorModeValue('gray.50', 'gray.700')
  const safeOrder = order || {}

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value)
  const labelSource = safeOrder.label_url || safeOrder.label || safeOrder.label_key || null
  const invoiceSource =
    safeOrder.invoice_url || safeOrder.invoice_link || safeOrder.invoice_key || null
  const presignKeys = [
    ...(labelSource && !isHttpUrl(labelSource) ? [labelSource] : []),
    ...(invoiceSource && !isHttpUrl(invoiceSource) ? [invoiceSource] : []),
  ]
  const { data: presignedUrls = [] } = usePresignedDownloadUrls({
    keys: presignKeys,
    enabled: isOpen && presignKeys.length > 0,
  })

  const presignedMap = presignKeys.reduce((acc, key, index) => {
    acc[key] = presignedUrls?.[index] || null
    return acc
  }, {})

  const resolvedLabelUrl = labelSource
    ? isHttpUrl(labelSource)
      ? labelSource
      : presignedMap[labelSource]
    : null
  const resolvedInvoiceUrl = invoiceSource
    ? isHttpUrl(invoiceSource)
      ? invoiceSource
      : presignedMap[invoiceSource]
    : null
  const formatStatusText = (status) => (status ? status.replace(/_/g, ' ').toUpperCase() : 'N/A')
  const courierRawStatus = safeOrder.provider_last_status || safeOrder.delivery_message || null

  if (!order) return null

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'orange',
      shipment_created: 'blue',
      in_transit: 'purple',
      out_for_delivery: 'cyan',
      ndr: 'orange',
      undelivered: 'orange',
      delivered: 'green',
      cancelled: 'red',
      rto: 'pink',
      rto_in_transit: 'purple',
      rto_delivered: 'gray',
    }
    return statusColors[status] || 'gray'
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const InfoRow = ({ label, value, icon, copyable = false }) => (
    <Flex justify="space-between" align="center" py={2}>
      <HStack spacing={2}>
        {icon && <Icon as={icon} color={labelColor} />}
        <Text fontSize="sm" color={labelColor} fontWeight="medium">
          {label}
        </Text>
      </HStack>
      <HStack>
        <Text fontSize="sm" fontWeight="600">
          {value || 'N/A'}
        </Text>
        {copyable && value && (
          <Icon
            as={FiCopy}
            cursor="pointer"
            onClick={() => copyToClipboard(value)}
            color="gray.500"
            _hover={{ color: 'blue.500' }}
          />
        )}
      </HStack>
    </Flex>
  )

  const Section = ({ title, icon, children }) => (
    <Box bg={sectionBg} p={4} borderRadius="md" mb={4}>
      <HStack spacing={2} mb={3}>
        <Icon as={icon} boxSize={5} color="blue.500" />
        <Heading size="sm">{title}</Heading>
      </HStack>
      <Divider mb={3} />
      {children}
    </Box>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <Text>Order Details</Text>
            <VStack align="flex-end" spacing={1}>
              <Badge
                colorScheme={getStatusColor(order.order_status)}
                fontSize="md"
                px={3}
                py={1}
                borderRadius="md"
              >
                {formatStatusText(order.order_status)}
              </Badge>
              <Text fontSize="xs" color={labelColor} textAlign="right">
                Courier raw: {courierRawStatus || 'N/A'}
              </Text>
            </VStack>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            {/* Order Information */}
            <Section title="Order Information" icon={FiPackage}>
              <InfoRow label="Order ID" value={order.order_id} copyable />
              <InfoRow label="Order Number" value={order.order_number} />
              <InfoRow
                label="Order Date"
                value={
                  order.order_date
                    ? new Date(order.order_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'
                }
              />
              <InfoRow
                label="Order Type"
                value={
                  <Badge colorScheme={order.order_type === 'cod' ? 'green' : 'blue'}>
                    {order.order_type?.toUpperCase()}
                  </Badge>
                }
              />
            </Section>

            {/* Shipment Information */}
            <Section title="Shipment Information" icon={FiTruck}>
              <Flex justify="space-between" align="center" py={2} gap={3}>
                <Text fontSize="sm" color={labelColor} fontWeight="medium">
                  AWB Number
                </Text>
                <CopyableAwb awb={order.awb_number} />
              </Flex>
              <InfoRow label="Courier Partner" value={order.courier_partner} />
              <InfoRow label="Internal Status" value={formatStatusText(order.order_status)} />
              <InfoRow label="Courier Raw Status" value={courierRawStatus || 'N/A'} />
              <InfoRow label="Shipment ID" value={order.shipment_id} />
              {labelSource && (
                <Flex justify="space-between" align="center" py={2}>
                  <Text fontSize="sm" color={labelColor} fontWeight="medium">
                    Shipping Label
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    rightIcon={<FiExternalLink />}
                    onClick={() => resolvedLabelUrl && window.open(resolvedLabelUrl, '_blank')}
                    isDisabled={!resolvedLabelUrl}
                  >
                    View
                  </Button>
                </Flex>
              )}
              {invoiceSource && (
                <Flex justify="space-between" align="center" py={2}>
                  <Text fontSize="sm" color={labelColor} fontWeight="medium">
                    Invoice
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="purple"
                    rightIcon={<FiExternalLink />}
                    onClick={() => resolvedInvoiceUrl && window.open(resolvedInvoiceUrl, '_blank')}
                    isDisabled={!resolvedInvoiceUrl}
                  >
                    View
                  </Button>
                </Flex>
              )}
            </Section>

            {/* Customer Information */}
            <Section title="Customer Information" icon={FiUser}>
              <InfoRow label="Name" value={order.buyer_name} />
              <InfoRow label="Phone" value={order.buyer_phone} copyable />
              <InfoRow label="Email" value={order.buyer_email} />
            </Section>

            {/* Delivery Address */}
            <Section title="Delivery Address" icon={FiMapPin}>
              <VStack align="stretch" spacing={1}>
                <Text fontSize="sm" fontWeight="600">
                  {order.address}
                </Text>
                <Text fontSize="sm">
                  {order.city}, {order.state} - {order.pincode}
                </Text>
                <Text fontSize="sm">{order.country || 'India'}</Text>
              </VStack>
            </Section>
          </Grid>

          {/* Financial Information */}
          <Section title="Financial Information" icon={FiDollarSign}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
              <InfoRow label="Order Amount" value={`₹${parseFloat(order.order_amount || 0).toFixed(2)}`} />
              {order.shipping_charges && (
                <InfoRow
                  label="Shipping Charges"
                  value={`₹${parseFloat(order.shipping_charges).toFixed(2)}`}
                />
              )}
              {order.cod_charges && (
                <InfoRow label="COD Charges" value={`₹${parseFloat(order.cod_charges).toFixed(2)}`} />
              )}
              {order.transaction_fee && (
                <InfoRow
                  label="Transaction Fee"
                  value={`₹${parseFloat(order.transaction_fee).toFixed(2)}`}
                />
              )}
              {order.discount && (
                <InfoRow label="Discount" value={`₹${parseFloat(order.discount).toFixed(2)}`} />
              )}
              {order.prepaid_amount && (
                <InfoRow
                  label="Prepaid Amount"
                  value={`₹${parseFloat(order.prepaid_amount).toFixed(2)}`}
                />
              )}
            </Grid>
          </Section>

          {/* Package Information */}
          <Section title="Package Information" icon={FiPackage}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
              <InfoRow label="Weight" value={order.weight ? `${order.weight} kg` : 'N/A'} />
              <InfoRow
                label="Dimensions (L×B×H)"
                value={
                  order.length && order.breadth && order.height
                    ? `${order.length} × ${order.breadth} × ${order.height} cm`
                    : 'N/A'
                }
              />
            </Grid>
          </Section>

          {/* Products */}
          {order.products && Array.isArray(order.products) && order.products.length > 0 && (
            <Section title="Products" icon={FiPackage}>
              <Table size="sm" variant="simple">
                <Tbody>
                  {order.products.map((product, idx) => (
                    <Tr key={idx}>
                      <Td px={0}>
                        <Text fontWeight="600">{product.productName || product.name}</Text>
                        {product.sku && (
                          <Text fontSize="xs" color={labelColor}>
                            SKU: {product.sku}
                          </Text>
                        )}
                      </Td>
                      <Td isNumeric>Qty: {product.quantity}</Td>
                      <Td isNumeric fontWeight="600">
                        ₹{parseFloat(product.price || 0).toFixed(2)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Section>
          )}

          {/* Pickup Details */}
          {order.pickup_details && (
            <Section title="Pickup Details" icon={FiMapPin}>
              <VStack align="stretch" spacing={2}>
                {order.pickup_details.warehouse_name && (
                  <Text fontSize="sm" fontWeight="600">
                    {order.pickup_details.warehouse_name}
                  </Text>
                )}
                {order.pickup_details.name && <Text fontSize="sm">{order.pickup_details.name}</Text>}
                {order.pickup_details.address && <Text fontSize="sm">{order.pickup_details.address}</Text>}
                {order.pickup_details.city && (
                  <Text fontSize="sm">
                    {order.pickup_details.city}, {order.pickup_details.state} -{' '}
                    {order.pickup_details.pincode}
                  </Text>
                )}
                {order.pickup_details.phone && (
                  <Text fontSize="sm">Phone: {order.pickup_details.phone}</Text>
                )}
              </VStack>
            </Section>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Close
          </Button>
          {order.awb_number && (
            <Button colorScheme="blue" leftIcon={<FiTruck />}>
              Track Order
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default OrderDetailsModal
