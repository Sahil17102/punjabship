import {
  Badge, Box, Button, Flex, FormControl, FormLabel,
  Heading, HStack, Input, Select, SimpleGrid, Spinner, Table, Tbody, Td,
  Text, Th, Thead, Tr, VStack, useToast,
} from '@chakra-ui/react'
import PageHeader from 'components/Admin/PageHeader'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import { useBlogs, useBlogStats, useDeleteBlog } from 'hooks/useBlog'
import { useMemo, useState } from 'react'
import { FiEdit2, FiEye, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'

const categories = ['Shipping Tips', 'E-commerce', 'Industry News', 'Product Updates', 'Guides']
const statusLabel = { draft: 'Draft', published: 'Published', scheduled: 'Scheduled', archived: 'Archived' }
const statusColor = { published: 'green', scheduled: 'purple', draft: 'orange', archived: 'gray' }

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : 'Not published')

const MetricTile = ({ label, value }) => (
  <Card minW={0} h="full">
    <CardBody p={{ base: 4, md: 5 }}>
      <Text fontSize="sm" color="gray.500" fontWeight="600">{label}</Text>
      <Heading mt={2} size="lg" color="gray.900">{value}</Heading>
    </CardBody>
  </Card>
)

export default function Blogs() {
  const history = useHistory()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', status: '', category: '', is_featured: '' })
  const [applied, setApplied] = useState(filters)
  const params = useMemo(() => ({ page, limit: 10, ...applied }), [page, applied])
  const { data, isLoading } = useBlogs(params)
  const { data: stats } = useBlogStats()
  const deleteBlog = useDeleteBlog()
  const rows = data?.data || []

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const apply = () => { setPage(1); setApplied(filters) }
  const clear = () => {
    const next = { q: '', status: '', category: '', is_featured: '' }
    setFilters(next)
    setApplied(next)
    setPage(1)
  }
  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return
    try {
      await deleteBlog.mutateAsync(row.id)
      toast({ title: 'Blog deleted', status: 'success' })
    } catch (error) {
      toast({ title: 'Could not delete blog', description: error?.response?.data?.message || error.message, status: 'error' })
    }
  }

  return (
    <Box pt={{ base: '108px', md: '76px' }} px={{ base: 3, md: 5, xl: 6 }} pb={10}>
      <Box maxW="1480px" mx="auto">
        <PageHeader
          title="Blog Posts"
          description="Create, manage and publish useful content for PunjabShip customers."
          actions={<Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => history.push('/admin/blogs/new')}>New Post</Button>}
          meta={[
            { label: 'Content library', value: `${stats?.data?.total || 0} posts` },
            { label: 'Published', value: stats?.data?.published || 0 },
            { label: 'Featured', value: stats?.data?.featured || 0 },
          ]}
        />

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={5}>
          <MetricTile label="Total" value={stats?.data?.total || 0} />
          <MetricTile label="Published" value={stats?.data?.published || 0} />
          <MetricTile label="Drafts" value={stats?.data?.drafts || 0} />
          <MetricTile label="Featured" value={stats?.data?.featured || 0} />
        </SimpleGrid>

        <Card mt={5} p={0} overflow="hidden">
          <Box px={{ base: 4, md: 6 }} py={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
            <Heading size="sm">Filter posts</Heading>
            <Text mt={1} fontSize="sm" color="gray.500">Search and narrow the content library by status, category or homepage visibility.</Text>
          </Box>
          <CardBody p={{ base: 4, md: 6 }} display="block">
            <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} alignItems="end">
              <FormControl>
                <FormLabel>Search</FormLabel>
                <Input value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} placeholder="Title, slug, or author" onKeyDown={(e) => e.key === 'Enter' && apply()} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All statuses</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
              </FormControl>
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select>
              </FormControl>
              <FormControl>
                <FormLabel>Featured</FormLabel>
                <Select value={filters.is_featured} onChange={(e) => updateFilter('is_featured', e.target.value)}><option value="">All posts</option><option value="true">Featured only</option><option value="false">Not featured</option></Select>
              </FormControl>
              <HStack spacing={2} w="full">
                <Button flex={1} colorScheme="blue" onClick={apply}>Apply</Button>
                <Button flex={1} variant="outline" onClick={clear}>Clear</Button>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card mt={5} p={0} overflow="hidden">
          <Flex px={{ base: 4, md: 6 }} py={4} justify="space-between" align="center" gap={3} borderBottom="1px solid" borderColor="gray.200" flexWrap="wrap">
            <HStack spacing={2}><FiFileText /><Heading size="sm">All Posts</Heading></HStack>
            <Text fontSize="sm" color="gray.500">{data?.total || 0} total</Text>
          </Flex>
          <CardBody p={0} display="block">
            <Box overflowX="auto">
              <Table variant="simple" size="sm" w="full">
                <Thead><Tr><Th w="32%">Title</Th><Th>Category</Th><Th>Author</Th><Th>Status</Th><Th>Updated</Th><Th>Featured</Th><Th textAlign="right">Actions</Th></Tr></Thead>
                <Tbody>
                  {isLoading ? (
                    <Tr><Td colSpan={7} textAlign="center" py={12}><Spinner color="brand.500" /></Td></Tr>
                  ) : rows.length ? rows.map((row) => (
                    <Tr key={row.id}>
                      <Td><Text fontWeight="600" noOfLines={1} title={row.title}>{row.title}</Text><Text fontSize="xs" color="gray.500" noOfLines={1}>/{row.slug}</Text></Td>
                      <Td whiteSpace="nowrap">{row.category}</Td>
                      <Td whiteSpace="nowrap">{row.author_name}</Td>
                      <Td><Badge colorScheme={statusColor[row.status] || 'gray'}>{statusLabel[row.status] || row.status}</Badge></Td>
                      <Td whiteSpace="nowrap">{formatDate(row.updated_at)}</Td>
                      <Td>{row.is_featured ? <Badge colorScheme="yellow">Featured</Badge> : <Text color="gray.400">No</Text>}</Td>
                      <Td><HStack justify="flex-end" spacing={1}><Button size="sm" variant="outline" leftIcon={<FiEdit2 />} onClick={() => history.push(`/admin/blogs/${row.id}/edit`)}>Edit</Button><Button size="sm" variant="ghost" leftIcon={<FiEye />} onClick={() => row.status === 'published' ? window.open(`https://punjabship.onrender.com/blogs/${row.slug}`, '_blank', 'noopener,noreferrer') : toast({ title: 'Publish this post before opening the public page', status: 'info' })}>Preview</Button><Button size="sm" variant="ghost" colorScheme="red" aria-label="Delete blog" onClick={() => remove(row)}><FiTrash2 /></Button></HStack></Td>
                    </Tr>
                  )) : (
                    <Tr><Td colSpan={7} textAlign="center" py={14}><Text fontWeight="700">No blog posts found</Text><Text mt={1} color="gray.500">Create your first post to make it visible on the landing page.</Text></Td></Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            <Flex justify="flex-end" align="center" gap={3} px={{ base: 4, md: 6 }} py={4} borderTop="1px solid" borderColor="gray.200">
              <Button size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Text minW="58px" textAlign="center" fontSize="sm" color="gray.600">Page {page}</Text>
              <Button size="sm" isDisabled={rows.length < 10} onClick={() => setPage(page + 1)}>Next</Button>
            </Flex>
          </CardBody>
        </Card>
      </Box>
    </Box>
  )
}
