import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  SimpleGrid,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { CopyIcon, DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons'
import { useEffect, useState } from 'react'
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useUpdateApiKey,
} from 'hooks/useApiIntegration'
import {
  useShopifyOAuthCredentials,
  useUpdateShopifyOAuthCredentials,
} from 'hooks/useDeveloperLogs'
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useConnectShopifyEnvStore,
  useShopifyStatus,
  useStartShopifyOAuth,
  useSyncShopifyOrders,
  useUpdateWebhook,
} from 'hooks/useApiIntegration'

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'order.delivered',
  'order.failed',
  'order.rto',
  'order.cancelled',
  'order.return_created',
  'order.ndr',
  'shipment.label_generated',
  'shipment.manifest_generated',
  'tracking.updated',
]

const normalizeShopifyStoreUrl = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/\/admin(?:\/.*)?$/, '')

const ApiIntegration = () => {
  const [activeTab, setActiveTab] = useState('apiKeys')
  const [copiedKey, setCopiedKey] = useState(null)
  const [shopifyTargetUserId, setShopifyTargetUserId] = useState('')
  const [shopifySyncLimit, setShopifySyncLimit] = useState(50)
  const [shopifyOAuthStoreUrl, setShopifyOAuthStoreUrl] = useState('')
  const [shopifyClientId, setShopifyClientId] = useState('')
  const [shopifyClientSecret, setShopifyClientSecret] = useState('')
  const toast = useToast()

  // API Keys
  const { data: apiKeysData, isLoading: apiKeysLoading } = useApiKeys()
  const apiKeys = apiKeysData?.data || []
  const createApiKey = useCreateApiKey()
  const updateApiKey = useUpdateApiKey()
  const deleteApiKey = useDeleteApiKey()

  // Webhooks
  const { data: webhooksData, isLoading: webhooksLoading } = useWebhooks()
  const webhooks = webhooksData?.data || []
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()

  const {
    data: shopifyStatusData,
    isLoading: shopifyStatusLoading,
    isFetching: shopifyStatusFetching,
    isError: shopifyStatusIsError,
    error: shopifyStatusError,
    refetch: refetchShopifyStatus,
  } = useShopifyStatus()
  const shopifyStatus = shopifyStatusData?.data || null
  const connectShopifyEnvStore = useConnectShopifyEnvStore()
  const startShopifyOAuth = useStartShopifyOAuth()
  const syncShopifyOrders = useSyncShopifyOrders()
  const { data: shopifyOAuthCredentialsData, isLoading: shopifyOAuthCredentialsLoading } =
    useShopifyOAuthCredentials()
  const updateShopifyOAuthCredentials = useUpdateShopifyOAuthCredentials()
  const shopifyOAuthCredentials = shopifyOAuthCredentialsData?.data || {}

  useEffect(() => {
    if (shopifyOAuthCredentials.clientId) setShopifyClientId(shopifyOAuthCredentials.clientId)
  }, [shopifyOAuthCredentials.clientId])

  // Modals
  const {
    isOpen: isApiKeyModalOpen,
    onOpen: onApiKeyModalOpen,
    onClose: onApiKeyModalClose,
  } = useDisclosure()
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose,
  } = useDisclosure()
  const {
    isOpen: isApiKeyViewModalOpen,
    onOpen: onApiKeyViewModalOpen,
    onClose: onApiKeyViewModalClose,
  } = useDisclosure()

  // Form states
  const [apiKeyForm, setApiKeyForm] = useState({ key_name: '' })
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    name: '',
    events: [],
    is_active: true,
  })
  const [newApiKey, setNewApiKey] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCreateApiKey = () => {
    createApiKey.mutate(apiKeyForm, {
      onSuccess: (data) => {
        setNewApiKey(data.data)
        setApiKeyForm({ key_name: '' })
        onApiKeyModalClose()
        onApiKeyViewModalOpen()
      },
    })
  }

  const handleUpdateApiKey = (id, data) => {
    updateApiKey.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingItem(null)
        },
      },
    )
  }

  const handleDeleteApiKey = (id) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      deleteApiKey.mutate(id)
    }
  }

  const handleCreateWebhook = () => {
    if (!webhookForm.url || webhookForm.events.length === 0) {
      toast({
        title: 'Please fill all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    createWebhook.mutate(webhookForm, {
      onSuccess: () => {
        setWebhookForm({ url: '', name: '', events: [], is_active: true })
        onWebhookModalClose()
      },
    })
  }

  const handleUpdateWebhook = (id, data) => {
    updateWebhook.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingItem(null)
        },
      },
    )
  }

  const handleDeleteWebhook = (id) => {
    if (window.confirm('Are you sure you want to delete this webhook subscription?')) {
      deleteWebhook.mutate(id)
    }
  }

  const handleConnectShopifyEnvStore = () => {
    const targetUserId = shopifyTargetUserId.trim()
    connectShopifyEnvStore.mutate({
      ...(targetUserId ? { targetUserId } : {}),
      settings: {
        fulfillTrigger: 'do_not_fulfill',
        customerNotifyOnFulfill: 'do_not_notify',
        autoUpdateShipmentStatus: false,
        autoCancelOrders: false,
        markCodPaidOnDelivery: false,
      },
    })
  }

  const handleStartShopifyOAuth = () => {
    const targetUserId = shopifyTargetUserId.trim()
    const shop = normalizeShopifyStoreUrl(shopifyOAuthStoreUrl)

    if (!shop) {
      toast({
        title: 'Enter a Shopify store domain',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    startShopifyOAuth.mutate({
      shop,
      ...(targetUserId ? { targetUserId, userId: targetUserId } : {}),
      returnTo: '/channels/connected',
    })
  }

  const handleSyncShopifyOrders = () => {
    const limit = Number(shopifySyncLimit)
    syncShopifyOrders.mutate({ limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 250) : 50 })
  }

  const handleSaveShopifyCredentials = () => {
    updateShopifyOAuthCredentials.mutate({
      clientId: shopifyClientId.trim(),
      ...(shopifyClientSecret.trim() ? { clientSecret: shopifyClientSecret.trim() } : {}),
    })
  }

  const toggleEvent = (event) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={6} px={4}>
      <Text fontSize="2xl" fontWeight="bold">
        API Integration
      </Text>

      {/* Tabs */}
      <HStack spacing={4} borderBottom="1px" borderColor="gray.200">
        <Button
          variant={activeTab === 'apiKeys' ? 'solid' : 'ghost'}
          colorScheme={activeTab === 'apiKeys' ? 'blue' : 'gray'}
          onClick={() => setActiveTab('apiKeys')}
        >
          API Keys
        </Button>
        <Button
          variant={activeTab === 'webhooks' ? 'solid' : 'ghost'}
          colorScheme={activeTab === 'webhooks' ? 'blue' : 'gray'}
          onClick={() => setActiveTab('webhooks')}
        >
          Webhooks
        </Button>
        <Button
          variant={activeTab === 'shopify' ? 'solid' : 'ghost'}
          colorScheme={activeTab === 'shopify' ? 'blue' : 'gray'}
          onClick={() => setActiveTab('shopify')}
        >
          Shopify
        </Button>
      </HStack>

      {/* API Keys Tab */}
      {activeTab === 'apiKeys' && (
        <Box>
          <Flex justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              API Keys
            </Text>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onApiKeyModalOpen}>
              Create API Key
            </Button>
          </Flex>

          {apiKeysLoading ? (
            <Spinner size="md" />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Last Used</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {apiKeys.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        <Text color="gray.500">No API keys found. Create one to get started.</Text>
                      </Td>
                    </Tr>
                  ) : (
                    apiKeys.map((key) => (
                      <Tr key={key.id}>
                        <Td>{key.key_name}</Td>
                        <Td>
                          <Badge colorScheme={key.is_active ? 'green' : 'red'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </Td>
                        <Td>{new Date(key.created_at).toLocaleDateString()}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => {
                                setEditingItem(key)
                                handleUpdateApiKey(key.id, {
                                  is_active: !key.is_active,
                                })
                              }}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteApiKey(key.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Box>
          <Flex justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Webhook Subscriptions
            </Text>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onWebhookModalOpen}>
              Create Webhook
            </Button>
          </Flex>

          {webhooksLoading ? (
            <Spinner size="md" />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>URL</Th>
                    <Th>Events</Th>
                    <Th>Status</Th>
                    <Th>Stats</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {webhooks.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center">
                        <Text color="gray.500">
                          No webhook subscriptions found. Create one to get started.
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    webhooks.map((webhook) => (
                      <Tr key={webhook.id}>
                        <Td>{webhook.name || 'Unnamed'}</Td>
                        <Td>
                          <Text fontSize="sm" maxW="300px" isTruncated>
                            {webhook.url}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{webhook.events?.length || 0} events</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={webhook.is_active ? 'green' : 'red'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs">
                            Success: {webhook.successful_deliveries || 0} | Failed:{' '}
                            {webhook.failed_deliveries || 0}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => {
                                setEditingItem(webhook)
                                setWebhookForm({
                                  url: webhook.url,
                                  name: webhook.name || '',
                                  events: webhook.events || [],
                                  is_active: webhook.is_active,
                                })
                                onWebhookModalOpen()
                              }}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteWebhook(webhook.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Shopify Tab */}
      {activeTab === 'shopify' && (
        <Box>
          <Flex
            justify="space-between"
            mb={4}
            gap={3}
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
          >
            <Text fontSize="lg" fontWeight="semibold">
              Shopify Custom App
            </Text>
            <HStack spacing={2}>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={() => refetchShopifyStatus()}
                isLoading={shopifyStatusFetching}
              >
                Test Connection
              </Button>
              <Button
                colorScheme="green"
                onClick={handleConnectShopifyEnvStore}
                isDisabled={!shopifyStatus?.configured}
                isLoading={connectShopifyEnvStore.isLoading || connectShopifyEnvStore.isPending}
              >
                Bind Store
              </Button>
            </HStack>
          </Flex>

          {shopifyStatusLoading ? (
            <Spinner size="md" />
          ) : shopifyStatusIsError ? (
            <Box p={4} border="1px" borderColor="red.200" borderRadius="md" bg="red.50">
              <Text color="red.700" fontWeight="semibold">
                Shopify status unavailable
              </Text>
              <Text color="red.600" fontSize="sm">
                {shopifyStatusError?.response?.data?.error ||
                  shopifyStatusError?.response?.data?.message ||
                  'Connection test failed'}
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Status
                  </Text>
                  <Badge
                    colorScheme={
                      shopifyStatus?.connected ? 'green' : shopifyStatus?.configured ? 'yellow' : 'red'
                    }
                  >
                    {shopifyStatus?.connected
                      ? 'Connected'
                      : shopifyStatus?.configured
                        ? 'Configured'
                        : 'Missing Env'}
                  </Badge>
                </Box>
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Store
                  </Text>
                  <Text fontWeight="semibold">{shopifyStatus?.shop?.domain || shopifyStatus?.store || '-'}</Text>
                </Box>
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    API Version
                  </Text>
                  <Text fontWeight="semibold">{shopifyStatus?.apiVersion || '-'}</Text>
                </Box>
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Webhook
                  </Text>
                  <Badge colorScheme={shopifyStatus?.webhookPublic ? 'green' : 'orange'}>
                    {shopifyStatus?.webhookPublic ? 'Public HTTPS' : 'Local'}
                  </Badge>
                </Box>
              </SimpleGrid>

              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                <Flex
                  justify="space-between"
                  gap={3}
                  align={{ base: 'stretch', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Box minW={0}>
                    <Text fontSize="sm" color="gray.500" mb={1}>
                      Delivery URL
                    </Text>
                    <Text fontSize="sm" wordBreak="break-all">
                      {shopifyStatus?.webhookUrl || '-'}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="Copy Shopify webhook URL"
                    icon={<CopyIcon />}
                    onClick={() => handleCopy(shopifyStatus?.webhookUrl || '', 'shopifyWebhook')}
                    isDisabled={!shopifyStatus?.webhookUrl}
                    colorScheme={copiedKey === 'shopifyWebhook' ? 'green' : 'gray'}
                  />
                </Flex>
              </Box>

              <Divider />

              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontSize="md" fontWeight="semibold" mb={1}>
                  Shopify app credentials
                </Text>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Enter the credentials from your Shopify custom app. They are stored securely on
                  the PunjabShip backend and used for OAuth installation.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Client ID</FormLabel>
                    <Input
                      value={shopifyClientId}
                      onChange={(e) => setShopifyClientId(e.target.value)}
                      placeholder="Shopify client ID"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormControl isRequired={!shopifyOAuthCredentials.hasClientSecret}>
                    <FormLabel>Client secret</FormLabel>
                    <Input
                      type="password"
                      value={shopifyClientSecret}
                      onChange={(e) => setShopifyClientSecret(e.target.value)}
                      placeholder={
                        shopifyOAuthCredentials.hasClientSecret
                          ? 'Leave blank to keep the saved secret'
                          : 'Shopify client secret'
                      }
                      autoComplete="new-password"
                    />
                  </FormControl>
                </SimpleGrid>
                <Flex justify="space-between" align="center" mt={4} gap={3} wrap="wrap">
                  <Text fontSize="xs" color="gray.500">
                    {shopifyOAuthCredentials.hasClientSecret
                      ? `Saved secret: ${shopifyOAuthCredentials.clientSecretMasked}`
                      : 'No client secret saved yet'}
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={handleSaveShopifyCredentials}
                    isLoading={
                      shopifyOAuthCredentialsLoading || updateShopifyOAuthCredentials.isPending
                    }
                    isDisabled={
                      !shopifyClientId.trim() ||
                      (!shopifyClientSecret.trim() && !shopifyOAuthCredentials.hasClientSecret)
                    }
                  >
                    Save credentials
                  </Button>
                </Flex>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} alignItems="end">
                <FormControl>
                  <FormLabel>Target User ID</FormLabel>
                  <Input
                    value={shopifyTargetUserId}
                    onChange={(e) => setShopifyTargetUserId(e.target.value)}
                    placeholder="Current user"
                  />
                </FormControl>
                <Button
                  colorScheme="green"
                  onClick={handleConnectShopifyEnvStore}
                  isDisabled={!shopifyStatus?.configured}
                  isLoading={connectShopifyEnvStore.isLoading || connectShopifyEnvStore.isPending}
                >
                  Bind Env Store
                </Button>
                <FormControl>
                  <FormLabel>Sync Limit</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    max={250}
                    value={shopifySyncLimit}
                    onChange={(e) => setShopifySyncLimit(e.target.value)}
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  onClick={handleSyncShopifyOrders}
                  isDisabled={!shopifyStatus?.connected}
                  isLoading={syncShopifyOrders.isLoading || syncShopifyOrders.isPending}
                >
                  Sync Orders
                </Button>
              </SimpleGrid>

              <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                <Text fontSize="md" fontWeight="semibold" mb={4}>
                  Shopify OAuth Connection
                </Text>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Manual Admin API token connection is disabled. Start OAuth for a target merchant or ask
                  the merchant to connect Shopify from the PunjabShip customer panel.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Shopify Store URL</FormLabel>
                    <Input
                      value={shopifyOAuthStoreUrl}
                      onChange={(e) => setShopifyOAuthStoreUrl(e.target.value)}
                      placeholder="mystore.myshopify.com"
                    />
                  </FormControl>
                </SimpleGrid>
                <Flex justify="flex-end" mt={4}>
                  <Button
                    colorScheme="green"
                    onClick={handleStartShopifyOAuth}
                    isLoading={
                      startShopifyOAuth.isLoading || startShopifyOAuth.isPending
                    }
                    isDisabled={!shopifyStatus?.oauthConfigured}
                  >
                    Start Shopify OAuth
                  </Button>
                </Flex>
              </Box>
            </VStack>
          )}
        </Box>
      )}

      {/* Create API Key Modal */}
      <Modal isOpen={isApiKeyModalOpen} onClose={onApiKeyModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create API Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Key Name</FormLabel>
                <Input
                  value={apiKeyForm.key_name}
                  onChange={(e) => setApiKeyForm({ key_name: e.target.value })}
                  placeholder="e.g., Production API Key"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApiKeyModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateApiKey}
              isLoading={createApiKey.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View New API Key Modal */}
      <Modal isOpen={isApiKeyViewModalOpen} onClose={onApiKeyViewModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>API Key Created</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {newApiKey && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
                  <Text fontSize="sm" fontWeight="bold" color="yellow.800" mb={2}>
                    ⚠️ Important: Save these credentials securely
                  </Text>
                  <Text fontSize="xs" color="yellow.700">
                    You will not be able to view the API key and secret again after closing this
                    dialog.
                  </Text>
                </Box>
                <FormControl>
                  <FormLabel>API Key</FormLabel>
                  <HStack>
                    <Input value={newApiKey.api_key} readOnly />
                    <IconButton
                      icon={<CopyIcon />}
                      onClick={() => handleCopy(newApiKey.api_key, 'key')}
                      colorScheme={copiedKey === 'key' ? 'green' : 'gray'}
                    />
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel>API Secret</FormLabel>
                  <HStack>
                    <Input value={newApiKey.api_secret} readOnly />
                    <IconButton
                      icon={<CopyIcon />}
                      onClick={() => handleCopy(newApiKey.api_secret, 'secret')}
                      colorScheme={copiedKey === 'secret' ? 'green' : 'gray'}
                    />
                  </HStack>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onApiKeyViewModalClose}>
              I've saved the credentials
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create/Edit Webhook Modal */}
      <Modal isOpen={isWebhookModalOpen} onClose={onWebhookModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingItem ? 'Edit Webhook Subscription' : 'Create Webhook Subscription'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name (optional)</FormLabel>
                <Input
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  placeholder="e.g., Production Webhooks"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Webhook URL</FormLabel>
                <Input
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  placeholder="https://your-app.com/webhooks"
                  type="url"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Events to Subscribe</FormLabel>
                <Box
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={3}
                  maxH="200px"
                  overflowY="auto"
                >
                  <VStack align="stretch" spacing={2}>
                    {WEBHOOK_EVENTS.map((event) => (
                      <Flex key={event} align="center">
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(event)}
                          onChange={() => toggleEvent(event)}
                          style={{ marginRight: '8px' }}
                        />
                        <Text fontSize="sm">{event}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </FormControl>
              <FormControl>
                <Flex align="center" justify="space-between">
                  <FormLabel mb={0}>Active</FormLabel>
                  <Switch
                    isChecked={webhookForm.is_active}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, is_active: e.target.checked })
                    }
                  />
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onWebhookModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                if (editingItem) {
                  handleUpdateWebhook(editingItem.id, webhookForm)
                  setEditingItem(null)
                } else {
                  handleCreateWebhook()
                }
              }}
              isLoading={createWebhook.isLoading || updateWebhook.isLoading}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default ApiIntegration

