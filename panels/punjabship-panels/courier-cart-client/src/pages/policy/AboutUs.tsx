import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { getStaticPage } from '../../api/staticPages.service'
import PageHeading from '../../components/UI/heading/PageHeading'

const ABOUT_US_SLUG = 'about_us'

const AboutUs = () => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const page = await getStaticPage(ABOUT_US_SLUG)
        if (!mounted) return
        setContent(page?.content || '')
        setLastUpdated(page?.updated_at || null)
      } catch (err: unknown) {
        if (!mounted) return
        const status = (err as { response?: { status?: number } } | undefined)?.response?.status
        setError(
          status === 404
            ? 'About Us content is not configured yet. Please contact support.'
            : 'Failed to load About Us content. Please try again later.',
        )
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Stack gap={3} sx={{ py: 4, px: 4 }}>
      <PageHeading title="About Us – PunjabShip" />
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Typography variant="body2" color="error" mt={2}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated on {new Date(lastUpdated).toLocaleString()}
            </Typography>
          )}
          <Box
            sx={{
              mt: 2,
              '& h1, & h2, & h3, & h4, & h5, & h6': { fontWeight: 600, mt: 2, mb: 1 },
              '& p': { mb: 1.5, lineHeight: 1.7 },
              '& ul, & ol': { pl: 3, mb: 2 },
              '& li': { mb: 0.5 },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& img': { maxWidth: '100%', borderRadius: 1, my: 2 },
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </>
      )}
    </Stack>
  )
}

export default AboutUs
