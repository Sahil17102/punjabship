import { Box, Button, Card, Grid, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import StatusChip from '../UI/chip/StatusChip'
import PageHeading from '../UI/heading/PageHeading'

const HelpfulResources = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const cards = [
    {
      image: '/images/blog.png',
      title: 'Explore Our Blog',
      description: 'Get insights, product updates, and how-to guides to stay̦ ahead.',
      buttonText: 'Read Blogs',
      onClick: () => window.open('https://punjabship.onrender.com/blogs', '_blank'),
    },
    {
      image: '/images/keyboard.png',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow with handy keyboard combinations.',
      buttonText: 'View Shortcuts',
      onClick: () => navigate('/help/shortcuts'),
    },
  ]

  return (
    <Stack gap={3}>
      <PageHeading title="Helpful Resources" fontSize="18px" />

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid size={{ md: 6, xs: 12 }} key={index}>
            <Card
              sx={{
                position: 'relative',
                backdropFilter: 'blur(12px)',
                background: 'linear-gradient(135deg, #FFFFFF 70%, #F5F7FA 100%)',
                borderRadius: '16px',
                px: 3,
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                color: '#0877C9',
                height: '100%',
                border: '1px solid #3DD598',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #0877C9',
                },
              }}
            >
              {/* Optional Highlight Chip */}
              {index === 1 ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  }}
                >
                  <StatusChip status="info" label="NEW" />
                </Box>
              ) : null}

              {/* Image */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16 / 5', // or fixed height if needed
                  position: 'relative',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Glow Aura Background */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background:
                      'radial-gradient(circle at center, rgba(59, 74, 116, 0.15), transparent 70%)',
                    filter: 'blur(40px)',
                    zIndex: 1,
                  }}
                />

                {/* Actual Image */}
                <img
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                />
              </Box>

              {/* Title */}
              <Typography fontWeight={600} fontSize="16px" sx={{ color: '#0877C9' }}>
                {card.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{ color: '#0877C9', fontSize: '13px', lineHeight: 1.6, opacity: 0.8 }}
              >
                {card.description}
              </Typography>

              {/* CTA */}
              <Button
                onClick={card.onClick}
                variant="contained"
                sx={{
                  mt: 'auto',
                  alignSelf: isMobile ? 'center' : 'flex-start',
                  bgcolor: '#0877C9',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#2F3B5F',
                  },
                }}
              >
                {card.buttonText}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default HelpfulResources
