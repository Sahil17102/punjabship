import { keyframes } from '@emotion/react'
import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  FiCheck,
  FiClock,
  FiMapPin,
  FiPackage,
  FiShield,
  FiTruck,
} from 'react-icons/fi'
import PhoneForm from './PhoneForm'

const PURPLE = '#0877C9'
const INK = '#1B1A1E'
const MUTED = '#6F6D75'

const parcelFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-9px) rotate(1deg); }
`

const truckDrive = keyframes`
  0% { transform: translateX(-8px); }
  50% { transform: translateX(112px); }
  100% { transform: translateX(-8px); }
`

const confirmationPop = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`

const stories = [
  {
    kicker: 'From order to label',
    title: 'Packed with care. Ready without the rush.',
    copy: 'Create labels and schedule pickups while the coffee is still warm.',
    color: '#0877C9',
    soft: '#EFECFF',
  },
  {
    kicker: 'Across every handoff',
    title: 'Easy to follow, all the way through.',
    copy: 'A clear journey from your shelf to their doorstep, without the chasing.',
    color: '#E66A1A',
    soft: '#FFF0E5',
  },
  {
    kicker: 'At the doorstep',
    title: 'Updates your customers actually want.',
    copy: 'Keep people in the loop and finish every order on a reassuring note.',
    color: '#087A68',
    soft: '#E6F6F2',
  },
]

function PackingScene() {
  return (
    <Box sx={{ position: 'relative', width: 190, height: 150, mx: 'auto' }}>
      <Box
        sx={{
          position: 'absolute',
          left: 39,
          bottom: 14,
          width: 112,
          height: 92,
          border: '2px solid #2A2530',
          borderRadius: 1,
          backgroundColor: '#D7A66A',
          boxShadow: '8px 10px 0 rgba(42,37,48,0.12)',
          animation: `${parcelFloat} 3.2s ease-in-out infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: 43,
            width: 24,
            height: 92,
            borderLeft: '2px solid #2A2530',
            borderRight: '2px solid #2A2530',
            backgroundColor: '#F0C791',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 12,
            width: 38,
            height: 25,
            p: 0.5,
            border: '1px solid #2A2530',
            backgroundColor: '#FFFDF7',
          }}
        >
          {[20, 29, 17].map((width) => (
            <Box key={width} sx={{ width, height: 2, mb: 0.4, backgroundColor: '#2A2530' }} />
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          right: 0,
          px: 1.2,
          py: 0.7,
          borderRadius: 4,
          color: '#3D2DB4',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(37,31,55,0.14)',
          fontSize: '0.66rem',
          fontWeight: 800,
        }}
      >
        Label ready
      </Box>
      <FiPackage
        size={22}
        color="#0877C9"
        style={{ position: 'absolute', left: 5, top: 15 }}
      />
    </Box>
  )
}

function MovementScene() {
  return (
    <Box sx={{ position: 'relative', width: 210, height: 150, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: '#FFFFFF',
            backgroundColor: '#E66A1A',
          }}
        >
          <FiPackage size={15} />
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: '#FFFFFF',
            backgroundColor: '#1B1A1E',
          }}
        >
          <FiMapPin size={15} />
        </Box>
      </Stack>
      <Box
        sx={{
          position: 'absolute',
          top: 47,
          left: 30,
          right: 30,
          height: 2,
          overflow: 'visible',
          backgroundImage:
            'repeating-linear-gradient(90deg, #B8B3AC 0, #B8B3AC 8px, transparent 8px, transparent 15px)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -14,
            left: 0,
            width: 34,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            color: '#FFFFFF',
            backgroundColor: '#E66A1A',
            boxShadow: '0 6px 16px rgba(230,106,26,0.28)',
            animation: `${truckDrive} 4.2s ease-in-out infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <FiTruck size={18} />
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: 31,
          right: 31,
          bottom: 17,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography sx={{ color: MUTED, fontSize: '0.62rem', fontWeight: 700 }}>
          Your shelf
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: '0.62rem', fontWeight: 700 }}>
          Their door
        </Typography>
      </Box>
    </Box>
  )
}

function DeliveryScene() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: 205,
        height: 150,
        mx: 'auto',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Box
        sx={{
          width: 150,
          p: 1.6,
          border: '1px solid #DAD7D0',
          borderRadius: 1,
          backgroundColor: '#FFFFFF',
          boxShadow: '8px 10px 0 rgba(8,122,104,0.12)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              color: '#FFFFFF',
              backgroundColor: '#087A68',
              animation: `${confirmationPop} 2.4s ease-in-out infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <FiCheck size={18} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontSize: '0.72rem', fontWeight: 850 }}>
              Delivered
            </Typography>
            <Typography sx={{ mt: 0.15, color: MUTED, fontSize: '0.58rem' }}>
              Safe at the front door
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          right: 2,
          top: 8,
          px: 1,
          py: 0.65,
          borderRadius: 4,
          color: '#087A68',
          backgroundColor: '#E6F6F2',
          fontSize: '0.62rem',
          fontWeight: 850,
        }}
      >
        Right on time
      </Box>
    </Box>
  )
}

const sceneVisuals = [<PackingScene />, <MovementScene />, <DeliveryScene />]

export default function LoginForm() {
  const [activeStory, setActiveStory] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = window.setInterval(() => {
      setActiveStory((current) => (current + 1) % stories.length)
    }, 4600)

    return () => window.clearInterval(interval)
  }, [paused])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(520px, 0.92fr) minmax(620px, 1.08fr)' },
        backgroundColor: '#F4F2EE',
        '& .MuiTypography-root, & .MuiButton-root, & input': {
          fontFamily: '"DM Sans", "Segoe UI", sans-serif',
        },
      }}
    >
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          minHeight: { xs: '100vh', lg: 'auto' },
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 6, lg: 7, xl: 10 },
          py: { xs: 3, sm: 5 },
          backgroundColor: '#FFFDF9',
          boxShadow: { lg: '18px 0 60px rgba(20,18,24,0.12)' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 470 }}>
          <Stack spacing={1} sx={{ mb: { xs: 4, sm: 5 } }}>
            <Box component="img" src="/logo/punjabship-logo.png" alt="PunjabShip - Ship the world" sx={{ width: 225, height: 75, objectFit: 'contain', objectPosition: 'left' }} />
            <Typography sx={{ color: MUTED, fontSize: '0.68rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Merchant workspace</Typography>
          </Stack>

          <Box sx={{ mb: 3.2 }}>
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.35 }}>
              <Box
                sx={{
                  width: 21,
                  height: 21,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: '#FFFFFF',
                  backgroundColor: '#087A68',
                }}
              >
                <FiCheck size={12} />
              </Box>
              <Typography
                sx={{
                  color: '#087A68',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Your secure workspace
              </Typography>
            </Stack>

            <Typography
              component="h1"
              sx={{
                maxWidth: 420,
                color: INK,
                fontSize: { xs: '2rem', sm: '2.65rem' },
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: 0,
              }}
            >
              Good to have you back.
            </Typography>
            <Typography
              sx={{
                mt: 1.35,
                maxWidth: 410,
                color: MUTED,
                fontSize: '0.94rem',
                lineHeight: 1.65,
              }}
            >
              Your orders, pickups, and delivery updates are right where you left them.
            </Typography>
          </Box>

          <PhoneForm />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mt: 3, pt: 2.2, borderTop: '1px solid #E5E1DB' }}
          >
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <FiShield size={14} color={PURPLE} />
              <Typography sx={{ color: MUTED, fontSize: '0.71rem' }}>
                Secure sign-in
              </Typography>
            </Stack>
            <Typography sx={{ color: INK, fontSize: '0.71rem', fontWeight: 750 }}>
              PunjabShip Logistics
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Box
        component="aside"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        sx={{
          position: 'relative',
          minHeight: { xs: 590, lg: '100vh' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#FFFFFF',
          px: { xs: 2.5, sm: 6, lg: 5.5, xl: 8 },
          py: { xs: 4, lg: 5.5 },
          backgroundImage: 'url("/images/login.jpg")',
          backgroundPosition: 'center 60%',
          backgroundSize: 'cover',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(18,16,22,0.66)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 590 }}>
          <Typography
            sx={{
              color: '#DFFF1F',
              fontSize: '0.67rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            The work behind every happy delivery
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 1.1,
              maxWidth: 570,
              color: '#FFFFFF',
              fontSize: { xs: '1.75rem', lg: '2.25rem', xl: '2.75rem' },
              lineHeight: 1.08,
              fontWeight: 650,
              letterSpacing: 0,
            }}
          >
            Less time chasing shipments. More time growing what you started.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2, width: '100%', mt: 'auto' }}>
          <Box
            sx={{
              overflow: 'hidden',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.38)',
              borderRadius: 1,
              backgroundColor: '#FFFDF7',
              boxShadow: '0 24px 65px rgba(0,0,0,0.32)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: `${stories.length * 100}%`,
                transform: `translateX(-${(activeStory * 100) / stories.length}%)`,
                transition: 'transform 760ms cubic-bezier(0.22, 1, 0.36, 1)',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              {stories.map((story, index) => (
                <Box
                  component="article"
                  key={story.title}
                  aria-hidden={activeStory !== index}
                  sx={{
                    width: `${100 / stories.length}%`,
                    flex: '0 0 auto',
                    minHeight: { xs: 315, sm: 275 },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1.18fr) minmax(190px, 0.82fr)' },
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    p: { xs: 2.4, sm: 3.2, xl: 3.8 },
                    color: INK,
                  }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: story.color,
                        }}
                      />
                      <Typography
                        sx={{
                          color: story.color,
                          fontSize: '0.64rem',
                          fontWeight: 850,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {story.kicker}
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        mt: 1.1,
                        maxWidth: 350,
                        fontSize: { xs: '1.3rem', sm: '1.55rem' },
                        lineHeight: 1.12,
                        fontWeight: 700,
                      }}
                    >
                      {story.title}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1,
                        maxWidth: 340,
                        color: MUTED,
                        fontSize: '0.8rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {story.copy}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      minHeight: 165,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 1,
                      backgroundColor: story.soft,
                    }}
                  >
                    {sceneVisuals[index]}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1.6 }}
          >
            <Stack direction="row" spacing={0.8}>
              {stories.map((story, index) => (
                <Box
                  key={story.title}
                  component="button"
                  type="button"
                  onClick={() => setActiveStory(index)}
                  aria-label={`Show ${story.kicker}`}
                  sx={{
                    width: index === activeStory ? 30 : 8,
                    height: 8,
                    p: 0,
                    border: 0,
                    borderRadius: 4,
                    cursor: 'pointer',
                    backgroundColor: index === activeStory ? '#DFFF1F' : 'rgba(255,255,255,0.42)',
                    transition: 'width 280ms ease, background-color 280ms ease',
                  }}
                />
              ))}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.65}>
              <FiClock size={13} color="rgba(255,255,255,0.7)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.66rem' }}>
                Moving with your day
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
