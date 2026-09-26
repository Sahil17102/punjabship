import {
  Badge, Box, Button, Divider, Flex, FormControl,
  FormErrorMessage, FormLabel, Heading, HStack, Input, Select, SimpleGrid,
  Spinner, Switch, Text, Textarea, useToast, VStack, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalHeader, ModalOverlay,
} from '@chakra-ui/react'
import FileUploader from 'components/upload/FileUploader'
import PageHeader from 'components/Admin/PageHeader'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import { ContentState, convertFromHTML, convertToRaw, EditorState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import { useCreateBlog, useSingleBlog, useUpdateBlog } from 'hooks/useBlog'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import { useEffect, useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { FiArrowLeft, FiEye, FiSave, FiSend } from 'react-icons/fi'
import { useHistory, useParams } from 'react-router-dom'

const categories = ['Shipping Tips', 'E-commerce', 'Industry News', 'Product Updates', 'Guides']
const initialForm = {
  title: '', slug: '', excerpt: '', content: '', category: 'Shipping Tips', status: 'draft',
  author_name: 'PunjabShip', author_role: 'PunjabShip Editorial Team', tags: '', featured_image: '',
  featured_image_alt: '', og_image: '', meta_title: '', meta_description: '', focus_keywords: '',
  accent_color: '#6C4DFF', is_featured: false, published_at: null,
}

const toLocalDateTime = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '')

const Panel = ({ title, description, children, ...props }) => (
  <Card p={0} overflow="hidden" {...props}>
    <Box px={{ base: 4, md: 6 }} py={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
      <Heading size="sm" color="gray.800">{title}</Heading>
      {description ? <Text mt={1} fontSize="sm" color="gray.500" lineHeight="1.45">{description}</Text> : null}
    </Box>
    <CardBody p={{ base: 4, md: 6 }} display="block">{children}</CardBody>
  </Card>
)

const FieldHint = ({ children }) => (
  <Text mt={1.5} fontSize="xs" color="gray.500" lineHeight="1.4">{children}</Text>
)

export default function CreateBlog() {
  const { id } = useParams()
  const history = useHistory()
  const toast = useToast()
  const { data, isLoading } = useSingleBlog(id)
  const create = useCreateBlog()
  const update = useUpdateBlog()
  const [form, setForm] = useState(initialForm)
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(false)
  const imageKey = form.og_image ? [form.og_image] : []
  const { data: imageUrls } = usePresignedDownloadUrls({ keys: imageKey })
  const imagePreview = imageUrls?.urls?.[0]

  useEffect(() => {
    const blog = data?.data
    if (!blog) return
    setForm({ ...initialForm, ...blog, published_at: toLocalDateTime(blog.published_at) })
    if (blog.content) {
      const html = convertFromHTML(blog.content)
      setEditorState(EditorState.createWithContent(
        ContentState.createFromBlockArray(html.contentBlocks, html.entityMap),
      ))
    }
  }, [data])

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const onEditorChange = (state) => {
    setEditorState(state)
    change('content', draftToHtml(convertToRaw(state.getCurrentContent())))
  }
  const onImage = (files) => {
    if (!files[0]) return
    setForm((current) => ({
      ...current, og_image: files[0].key, featured_image: files[0].key,
      featured_image_alt: current.featured_image_alt || files[0].originalName,
    }))
  }

  const validate = (candidate) => {
    const next = {}
    if (!candidate.title.trim()) next.title = 'Title is required'
    if (!candidate.slug.trim()) next.slug = 'Slug is required'
    if (!candidate.excerpt.trim()) next.excerpt = 'Excerpt is required'
    if (!candidate.content.replace(/<[^>]+>/g, '').trim()) next.content = 'Article content is required'
    if (candidate.status === 'scheduled' && !candidate.published_at) next.published_at = 'Choose a future publication date'
    setErrors(next)
    return !Object.keys(next).length
  }

  const submit = async (status) => {
    const nextForm = {
      ...form,
      status,
      published_at: status === 'published'
        ? (form.published_at || new Date().toISOString())
        : form.published_at ? new Date(form.published_at).toISOString() : null,
    }
    if (!validate(nextForm)) return
    try {
      if (id) await update.mutateAsync({ id, data: nextForm })
      else await create.mutateAsync(nextForm)
      toast({ title: status === 'published' ? 'Blog published' : 'Draft saved', status: 'success' })
      history.push('/admin/blogs')
    } catch (error) {
      toast({ title: 'Could not save blog', description: error?.response?.data?.message || error.message, status: 'error' })
    }
  }

  if (id && isLoading) return <Flex justify="center" pt="140px"><Spinner color="brand.500" /></Flex>

  const busy = create.isPending || update.isPending
  const statusColor = { published: 'green', scheduled: 'purple', archived: 'gray' }[form.status] || 'orange'

  return (
    <Box pt={{ base: '108px', md: '76px' }} px={{ base: 3, md: 5, xl: 6 }} pb={10}>
      <Box maxW="1480px" mx="auto">
        <PageHeader
          title={id ? 'Edit Blog Post' : 'Create Blog Post'}
          description="Write, schedule and publish useful content for the PunjabShip resources library."
          actions={(
            <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', xl: 'flex-end' }}>
              <Button variant="outline" leftIcon={<FiArrowLeft />} onClick={() => history.push('/admin/blogs')}>Back to blogs</Button>
              <Badge colorScheme={statusColor} px={3} py={2} borderRadius="4px">{form.status}</Badge>
            </HStack>
          )}
          meta={[
            { label: 'Content type', value: 'Resource article' },
            { label: 'Category', value: form.category },
            { label: 'Visibility', value: form.status === 'published' ? 'Live' : 'Private until published' },
          ]}
        />

        <Flex justify="flex-end" mt={5} mb={5} gap={3} flexWrap="wrap">
          <Button variant="outline" leftIcon={<FiEye />} onClick={() => setPreview(true)}>Preview</Button>
          <Button variant="outline" leftIcon={<FiSave />} isLoading={busy} onClick={() => submit('draft')}>Save Draft</Button>
          <Button colorScheme="blue" leftIcon={<FiSend />} isLoading={busy} onClick={() => submit('published')}>{id ? 'Update & Publish' : 'Publish'}</Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 5, xl: 6 }} alignItems="start">
          <VStack align="stretch" spacing={5}>
            <Panel title="Article details" description="Set the title and summary readers will see across the resource library.">
              <VStack align="stretch" spacing={5}>
                <FormControl isInvalid={!!errors.title}>
                  <FormLabel>Title</FormLabel>
                  <Input value={form.title} onChange={(e) => change('title', e.target.value)} placeholder="A helpful article title" maxLength={512} />
                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.slug}>
                  <FormLabel>URL slug</FormLabel>
                  <Input value={form.slug} onChange={(e) => change('slug', e.target.value)} placeholder="article-url-slug" fontFamily="mono" />
                  <FieldHint>Used in the public URL: /blogs/your-slug</FieldHint>
                  <FormErrorMessage>{errors.slug}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.excerpt}>
                  <Flex justify="space-between" align="center"><FormLabel mb={1}>Excerpt</FormLabel><Text fontSize="xs" color="gray.500">{form.excerpt.length}/500</Text></Flex>
                  <Textarea value={form.excerpt} onChange={(e) => change('excerpt', e.target.value)} maxLength={500} rows={4} placeholder="A short summary shown on cards and search results." />
                  <FormErrorMessage>{errors.excerpt}</FormErrorMessage>
                </FormControl>
              </VStack>
            </Panel>

            <Panel title="Article content" description="Use headings, lists and links to keep the article easy to scan.">
              <FormControl isInvalid={!!errors.content}>
                <Box border="1px solid" borderColor={errors.content ? 'red.500' : 'gray.200'} borderRadius="8px" overflow="hidden" bg="white" sx={{
                  '.rdw-editor-toolbar': { border: 0, borderBottom: '1px solid #E2E8F0', bg: '#F7F8FA', px: 3, py: 2, mb: 0 },
                  '.rdw-editor-main': { minH: '360px', px: 4, py: 3 },
                  '.public-DraftEditor-content': { minH: '330px' },
                }}>
                  <Editor
                    editorState={editorState}
                    onEditorStateChange={onEditorChange}
                    toolbar={{
                      options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'image', 'history'],
                      inline: { options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'] },
                      blockType: { options: ['Normal', 'H2', 'H3', 'Blockquote'] },
                    }}
                  />
                </Box>
                <FormErrorMessage>{errors.content}</FormErrorMessage>
              </FormControl>
            </Panel>

            <Panel title="Search appearance" description="Optional metadata that improves how this article appears in search results.">
              <VStack align="stretch" spacing={5}>
                <FormControl><FormLabel>SEO title</FormLabel><Input value={form.meta_title} onChange={(e) => change('meta_title', e.target.value)} maxLength={200} placeholder="Search result title" /></FormControl>
                <FormControl><FormLabel>SEO description</FormLabel><Textarea value={form.meta_description} onChange={(e) => change('meta_description', e.target.value)} maxLength={500} rows={3} placeholder="Search result description" /></FormControl>
                <FormControl><FormLabel>Focus keywords</FormLabel><Input value={form.focus_keywords} onChange={(e) => change('focus_keywords', e.target.value)} placeholder="shipping, delivery, ecommerce" /></FormControl>
              </VStack>
            </Panel>
          </VStack>

          <VStack align="stretch" spacing={5}>
            <Panel title="Publishing" description="Choose where and when this article becomes visible on the landing page.">
              <VStack align="stretch" spacing={5}>
                <FormControl><FormLabel>Category</FormLabel><Select value={form.category} onChange={(e) => change('category', e.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></FormControl>
                <FormControl isInvalid={!!errors.published_at}>
                  <FormLabel>Publication status</FormLabel>
                  <Select value={form.status} onChange={(e) => change('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></Select>
                  {form.status === 'scheduled' ? <Input mt={3} type="datetime-local" value={form.published_at || ''} onChange={(e) => change('published_at', e.target.value)} /> : null}
                  <FormErrorMessage>{errors.published_at}</FormErrorMessage>
                </FormControl>
                <Divider />
                <Flex justify="space-between" align="center" gap={4}><Box><Text fontWeight="700" color="gray.800">Featured article</Text><Text mt={1} fontSize="xs" color="gray.500" lineHeight="1.4">Show in the homepage insights section.</Text></Box><Switch isChecked={form.is_featured} onChange={(e) => change('is_featured', e.target.checked)} colorScheme="yellow" flexShrink={0} /></Flex>
              </VStack>
            </Panel>

            <Panel title="Author" description="Identify the person or team responsible for this article.">
              <VStack align="stretch" spacing={5}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl><FormLabel>Name</FormLabel><Input value={form.author_name} onChange={(e) => change('author_name', e.target.value)} /></FormControl>
                  <FormControl><FormLabel>Role</FormLabel><Input value={form.author_role} onChange={(e) => change('author_role', e.target.value)} /></FormControl>
                </SimpleGrid>
                <FormControl><FormLabel>Tags</FormLabel><Input value={form.tags} onChange={(e) => change('tags', e.target.value)} placeholder="Comma-separated tags" /></FormControl>
              </VStack>
            </Panel>

            <Panel title="Cover image" description="Add a clear image for the article card and social sharing preview.">
              {imagePreview ? (
                <Box><Box as="img" src={imagePreview} alt={form.featured_image_alt || 'Blog cover'} w="full" h={{ base: '170px', md: '210px' }} objectFit="cover" borderRadius="6px" mb={4} /><Button size="sm" variant="outline" onClick={() => setForm({ ...form, og_image: '', featured_image: '' })}>Remove image</Button></Box>
              ) : <FileUploader folderKey="blogs" getUrl showUploadButton={false} accept="image/jpeg,image/png,image/webp" multiple={false} onUploaded={onImage} />}
              <FormControl mt={5}><FormLabel>Image alt text</FormLabel><Input value={form.featured_image_alt} onChange={(e) => change('featured_image_alt', e.target.value)} placeholder="Describe the cover image" /></FormControl>
            </Panel>
          </VStack>
        </SimpleGrid>
      </Box>

      <Modal isOpen={preview} onClose={() => setPreview(false)} size="4xl">
        <ModalOverlay /><ModalContent><ModalHeader>{form.title || 'Article preview'}</ModalHeader><ModalCloseButton /><ModalBody pb={8}><Text color="gray.500" mb={5}>{form.excerpt}</Text><Box className="blog-preview-content" dangerouslySetInnerHTML={{ __html: form.content }} /></ModalBody></ModalContent>
      </Modal>
    </Box>
  )
}
