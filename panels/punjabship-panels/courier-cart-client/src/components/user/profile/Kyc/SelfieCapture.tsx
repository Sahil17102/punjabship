import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { FiCamera, FiRefreshCw, FiUpload } from 'react-icons/fi'
import { uploadAuthenticatedFile, uploadEmbeddedShopifyFile } from '../../../../api/upload.api'
import { isEmbeddedShopifyContext } from '../../../../utils/shopifyEmbedded'
import { toast } from '../../../UI/Toast'

interface SelfieCaptureProps {
  value?: string
  onChange: (details: { key: string; mime: string; originalName: string }) => void
  error?: string
}

const SelfieCapture: React.FC<SelfieCaptureProps> = ({ value, onChange, error }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
    setCameraOpen(false)
  }

  const setLocalPreview = (file: File) => {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current)
    previewObjectUrlRef.current = URL.createObjectURL(file)
    setPreviewUrl(previewObjectUrlRef.current)
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current)
  }, [])

  useEffect(() => {
    if (!cameraOpen) return

    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    const markReady = () => {
      if (!video.videoWidth || !video.videoHeight) return
      setCameraReady(true)
      setCameraError('')
    }
    const handlePlaybackError = () => {
      setCameraReady(false)
      setCameraError('Camera preview could not start. Close the camera and try again.')
    }

    video.srcObject = stream
    video.addEventListener('loadedmetadata', markReady)
    video.addEventListener('canplay', markReady)
    void video.play().then(markReady).catch(handlePlaybackError)

    return () => {
      video.removeEventListener('loadedmetadata', markReady)
      video.removeEventListener('canplay', markReady)
    }
  }, [cameraOpen])

  const uploadSelfie = async (file: File) => {
    setUploading(true)
    setProgress(0)
    try {
      const uploaded = isEmbeddedShopifyContext()
        ? await uploadEmbeddedShopifyFile(file, 'kyc', setProgress)
        : await uploadAuthenticatedFile(file, 'kyc', setProgress)
      setLocalPreview(file)
      onChange({ key: uploaded.key, mime: file.type || 'image/jpeg', originalName: file.name })
      toast.open({ message: 'Live selfie captured and uploaded.', severity: 'success' })
    } catch (uploadError) {
      const message =
        typeof uploadError === 'object' && uploadError && 'response' in uploadError
          ? (uploadError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.open({ message: message || 'Selfie upload failed. Please try again.', severity: 'error' })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const openCamera = async () => {
    setCameraError('')
    setCameraReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser. Use the phone camera option instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch {
      setCameraError('Camera access was blocked or unavailable. Allow camera permission and try again.')
    }
  }

  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is still starting. Please wait a moment and capture again.')
      return
    }
    const maxWidth = 960
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) return
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Could not capture the selfie. Please try again.')
        return
      }
      stopCamera()
      void uploadSelfie(new File([blob], `live-selfie-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  const useSelectedPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.open({ message: 'Please select a face photo in JPG or PNG format.', severity: 'error' })
      return
    }
    void uploadSelfie(file)
  }

  return (
    <Box sx={{ mt: 3, p: { xs: 1.5, md: 2 }, border: `1px solid ${error ? '#E74C3C' : 'rgba(15, 23, 42, 0.12)'}`, bgcolor: '#F8FAFC' }}>
      <Typography fontSize={14} fontWeight={800} color="#111827">
        Live face selfie <Box component="span" color="#E74C3C">*</Box>
      </Typography>
      <Typography fontSize={12} color="#6B7280" mt={0.5} mb={2}>
        Take a clear, front-facing photo. It will be sent securely for admin KYC review.
      </Typography>

      {cameraOpen ? (
        <Stack spacing={1.5} alignItems="center">
          <Box component="video" ref={videoRef} autoPlay muted playsInline sx={{ width: '100%', maxWidth: 520, bgcolor: '#111827', transform: 'scaleX(-1)', aspectRatio: '4 / 3', objectFit: 'cover' }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" startIcon={<FiCamera />} onClick={captureSelfie} disabled={!cameraReady || uploading}>
              {cameraReady ? 'Capture selfie' : 'Starting camera...'}
            </Button>
            <Button variant="outlined" onClick={stopCamera}>Cancel</Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5} alignItems="flex-start">
          {previewUrl ? (
            <Box component="img" src={previewUrl} alt="Captured live selfie" sx={{ width: 180, height: 180, objectFit: 'cover', border: '1px solid rgba(15, 23, 42, 0.12)' }} />
          ) : value ? (
            <Typography fontSize={13} fontWeight={700} color="success.main">Selfie uploaded. You can capture a new one to replace it.</Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" startIcon={value ? <FiRefreshCw /> : <FiCamera />} onClick={openCamera} disabled={uploading}>
              {value ? 'Retake with camera' : 'Open camera'}
            </Button>
            <Button variant="outlined" startIcon={<FiUpload />} onClick={() => inputRef.current?.click()} disabled={uploading}>
              Use phone camera / upload
            </Button>
          </Stack>
        </Stack>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png" capture="user" hidden onChange={useSelectedPhoto} />
      <canvas ref={canvasRef} hidden />
      {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, width: '100%' }} />}
      {(cameraError || error) && <Typography fontSize={12} color="error" mt={1}>{cameraError || error}</Typography>}
    </Box>
  )
}

export default SelfieCapture
