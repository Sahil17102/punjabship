import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { ContentState, convertFromHTML, convertToRaw, EditorState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import { useStaticPage, useUpdateStaticPage } from 'hooks/useStaticPage'
import { useEffect, useState } from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { FiCheck, FiRefreshCcw } from 'react-icons/fi'
import api from 'services/axios'

const ABOUT_US_SLUG = 'about_us'

const AboutUsEditor = () => {
  const toast = useToast()
  const textColor = useColorModeValue('gray.700', 'white')
  const bgColor = useColorModeValue('gray.50', 'gray.800')

  const { data: page, isLoading } = useStaticPage(ABOUT_US_SLUG)
  const updatePageMutation = useUpdateStaticPage(ABOUT_US_SLUG)

  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (page?.content) {
      const blocksFromHTML = convertFromHTML(page.content)
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap,
      )
      setEditorState(EditorState.createWithContent(contentState))
      setContent(page.content)
    }
  }, [page])

  const handleLoadTemplate = () => {
    const templateHtml = `
      <h2>About PunjabShip</h2>
      <p><strong>PunjabShip</strong> is a courier aggregator technology platform designed to help entrepreneurs, D2C brands, and logistics businesses run a branded shipping operation with a cleaner and more scalable software stack.</p>

      <h3>What We Do</h3>
      <ul>
        <li>Provide a ready-to-use white label logistics platform under your own brand</li>
        <li>Integrate with leading courier partners across India</li>
        <li>Offer advanced tools for tracking, billing, reconciliation, and operations</li>
      </ul>

      <h3>Why Brands Choose Us</h3>
      <ul>
        <li>Startup India recognized & MSME registered company</li>
        <li>End-to-end technology, hosting, maintenance, and support handled by us</li>
        <li>Scalable, profitable model with recurring revenue potential</li>
      </ul>

      <h3>Contact</h3>
      <p><strong>Registered Office:</strong> SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104</p>
      <p><strong>Email:</strong> info@punjabshiplogistics.com</p><p><strong>Phone:</strong> +91 84878 81121</p>
      <p><strong>Website:</strong> punjabship.onrender.com</p>
    `

    const blocksFromHTML = convertFromHTML(templateHtml)
    const contentState = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap,
    )
    setEditorState(EditorState.createWithContent(contentState))
    setContent(templateHtml)
  }

  const handleContentChange = (state) => {
    setEditorState(state)
    const html = draftToHtml(convertToRaw(state.getCurrentContent()))
    setContent(html)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!content.trim()) newErrors.content = 'Content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImageCallback = async (file) => {
    try {
      const { data } = await api.post('/uploads/presign', {
        contentType: file.type || 'image/*',
        filename: file.name,
        folder: 'about-us',
      })

      await api.put(data.uploadUrl, file, {
        headers: { 'Content-Type': file.type || 'image/*' },
      })

      // react-draft-wysiwyg expects this shape
      return { data: { link: data.publicUrl } }
    } catch (err) {
      console.error('Image upload failed', err)
      toast({
        title: 'Image upload failed',
        description: 'Please try again or use a smaller image.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      // Fallback: no image inserted
      return Promise.reject(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await updatePageMutation.mutateAsync({ title: 'About Us – PunjabShip', content })
      toast({
        title: 'About Us content saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to save About Us content',
        description: err?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }} bg={bgColor} minH="100vh" pb={10}>
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        position="sticky"
        top="0"
        zIndex="10"
        py={4}
        mb={6}
      >
        <Flex
          justify="space-between"
          align="center"
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 6 }}
        >
          <Box>
            <Heading size="md" color={textColor}>
              About Us Page
            </Heading>
            <HStack spacing={3} mt={1}>
              <Text fontSize="sm" color="gray.500">
                Manage rich content shown on the customer About Us screen.
              </Text>
              {page?.updated_at && (
                <Badge colorScheme="green" variant="subtle" fontSize="0.7rem">
                  Last updated: {new Date(page.updated_at).toLocaleString()}
                </Badge>
              )}
            </HStack>
          </Box>

          <HStack spacing={3}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiRefreshCcw />}
              onClick={handleLoadTemplate}
              isDisabled={isLoading || updatePageMutation.isLoading}
            >
              Load Template
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FiCheck />}
              onClick={handleSubmit}
              isLoading={updatePageMutation.isLoading}
            >
              Save
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }}>
        {isLoading && (
          <Text color="gray.500" mb={4}>
            Loading current content...
          </Text>
        )}

        <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="flex-start">
          <Box flex="1">
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired isInvalid={errors.content}>
                  <FormLabel fontSize="sm" fontWeight="600" mb={3}>
                    About Us Content
                  </FormLabel>
                  <Box
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    borderRadius="md"
                    overflow="visible"
                    bg="white"
                  >
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={handleContentChange}
                      wrapperClassName="editor-wrapper"
                      editorClassName="editor"
                      toolbarClassName="editor-toolbar"
                      toolbar={{
                        options: [
                          'inline',
                          'blockType',
                          'list',
                          'textAlign',
                          'link',
                          'image',
                          'history',
                        ],
                        inline: { inDropdown: false },
                        list: { inDropdown: true },
                        textAlign: { inDropdown: true },
                        link: { inDropdown: true },
                        image: {
                          uploadCallback: uploadImageCallback,
                          previewImage: true,
                          alt: { present: true, mandatory: false },
                        },
                        history: { inDropdown: false },
                      }}
                      editorStyle={{ minHeight: '400px', padding: '16px' }}
                      placeholder="Write the About Us content shown to customers..."
                    />
                  </Box>
                  {errors.content && <FormErrorMessage>{errors.content}</FormErrorMessage>}
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {
                      content
                        .replace(/<[^>]+>/g, '')
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{' '}
                    words
                  </Text>
                </FormControl>
              </VStack>
            </form>
          </Box>

          <Box
            flex={{ base: '1', lg: '0 0 40%' }}
            borderWidth="1px"
            borderRadius="md"
            p={4}
            bg={useColorModeValue('white', 'gray.900')}
            maxH="620px"
            overflowY="auto"
          >
            <Text fontSize="sm" fontWeight="600" mb={2}>
              Live Preview
            </Text>
            <Box
              fontSize="sm"
              color={textColor}
              sx={{
                '& h1, & h2, & h3, & h4, & h5, & h6': { fontWeight: 600, mt: 2, mb: 1 },
                '& p': { mb: 1.5, lineHeight: 1.7 },
                '& ul, & ol': { pl: 4, mb: 2 },
                '& li': { mb: 0.5 },
              }}
              dangerouslySetInnerHTML={{
                __html: content || '<p>Start writing to see preview here.</p>',
              }}
            />
          </Box>
        </Flex>
      </Box>
    </Box>
  )
}

export default AboutUsEditor
