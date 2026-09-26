import { Button, HStack, IconButton, Text, Tooltip, useToast } from '@chakra-ui/react'
import { FiCopy, FiExternalLink } from 'react-icons/fi'

const normalizeAwb = (value) => String(value || '').trim()

export const openAdminTrackingTab = (awb) => {
  const normalized = normalizeAwb(awb)
  if (!normalized || typeof window === 'undefined') return
  window.open(`/admin/order-tracking?awb=${encodeURIComponent(normalized)}`, '_blank', 'noopener,noreferrer')
}

export default function CopyableAwb({ awb, showTrack = true }) {
  const toast = useToast()
  const normalized = normalizeAwb(awb)

  if (!normalized) return <Text color="gray.400">-</Text>

  const copyAwb = async (event) => {
    event?.stopPropagation?.()
    try {
      await navigator.clipboard.writeText(normalized)
      toast({ title: 'AWB copied', description: normalized, status: 'success', duration: 1600 })
    } catch {
      toast({ title: 'Copy failed', status: 'error', duration: 1800 })
    }
  }

  return (
    <HStack spacing={1.5} align="center">
      <Button
        size="xs"
        variant="link"
        colorScheme="brand"
        fontFamily="mono"
        fontWeight="800"
        onClick={(event) => {
          event.stopPropagation()
          openAdminTrackingTab(normalized)
        }}
      >
        {normalized}
      </Button>
      <Tooltip label="Copy AWB">
        <IconButton aria-label="Copy AWB" icon={<FiCopy />} size="xs" variant="ghost" onClick={copyAwb} />
      </Tooltip>
      {showTrack && (
        <Tooltip label="Open tracking in new tab">
          <IconButton
            aria-label="Open tracking in new tab"
            icon={<FiExternalLink />}
            size="xs"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation()
              openAdminTrackingTab(normalized)
            }}
          />
        </Tooltip>
      )}
    </HStack>
  )
}
