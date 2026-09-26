import {
  Badge,
  Box,
  Button,
  CloseButton,
  Flex,
  Icon,
  Progress,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import axios from 'axios'
import { useState } from 'react'
import { LuUpload } from 'react-icons/lu'
import api from 'services/axios'

const FileUploader = ({
  onUploaded,
  multiple = false,
  maxSizeMb = 5,
  uploadLoading = false,
  showUploadButton = true,
  accept,
  getUrl = false, // new prop
  folderKey = 'default', // folder for presigned upload
}) => {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState([])
  const [previewFiles, setPreviewFiles] = useState([])

  const handleFiles = async (e) => {
    let selectedFiles = Array.from(e.target.files)

    if (!multiple && selectedFiles.length > 1) {
      toast({
        title: 'Multiple files not allowed',
        description: 'You can only select one file.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      selectedFiles = [selectedFiles[0]]
    }

    const oversized = selectedFiles.find((f) => f.size / 1024 / 1024 > maxSizeMb)
    if (oversized) {
      toast({
        title: 'File too large',
        description: `${oversized.name} exceeds ${maxSizeMb}MB limit`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    setFiles(selectedFiles)

    // ✅ Always show preview immediately
    const previews = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }))
    if (multiple) setPreviewFiles(previews)
    else setPreviewFiles([previews[0]])

    // Auto-upload if upload button is hidden
    if (!showUploadButton) await uploadFiles(selectedFiles)
  }

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
    setPreviewFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const uploadFiles = async (arr = files) => {
    if (!arr.length) return
    setUploading(true)
    const uploaded = []

    try {
      if (getUrl) {
        for (const file of arr) {
          try {
            const { data } = await api.post('/uploads/presign', {
              contentType: file.type || 'application/octet-stream',
              filename: file.name,
              folder: folderKey,
            })

            // Upload directly to R2 using presigned URL - no credentials needed
            await axios.put(data.uploadUrl, file, {
              headers: { 'Content-Type': file.type },
              withCredentials: false, // Don't send credentials for presigned URL uploads
              onUploadProgress: (e) =>
                e.total && setProgress(Math.round((e.loaded * 100) / e.total)),
            })

            uploaded.push({
              url: data.publicUrl,
              key: data.key,
              originalName: file.name,
              size: file.size,
              mime: file.type,
            })
          } catch (err) {
            console.error('Upload failed for file:', file.name, err)
            toast({
              title: `Upload failed: ${file.name}`,
              description: 'Check console for details.',
              status: 'error',
              duration: 4000,
              isClosable: true,
            })
          }
        }
      } else {
        // Simulated upload
        for (let i = 0; i < arr.length; i++) {
          const file = arr[i]
          await new Promise((res) => setTimeout(res, 500))
          setProgress(Math.round(((i + 1) / arr.length) * 100))
          uploaded.push({ name: file.name, size: file.size, type: file.type, file })
        }
      }

      onUploaded?.(uploaded)
      setProgress(0)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Upload process encountered errors',
        description: 'Check console for details.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Drag & Drop area */}
      <Box
        as="label"
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="xl"
        py={10}
        cursor="pointer"
        textAlign="center"
        _hover={{ bg: 'brand.50', borderColor: 'brand.400' }}
        transition="all 0.2s"
      >
        <Icon as={LuUpload} w={10} h={10} color="brand.400" />
        <Text fontSize="md" fontWeight="semibold" mt={2}>
          Drag & drop {multiple ? 'files' : 'a file'} here
        </Text>
        <Text fontSize="sm" color="gray.500">
          or click to select {multiple ? 'multiple files' : 'a file'}
        </Text>
        <input type="file" multiple={multiple} accept={accept} hidden onChange={handleFiles} />
      </Box>

      {/* Selected / Preview files list */}
      {previewFiles.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={2}>
            Selected Files:
          </Text>
          <Flex wrap="wrap" gap={2}>
            {previewFiles.map((f) => (
              <Badge
                key={f.name}
                colorScheme="brand"
                px={3}
                py={1}
                borderRadius="md"
                display="flex"
                alignItems="center"
                gap={2}
              >
                {f.name}
                <CloseButton size="sm" onClick={() => removeFile(f.name)} />
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      {(uploading || uploadLoading) && (
        <Progress value={progress} size="sm" colorScheme="teal" borderRadius="md" />
      )}

      {showUploadButton && (
        <Button
          colorScheme="brand"
          onClick={() => uploadFiles()}
          isLoading={uploading || uploadLoading}
          isDisabled={!files.length || uploading || uploadLoading}
        >
          Upload
        </Button>
      )}
    </VStack>
  )
}

export default FileUploader
