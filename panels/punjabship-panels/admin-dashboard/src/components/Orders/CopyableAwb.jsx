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
    <HStack
      spacing={1}
      align="center"
      flexWrap="nowrap"
      minW="max-content"
      maxW="none !important"
      whiteSpace="nowrap"
      sx={{ '&, & *': { whiteSpace: 'nowrap !important', overflowWrap: 'normal !important' } }}
    >
      <Button
        size="xs"
        variant="link"
        colorScheme="brand"
        fontFamily="mono"
        fontWeight="800"
        flexShrink={0}
        minW={0}
        onClick={(event) => {
          event.stopPropagation()
          openAdminTrackingTab(normalized)
        }}
      >
        {normalized}
      </Button>
      <Tooltip label="Copy AWB">
        <IconButton
          aria-label="Copy AWB"
          icon={<FiCopy />}
          size="xs"
          variant="ghost"
          flex="0 0 28px"
          minW="28px"
          w="28px"
          onClick={copyAwb}
        />
      </Tooltip>
      {showTrack && (
        <Tooltip label="Open tracking in new tab">
          <IconButton
            aria-label="Open tracking in new tab"
            icon={<FiExternalLink />}
            size="xs"
            variant="ghost"
            flex="0 0 28px"
            minW="28px"
            w="28px"
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
