import { Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { FiGlobe, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import PageHeading from '../../components/UI/heading/PageHeading'

const address = 'SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104'

export default function CompanyDetails() {
  return (
    <Stack mt={2} gap={4}>
      <PageHeading title="Contact PunjabShip" subtitle="Get in touch for shipping assistance, account support, and logistics enquiries." />
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box component="img" src="/logo/punjabship-logo.png" alt="PunjabShip - Ship the world" sx={{ width: 240, maxWidth: '100%', height: 80, objectFit: 'contain', objectPosition: 'left' }} />
          <Stack direction="row" spacing={2} alignItems="flex-start"><FiMapPin size={24} /><Typography>{address}</Typography></Stack>
          <Stack direction="row" spacing={2} alignItems="center"><FiMail size={22} /><Link href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</Link></Stack>
          <Stack direction="row" spacing={2} alignItems="center"><FiPhone size={22} /><Link href="tel:+918487881121">+91 84878 81121</Link></Stack>
          <Stack direction="row" spacing={2} alignItems="center"><FiGlobe size={22} /><Link href="https://punjabship.onrender.com" target="_blank" rel="noreferrer">PunjabShip website</Link></Stack>
          <Button component="a" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" variant="outlined" startIcon={<FiMapPin />} sx={{ alignSelf: 'flex-start' }}>Find us on Google Maps</Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
