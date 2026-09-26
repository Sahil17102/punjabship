import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  type ButtonProps,
} from '@mui/material'
import { keyframes, styled } from '@mui/material/styles'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { IoCloudUploadOutline } from 'react-icons/io5'
import { MdClose, MdEdit } from 'react-icons/md' // ← new
import { uploadAuthenticatedFile, uploadEmbeddedShopifyFile } from '../../../api/upload.api'
import { isEmbeddedShopifyContext } from '../../../utils/shopifyEmbedded'
import { toast } from '../Toast'
import styles from './uploader.module.css'

/* ---------------------------------------------------------------- types */
export interface UploadedFileInfo {
  url: string
  key: string
  originalName: string
  size: number
  mime: string
}

interface FileUploaderProps {
  variant?: 'button' | 'avatar' | 'dnd'
  accept?: string
  maxSizeMb?: number
  folderKey?: string
  showAccept?: boolean
  multiple?: boolean
  error?: boolean
  avatarSize?: number
  placeholder?: string | React.ReactNode
  showPlaceholderImgByDefault?: boolean
  onUploaded: (files: UploadedFileInfo[]) => void
  loadingPreview?: boolean
  label?: string
  fullWidth?: boolean
  required?: boolean
}

/* ---------------------------------------------------------------- style */
const cleanBox = (error?: boolean) => ({
  background: '#FFFFFF',
  border: error ? `2px solid #E74C3C` : `1px solid rgba(17, 24, 39, 0.12)`,
  boxShadow: 'none',
})

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(217, 4, 22, .35); }
  70% { box-shadow: 0 0 0 12px rgba(217, 4, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(217, 4, 22, 0); }
`

const GlassDropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'dragging',
})<{ active: boolean; dragging: boolean }>(({ active, dragging }) => ({
  background: active || dragging ? 'rgba(217, 4, 22, 0.04)' : '#FFFFFF',
  border: `1px dashed ${active || dragging ? '#0877C9' : 'rgba(17, 24, 39, 0.18)'}`,
  borderRadius: 0,
  padding: '24px',
  width: '100%',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all .3s ease',
  '&:hover': {
    borderColor: '#0877C9',
    background: 'rgba(217, 4, 22, 0.03)',
  },
  ...(dragging && {
    background: 'rgba(217, 4, 22, 0.05)',
    borderColor: '#0877C9',
  }),
}))

interface GlassButtonProps extends ButtonProps {
  error?: boolean
}

const GlassButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'error',
})<GlassButtonProps>(({ theme, error, fullWidth }) => ({
  ...cleanBox(error),
  borderRadius: 0,
  paddingInline: theme.spacing(2.5),
  paddingBlock: theme.spacing(1),
  width: fullWidth ? '100%' : 'auto',
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.875rem',
  color: error ? '#E74C3C' : '#0877C9',
  [theme.breakpoints.down('sm')]: { width: '100%' },
  '&:hover': {
    background: error ? 'rgba(231, 76, 60, 0.06)' : 'rgba(217, 4, 22, 0.04)',
    borderColor: error ? '#E74C3C' : '#0877C9',
  },
  transition: 'all 0.3s ease',
}))

const PreviewImg = styled('img')(({ theme }) => ({
  maxWidth: 140,
  borderRadius: 0,
  objectFit: 'contain',
  border: '1px solid rgba(17, 24, 39, 0.12)',
  [theme.breakpoints.down('sm')]: { maxWidth: 100 },
}))

/* -------------------------------------------------------------------- */
const FileUploader: React.FC<FileUploaderProps> = ({
  variant = 'button',
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMb = 5,
  error = false,
  multiple = false,
  avatarSize = 112,
  placeholder,
  folderKey,
  onUploaded,
  label,
  fullWidth,
  showAccept = false,
  required = false,
  showPlaceholderImgByDefault = false,
  loadingPreview = false,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const avSize = isMobile ? Math.round(avatarSize * 0.7) : avatarSize

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFiles, setPreviewFiles] = useState<{ url: string; name: string; type: string }[]>(
    [],
  )
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [fileMeta, setFileMeta] = useState<{
    url?: string
    type?: string
    name?: string
  } | null>(null)

  /* -------- accept mapping -------- */
  const dropzoneAccept: Accept | undefined = useMemo(() => {
    if (!accept) return undefined
    if (typeof accept !== 'string') return accept
    return accept.split(',').reduce<Accept>((acc, ext) => {
      const k = ext.trim()
      if (k) acc[k] = []
      return acc
    }, {})
  }, [accept])

  /* ---------------- helpers ---------------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearAll = (e: any) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setShowPlaceholder(false)
    onUploaded([]) // notify parent
    setFileMeta(null)
    setPreviewFiles([])
  }

  const resetUploadState = () => {
    setProgress(0)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const renderPlaceholder = () =>
    typeof placeholder === 'string' ? (
      <PreviewImg src={placeholder} alt="placeholder" />
    ) : (
      placeholder
    )
  /* --------------- upload logic --------------- */
  const uploadFiles = useCallback(
    async (files: File[] | FileList) => {
      const uploaded: UploadedFileInfo[] = []
      const arr = Array.from(files)
      for (const file of arr) {
        if (file.size / 1024 / 1024 > maxSizeMb) {
          alert(`${file.name} exceeds ${maxSizeMb} MB limit`)
          return
        }
      }

      setUploading(true)

      try {
        for (const file of arr) {
          const data = isEmbeddedShopifyContext()
            ? await uploadEmbeddedShopifyFile(file, folderKey, setProgress)
            : await uploadAuthenticatedFile(file, folderKey, setProgress)

          uploaded.push({
            url: data.publicUrl,
            key: data.key,
            originalName: file.name,
            size: file.size,
            mime: file.type,
          })

          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            setPreviewUrl(URL.createObjectURL(file)) // optional
            const preview = {
              url: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
            }
            setFileMeta(preview)
            if (multiple) setPreviewFiles((prev) => [...prev, preview])
          } else {
            setFileMeta({ type: file.type, name: file.name })
          }

          // setShowPlaceholder(false);
        }
        onUploaded(uploaded)
      } catch (error) {
        if (!isEmbeddedShopifyContext()) console.error(error)
        const message =
          typeof error === 'object' &&
          error &&
          'response' in error &&
          typeof (error as any).response?.data?.message === 'string'
            ? (error as any).response.data.message
            : isEmbeddedShopifyContext()
              ? 'The upload could not be completed. Please check your connection and select the file again; retrying is safe.'
              : 'Upload failed. Please check your connection and try again.'
        toast.open({
          message,
          severity: 'error',
        })
      } finally {
        resetUploadState()
      }
    },
    [maxSizeMb, folderKey, multiple, onUploaded],
  )
  const removeFile = (index: number) => {
    setPreviewFiles((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      onUploaded(
        updated.map((f) => ({
          url: f.url,
          key: '', // Or track uploaded file keys separately
          originalName: f.name,
          size: 0,
          mime: f.type,
        })),
      )
      return updated
    })
  }
  /* --------------- handlers ---------------- */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files)
  }
  const selectFiles = () => inputRef.current?.click()
  const onDrop = useCallback(
    (files: File[]) => {
      if (files.length) uploadFiles(files)
    },
    [uploadFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: dropzoneAccept,
    disabled: variant !== 'dnd' || uploading,
  })
  /* --------------------- Variant: AVATAR --------------------- */
  if (variant === 'avatar') {
    const avatarSrc = previewUrl || (typeof placeholder === 'string' ? placeholder : undefined)

    return (
      <Stack spacing={1} alignItems="center">
        <input
          ref={inputRef}
          type="file"
          accept={typeof accept === 'string' ? accept : undefined}
          hidden
          onChange={handleFileInput}
        />

        <Box
          sx={{
            width: avSize + 16,
            height: avSize + 16,
            position: 'relative', // important
            overflow: 'visible', // allow icons to float outside
          }}
        >
          {/* Avatar + overlay container */}
          <Box
            sx={{
              width: avSize,
              height: avSize,
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              mx: 'auto',
              background: '#FFFFFF',
              border: '1px solid rgba(17, 24, 39, 0.12)',
              ...(uploading && {
                animation: `${pulse} 1.6s ease-in-out infinite`,
                borderColor: '#0877C9',
              }),
            }}
          >
            <Avatar
              src={avatarSrc}
              sx={{
                width: '100%',
                height: '100%',
                filter: uploading || loadingPreview ? 'grayscale(40%)' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!avatarSrc && showPlaceholder && !loadingPreview && renderPlaceholder()}
              {loadingPreview && <CircularProgress size={32} />}
            </Avatar>

            {/* Progress ring */}
            <Fade in={uploading} unmountOnExit>
              <CircularProgress
                size={avSize}
                variant="determinate"
                value={progress}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  color: theme.palette.primary.main,
                  opacity: 0.6,
                }}
              />
            </Fade>
          </Box>

          {/* Remove button – floats top-right */}
          {(avatarSrc || (showPlaceholder && placeholder)) && !uploading && !loadingPreview && (
            <IconButton
              onClick={(e) => {
                clearAll(e)
              }}
              size="small"
              sx={{
                position: 'absolute',
                top: 18,
                right: 14,
                transform: 'translate(50%, -50%)',
                zIndex: 2,
                bgcolor: '#E74C3C',
                color: '#FFFFFF',
                width: 28,
                height: 28,
                borderRadius: 0,
                '&:hover': {
                  bgcolor: '#C0392B',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <MdClose size={16} />
            </IconButton>
          )}

          {/* Edit button – floats bottom-right */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              selectFiles()
            }}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 22,
              right: 27,
              transform: 'translate(50%, 50%)',
              zIndex: 2,
              bgcolor: '#0877C9',
              color: '#FFFFFF',
              width: 28,
              height: 28,
              borderRadius: 0,
              '&:hover': {
                bgcolor: '#5519A8',
              },
              transition: 'all 0.3s ease',
              '&:disabled': {
                bgcolor: '#E0E6ED',
                color: '#A0AEC0',
              },
            }}
            disabled={uploading || loadingPreview}
          >
            <MdEdit size={16} />
          </IconButton>
        </Box>
      </Stack>
    )
  }

  /* --------------------- Variant: DND ------------------------ */
  if (variant === 'dnd') {
    return (
      <Stack spacing={1}>
        {label && (
          <Typography
            sx={{ fontSize: '12px', color: '#374151', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            className={`${styles.customLabel}`}
            onClick={() => inputRef.current?.focus()}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </Typography>
        )}
        <GlassDropZone
          {...getRootProps()}
          active={isDragActive}
          dragging={isDragActive || uploading}
        >
          <input {...getInputProps()} />

          {loadingPreview || uploading ? (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography variant="body2" fontWeight={500}>
                {loadingPreview ? 'Loading preview…' : `${progress}%`}
              </Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={2}>
              <IoCloudUploadOutline size={46} color="#0877C9" />
              <Typography variant="subtitle1" fontWeight={600} color="#1A1A1A">
                Drag files here or click to upload
              </Typography>{' '}
              {showPlaceholderImgByDefault &&
                placeholder &&
                typeof placeholder === 'string' &&
                !fileMeta &&
                previewFiles.length === 0 && (
                <Box position="relative" display="inline-block">
                  <PreviewImg src={placeholder} />
                  <IconButton
                    onClick={clearAll}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: '#E74C3C',
                      color: '#FFFFFF',
                      width: 28,
                      height: 28,
                      borderRadius: 0,
                      '&:hover': {
                        bgcolor: '#C0392B',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <MdClose size={16} />
                  </IconButton>
                </Box>
              )}
              {!multiple && fileMeta && (
                <Box position="relative" display="inline-block" mt={1}>
                  {fileMeta.type?.startsWith('image/') ? (
                    <PreviewImg src={fileMeta.url} />
                  ) : fileMeta.type?.startsWith('video/') ? (
                    <video
                      src={fileMeta.url}
                      controls
                      style={{
                        maxWidth: '140px',
                        borderRadius: '0',
                        border: '1px solid rgba(17, 24, 39, 0.12)',
                      }}
                    />
                  ) : (
                    <Stack
                      spacing={0.5}
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 0,
                        backgroundColor: '#F9FAFB',
                        border: '1px solid rgba(17, 24, 39, 0.12)',
                        minWidth: 160,
                      }}
                    >
                      <Typography fontSize={40}>
                        {fileMeta.type?.includes('pdf') ? '📕' : '📄'}
                      </Typography>
                      <Typography
                        fontSize={12}
                        fontWeight={600}
                        color="#1A1A1A"
                        noWrap
                        maxWidth={160}
                      >
                        {fileMeta.name}
                      </Typography>
                    </Stack>
                  )}

                  <IconButton
                    onClick={clearAll}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: '#E74C3C',
                      color: '#FFFFFF',
                      width: 28,
                      height: 28,
                      borderRadius: 0,
                      '&:hover': {
                        bgcolor: '#C0392B',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <MdClose size={16} />
                  </IconButton>
                </Box>
              )}
              {multiple && previewFiles?.length > 0 && (
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={2}
                  justifyContent="center"
                  alignItems="center"
                >
                  {previewFiles.map((file, idx) => (
                    <Box key={idx} position="relative" display="inline-block" maxWidth={140}>
                      {file.type.startsWith('image/') ? (
                        <PreviewImg src={file.url} alt={file.name} />
                      ) : file.type.startsWith('video/') ? (
                        <video
                          src={file.url}
                          controls
                          style={{
                            maxWidth: '140px',
                            borderRadius: '0',
                            border: '1px solid rgba(17, 24, 39, 0.12)',
                          }}
                        />
                      ) : (
                        <Stack
                          spacing={0.5}
                          alignItems="center"
                          justifyContent="center"
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 0,
                            backgroundColor: '#F9FAFB',
                            border: '1px solid rgba(17, 24, 39, 0.12)',
                            minWidth: 160,
                          }}
                        >
                          <Typography fontSize={40}>
                            {file.type.includes('pdf') ? '📕' : '📄'}
                          </Typography>
                          <Typography
                            fontSize={12}
                            fontWeight={600}
                            color="#1A1A1A"
                            noWrap
                            maxWidth={160}
                          >
                            {file.name}
                          </Typography>
                        </Stack>
                      )}

                      <IconButton
                        onClick={() => removeFile(idx)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          bgcolor: '#E74C3C',
                          color: '#FFFFFF',
                          width: 28,
                          height: 28,
                          borderRadius: 0,
                          '&:hover': {
                            bgcolor: '#C0392B',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <MdClose size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </GlassDropZone>
      </Stack>
    )
  }

  /* --------------------- Variant: BUTTON --------------------- */
  return (
    <Stack>
      {label && (
        <Typography
          sx={{ fontSize: '12px', color: '#374151', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          className={`${styles.customLabel}`}
          onClick={() => inputRef.current?.focus()}
        >
          {label}
          {required && <span className={styles.required}>*</span>}
        </Typography>
      )}

      <Stack
        direction={{ xs: 'column', sm: fullWidth ? 'column' : 'row' }}
        alignItems="center"
        spacing={1}
        width="100%"
      >
        <input
          ref={inputRef}
          type="file"
          accept={typeof accept === 'string' ? accept : undefined}
          hidden
          multiple={multiple}
          onChange={handleFileInput}
        />

        <GlassButton
          error={error}
          startIcon={<IoCloudUploadOutline />}
          fullWidth={fullWidth}
          onClick={selectFiles}
          disabled={uploading || loadingPreview}
        >
          {loadingPreview
            ? 'Loading…'
            : uploading
            ? 'Uploading…'
            : placeholder
            ? 'Replace File'
            : multiple
            ? 'Choose files'
            : 'Choose file'}
        </GlassButton>
        {accept && showAccept && (
          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                color: '#6B7280',
                textAlign: 'right',
              }}
            >
              Accepted file types:{' '}
              {accept
                .split(',')
                .map((type) => {
                  const ext = type.trim()
                  if (ext === 'image/jpeg') return 'JPEG'
                  if (ext === 'image/png') return 'PNG'
                  if (ext === 'application/pdf') return 'PDF'
                  if (ext === 'image/*') return 'Images'
                  if (ext === '.doc') return 'DOC'
                  if (ext === '.docx') return 'DOCX'
                  return ext.replace(/^.*\//, '').toUpperCase() // fallback
                })
                .join(', ')}
            </Typography>
          </Box>
        )}

        {(uploading || loadingPreview) && (
          <LinearProgress
            variant={uploading ? 'determinate' : 'indeterminate'}
            value={uploading ? progress : undefined}
            sx={{
              flex: 1,
              borderRadius: 0,
              height: 8,
              bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                borderRadius: 0,
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              },
            }}
          />
        )}

        {placeholder && typeof placeholder === 'string' ? (
          <Box display="flex" flexWrap={'wrap'} alignItems="center" gap={1}>
            <Typography fontSize={'13px'}>{placeholder.split('/').pop()}</Typography>

            {(previewUrl || placeholder) && (
              <IconButton
                onClick={clearAll}
                size="small"
                sx={{
                  bgcolor: '#E74C3C',
                  color: '#FFFFFF',
                  width: 28,
                  height: 28,
                  borderRadius: 0,
                  '&:hover': {
                    bgcolor: '#C0392B',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <MdClose size={16} />
              </IconButton>
            )}
          </Box>
        ) : null}
      </Stack>
    </Stack>
  )
}

export default FileUploader
