import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'
import { FaceDetection, type Results as FaceDetectionResults } from '@mediapipe/face_detection'
import faceDetectionShortBinaryUrl from '@mediapipe/face_detection/face_detection_short.binarypb?url'
import faceDetectionShortModelUrl from '@mediapipe/face_detection/face_detection_short_range.tflite?url'
import faceDetectionSimdJsUrl from '@mediapipe/face_detection/face_detection_solution_simd_wasm_bin.js?url'
import faceDetectionSimdWasmUrl from '@mediapipe/face_detection/face_detection_solution_simd_wasm_bin.wasm?url'
import faceDetectionJsUrl from '@mediapipe/face_detection/face_detection_solution_wasm_bin.js?url'
import faceDetectionWasmUrl from '@mediapipe/face_detection/face_detection_solution_wasm_bin.wasm?url'
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

type FaceScanStatus = 'idle' | 'loading' | 'searching' | 'multiple' | 'position' | 'distance' | 'hold' | 'ready' | 'error'

const faceDetectionAssets: Record<string, string> = {
  'face_detection_short.binarypb': faceDetectionShortBinaryUrl,
  'face_detection_short_range.tflite': faceDetectionShortModelUrl,
  'face_detection_solution_simd_wasm_bin.js': faceDetectionSimdJsUrl,
  'face_detection_solution_simd_wasm_bin.wasm': faceDetectionSimdWasmUrl,
  'face_detection_solution_wasm_bin.js': faceDetectionJsUrl,
  'face_detection_solution_wasm_bin.wasm': faceDetectionWasmUrl,
}

const scanSweep = keyframes`
  0% { transform: translateY(0); opacity: 0.35; }
  50% { opacity: 1; }
  100% { transform: translateY(230px); opacity: 0.35; }
`

const scanMessages: Record<FaceScanStatus, string> = {
  idle: 'Start the camera to scan your face.',
  loading: 'Loading secure face scanner...',
  searching: 'Place one face inside the oval.',
  multiple: 'Only one person should be visible.',
  position: 'Center your face inside the oval.',
  distance: 'Move slightly closer to the camera.',
  hold: 'Face detected. Hold still...',
  ready: 'Face scan complete. You can capture now.',
  error: 'Face scanner could not start. Close the camera and try again.',
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
  const [validatingPhoto, setValidatingPhoto] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [faceScanStatus, setFaceScanStatus] = useState<FaceScanStatus>('idle')

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
    setFaceScanStatus('idle')
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

  useEffect(() => {
    if (!cameraOpen || !cameraReady || !videoRef.current) return

    const video = videoRef.current
    let cancelled = false
    let scanTimer: number | undefined
    let stableFrames = 0
    const detector = new FaceDetection({
      locateFile: (file) => faceDetectionAssets[file] || file,
    })

    const evaluateFace = (results: FaceDetectionResults) => {
      if (cancelled) return
      const detections = results.detections || []
      if (detections.length === 0) {
        stableFrames = 0
        setFaceScanStatus('searching')
        return
      }
      if (detections.length !== 1) {
        stableFrames = 0
        setFaceScanStatus('multiple')
        return
      }

      const face = detections[0]
      const { xCenter, yCenter, width, height } = face.boundingBox
      const hasFaceLandmarks = face.landmarks.length >= 4
      const centered = xCenter >= 0.32 && xCenter <= 0.68 && yCenter >= 0.3 && yCenter <= 0.68
      const closeEnough = width >= 0.22 && height >= 0.28

      if (!hasFaceLandmarks || !centered) {
        stableFrames = 0
        setFaceScanStatus('position')
      } else if (!closeEnough) {
        stableFrames = 0
        setFaceScanStatus('distance')
      } else {
        stableFrames += 1
        setFaceScanStatus(stableFrames >= 3 ? 'ready' : 'hold')
      }
    }

    const runScan = async () => {
      if (cancelled) return
      try {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          await detector.send({ image: video })
        }
        if (!cancelled) scanTimer = window.setTimeout(runScan, 250)
      } catch {
        if (!cancelled) setFaceScanStatus('error')
      }
    }

    setFaceScanStatus('loading')
    detector.setOptions({ selfieMode: true, model: 'short', minDetectionConfidence: 0.75 })
    detector.onResults(evaluateFace)
    void detector.initialize()
      .then(() => {
        if (!cancelled) void runScan()
      })
      .catch(() => {
        if (!cancelled) setFaceScanStatus('error')
      })

    return () => {
      cancelled = true
      if (scanTimer) window.clearTimeout(scanTimer)
      detector.onResults(() => undefined)
      void detector.close().catch(() => undefined)
    }
  }, [cameraOpen, cameraReady])

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

  const validateSelectedFacePhoto = async (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    const detector = new FaceDetection({
      locateFile: (asset) => faceDetectionAssets[asset] || asset,
    })
    let detectedFaces: FaceDetectionResults['detections'] = []

    try {
      image.src = objectUrl
      await image.decode()
      detector.setOptions({ selfieMode: true, model: 'short', minDetectionConfidence: 0.75 })
      detector.onResults((results) => {
        detectedFaces = results.detections || []
      })
      await detector.initialize()
      await detector.send({ image })

      if (detectedFaces.length !== 1) return false
      const face = detectedFaces[0]
      const { xCenter, yCenter, width, height } = face.boundingBox
      return face.landmarks.length >= 4
        && xCenter >= 0.2 && xCenter <= 0.8
        && yCenter >= 0.2 && yCenter <= 0.8
        && width >= 0.16 && height >= 0.2
    } finally {
      URL.revokeObjectURL(objectUrl)
      detector.onResults(() => undefined)
      await detector.close().catch(() => undefined)
    }
  }

  const openCamera = async () => {
    setCameraError('')
    setCameraReady(false)
    setFaceScanStatus('loading')
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

  const useSelectedPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.open({ message: 'Please select a face photo in JPG or PNG format.', severity: 'error' })
      return
    }
    setValidatingPhoto(true)
    try {
      const hasClearFace = await validateSelectedFacePhoto(file)
      if (!hasClearFace) {
        toast.open({ message: 'Upload rejected. Use one clear, centered face photo.', severity: 'error' })
        return
      }
      await uploadSelfie(file)
    } catch {
      toast.open({ message: 'Could not scan this photo. Please take a new face photo.', severity: 'error' })
    } finally {
      setValidatingPhoto(false)
    }
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
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 520, overflow: 'hidden', bgcolor: '#111827', aspectRatio: '4 / 3' }}>
            <Box component="video" ref={videoRef} autoPlay muted playsInline sx={{ width: '100%', height: '100%', transform: 'scaleX(-1)', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', inset: '8% 23%', border: `3px solid ${faceScanStatus === 'ready' ? '#22C55E' : '#F8FAFC'}`, borderRadius: '50%', boxShadow: '0 0 0 999px rgba(15, 23, 42, 0.28)', pointerEvents: 'none', overflow: 'hidden' }}>
              {faceScanStatus !== 'ready' && (
                <Box sx={{ position: 'absolute', left: '8%', right: '8%', top: 0, height: 2, bgcolor: '#38BDF8', boxShadow: '0 0 12px #38BDF8', animation: `${scanSweep} 2s ease-in-out infinite` }} />
              )}
            </Box>
          </Box>
          <Typography fontSize={13} fontWeight={800} color={faceScanStatus === 'ready' ? 'success.main' : faceScanStatus === 'error' ? 'error.main' : '#334155'}>
            {scanMessages[faceScanStatus]}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" startIcon={<FiCamera />} onClick={captureSelfie} disabled={!cameraReady || faceScanStatus !== 'ready' || uploading}>
              {faceScanStatus === 'ready' ? 'Capture selfie' : 'Scan face first'}
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
            <Button variant="contained" startIcon={value ? <FiRefreshCw /> : <FiCamera />} onClick={openCamera} disabled={uploading || validatingPhoto}>
              {value ? 'Retake with camera' : 'Open camera'}
            </Button>
            <Button variant="outlined" startIcon={<FiUpload />} onClick={() => inputRef.current?.click()} disabled={uploading || validatingPhoto}>
              {validatingPhoto ? 'Scanning face...' : 'Use phone camera / upload'}
            </Button>
          </Stack>
        </Stack>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png" capture="user" hidden onChange={useSelectedPhoto} />
      <canvas ref={canvasRef} hidden />
      {validatingPhoto && <LinearProgress sx={{ mt: 2, width: '100%' }} />}
      {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, width: '100%' }} />}
      {(cameraError || error) && <Typography fontSize={12} color="error" mt={1}>{cameraError || error}</Typography>}
    </Box>
  )
}

export default SelfieCapture
