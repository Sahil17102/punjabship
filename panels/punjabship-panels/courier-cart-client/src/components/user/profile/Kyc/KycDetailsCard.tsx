import type { JSX } from '@emotion/react/jsx-runtime'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import moment from 'moment'
import {
  MdAccountBalance,
  MdBadge,
  MdBusiness,
  MdDescription,
  MdEdit,
  MdErrorOutline,
  MdGavel,
  MdImage,
  MdPreview,
  MdVerifiedUser,
} from 'react-icons/md'
import { usePresignedDownloadUrls } from '../../../../hooks/Uploads/usePresignedDownloadUrls'
import type { CompanyType } from '../../../../types/generic.types'
import type { KycDetails } from '../../../../types/user.types'
import { requiredKycDetails } from '../../../../utils/constants'
import { getMimeType } from '../../../../utils/functions'
import { BRAND_GRADIENT } from '../UserProfileForm'
import type { AdditionalKYCForm } from './AdditionalInfoStep'

const iconMap: Record<string, JSX.Element> = {
  gstin: <MdBadge />,
  panNumber: <MdBadge />,
  panCardUrl: <MdBadge />,
  aadhaarUrl: <MdVerifiedUser />,
  cancelledChequeUrl: <MdAccountBalance />,
  partnershipDeedUrl: <MdGavel />,
  boardResolutionUrl: <MdDescription />,
  cin: <MdBusiness />,
}

const getLabel = (key: string) => {
  const map: Record<string, string> = {
    gstin: 'GST Number',
    panNumber: 'PAN Number',
    panCardUrl: 'PAN Card',
    aadhaarUrl: 'Aadhaar Card',
    businessPanUrl: 'Business PAN',
    llpAgreementUrl: 'LLP Agreement',
    gstCertificateUrl: 'GST Certificate',
    companyAddressProofUrl: 'Company Address Proof',
    cancelledChequeUrl: 'Cancelled Cheque',
    partnershipDeedUrl: 'Partnership Deed',
    boardResolutionUrl: 'Board Resolution',
    structure: 'Business Structure',
    cin: 'CIN',
    createdAt: 'Submitted On',
    updatedAt: 'Last Updated',
  }
  return map[key] || key
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatus = (kyc: any, key: string) => kyc?.[`${key.replace('Url', '')}Status`] as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRejection = (kyc: any, key: string) =>
  kyc?.[`${key.replace('Url', '')}RejectionReason`] as string

const StatusChip = ({ status }: { status?: string }) => {
  const config = {
    verified: { bg: '#3DD598', color: '#FFFFFF', label: 'VERIFIED' },
    rejected: { bg: '#E74C3C', color: '#FFFFFF', label: 'REJECTED' },
    verification_in_progress: { bg: '#FFA726', color: '#FFFFFF', label: 'IN PROGRESS' },
    pending: { bg: '#4A5568', color: '#FFFFFF', label: 'PENDING' },
  }

  const style = status ? config[status as keyof typeof config] : null

  return status && style ? (
    <Chip
      size="small"
      label={style.label}
      sx={{
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.color,
        fontSize: '0.7rem',
        letterSpacing: 0.5,
        boxShadow: `0 2px 8px ${style.bg}40`,
      }}
    />
  ) : null
}

const PreviewBlock = ({
  labelKey,
  url,
  loading,
  kyc,
}: {
  labelKey: string
  url?: string | null
  loading?: boolean
  kyc?: KycDetails
}) => {
  const label = getLabel(labelKey)
  const icon = iconMap[labelKey] || <MdImage />
  const status = getStatus(kyc, labelKey)
  const rejectionReason = getRejection(kyc, labelKey)
  const mimeType = url ? getMimeType(url) : ''
  const isPdf = mimeType.includes('pdf')

  if (loading) {
    return (
      <Grid size={{ md: 4, xs: 12 }}>
        <Typography variant="body2" color="text.secondary">
          {icon} {label}
        </Typography>
        <Skeleton variant="rounded" width={140} height={140} sx={{ mt: 1 }} />
      </Grid>
    )
  }

  if (!url) return null

  return (
    <Grid size={{ md: 4, sm: 12 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ color: '#0877C9', display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="subtitle2" fontWeight={700} color="#1A1A1A">
            {label}
          </Typography>
        </Box>
        <StatusChip status={status} />
      </Box>

      <Box
        sx={{
          mt: 1,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid #E0E6ED',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(51, 51, 105, 0.12)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {isPdf ? (
          <Box
            component="img"
            src="/logo/pdf.png"
            alt={label}
            sx={{
              width: '60%',
              height: 190,
              borderRadius: 2,
              objectFit: 'contain',
              border: '1px solid #ccc',
              boxShadow: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          />
        ) : (
          <Box
            component="img"
            src={url}
            alt={label}
            sx={{
              width: '100%',
              maxHeight: 220,
              borderRadius: 2,
              objectFit: 'cover',
              border: '1px solid #E0E6ED',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          />
        )}

        <Stack direction="row" spacing={1} mt={1} alignItems="center">
          <Button
            href={url}
            target="_blank"
            rel="noopener"
            variant="contained"
            size="small"
            startIcon={<MdPreview />}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 0.8,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(51, 51, 105, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {isPdf ? 'Open PDF' : 'Preview'}
          </Button>

          {status === 'rejected' && rejectionReason && (
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#E74C3C',
                fontWeight: 600,
                bgcolor: 'rgba(231, 76, 60, 0.1)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              <MdErrorOutline size={16} /> <em>{rejectionReason}</em>
            </Typography>
          )}
        </Stack>
      </Box>
    </Grid>
  )
}

const LabelValue = ({
  labelKey,
  value,
  loading = false,
}: {
  labelKey: string
  value?: string | null
  loading?: boolean
}) => {
  const label = getLabel(labelKey)
  const icon = iconMap[labelKey] || <MdDescription />

  return (
    <Grid size={{ md: 6, xs: 12 }}>
      <Typography
        variant="body2"
        color="#4A5568"
        fontWeight={600}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
      >
        {icon} {label}
      </Typography>
      {loading ? (
        <Skeleton width="70%" sx={{ bgcolor: '#F5F7FA' }} />
      ) : (
        <Typography variant="body1" fontWeight={600} color="#1A1A1A">
          {value || '-'}
        </Typography>
      )}
    </Grid>
  )
}

const KycDetailsCard = ({
  onEdit,
  kyc,
  isLoading = false,
}: {
  onEdit?: () => void
  kyc: KycDetails
  isLoading?: boolean
}) => {
  const structure = kyc?.structure ?? 'company'
  const companyType = kyc?.companyType
  const config = requiredKycDetails[structure]
  const configuredFields =
    structure === 'company' && typeof config === 'object' && !Array.isArray(config)
      ? config[companyType as CompanyType] ?? []
      : Array.isArray(config)
      ? config
      : []
  const optionalFieldsToShow: (keyof AdditionalKYCForm)[] =
    structure === 'individual' && kyc?.gstin ? ['gstin'] : []
  const allFields = [
    ...configuredFields,
    ...optionalFieldsToShow.filter((field) => !configuredFields.includes(field)),
  ]
  const isFileField = (f: keyof AdditionalKYCForm) =>
    [
      'aadhaarUrl',
      'panCardUrl',
      'partnershipDeedUrl',
      'boardResolutionUrl',
      'llpAgreementUrl',
      'companyAddressProofUrl',
      'cancelledChequeUrl',
      'businessPanUrl',
      'gstCertificateUrl',
    ].includes(f)

  const fileFieldsToShow = allFields.filter(isFileField)
  const textFieldsToShow = allFields.filter(
    (f: keyof AdditionalKYCForm) => !isFileField(f) && f !== 'cin',
  )

  const keys = fileFieldsToShow
    .map((f: keyof AdditionalKYCForm) => kyc?.[f as keyof typeof kyc])
    .filter(Boolean) as string[]

  const { data: presignedUrls } = usePresignedDownloadUrls({
    keys,
    enabled: keys.length > 0,
  })

  const loading = isLoading || !kyc

  const urlMap: Record<string, string> = {}
  const mimeMap: Record<string, string> = {}

  if (presignedUrls && Array.isArray(presignedUrls)) {
    let index = 0
    for (const key of fileFieldsToShow) {
      if (kyc?.[key]) {
        const signedUrl = presignedUrls[index]
        if (signedUrl) {
          urlMap[key] = signedUrl
          const mimeKey = `${key.replace('Url', '')}Mime` as keyof KycDetails
          mimeMap[key] = (kyc[mimeKey] as string) || ''
        }
        index++
      }
    }
  }

  return (
    <Card
      sx={{
        mt: 4,
        px: 3,
        py: 3,
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        border: '1px solid #E0E6ED',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: BRAND_GRADIENT,
          borderRadius: '12px 12px 0 0',
        },
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight={700} color="#0877C9">
              {loading ? <Skeleton width={120} /> : 'KYC Details'}
            </Typography>
            {!loading && (
              <Button variant="contained" size="small" startIcon={<MdEdit />} onClick={onEdit}>
                Edit
              </Button>
            )}
          </Box>
          <StatusChip status={kyc?.status} />
        </Box>

        <Divider sx={{ mb: 3, borderColor: '#E0E6ED' }} />

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mb: 2.5,
            color: '#0877C9',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&::before': {
              content: '""',
              width: 4,
              height: 24,
              bgcolor: '#3DD598',
              borderRadius: 1,
            },
          }}
        >
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <LabelValue labelKey="structure" value={structure} loading={loading} />
          {allFields.includes('cin') && (
            <LabelValue labelKey="cin" value={kyc?.cin} loading={loading} />
          )}
        </Grid>

        {fileFieldsToShow.length > 0 && (
          <>
            <Divider sx={{ my: 4, borderColor: '#E0E6ED' }} />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                mb: 2.5,
                color: '#0877C9',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 24,
                  bgcolor: '#3DD598',
                  borderRadius: 1,
                },
              }}
            >
              Uploaded Documents
            </Typography>
            <Grid container spacing={3}>
              {fileFieldsToShow.map((field: string) => (
                <PreviewBlock
                  key={field}
                  labelKey={field}
                  url={urlMap[field]}
                  loading={loading}
                  kyc={kyc}
                />
              ))}
            </Grid>
          </>
        )}

        {textFieldsToShow.length > 0 && (
          <>
            <Divider sx={{ my: 4, borderColor: '#E0E6ED' }} />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                mb: 2.5,
                color: '#0877C9',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 24,
                  bgcolor: '#3DD598',
                  borderRadius: 1,
                },
              }}
            >
              Other Details
            </Typography>
            <Grid container spacing={3}>
              {textFieldsToShow.map((field: string) => (
                <LabelValue
                  key={field}
                  labelKey={field}
                  value={kyc?.[field as keyof KycDetails] as string}
                  loading={loading}
                />
              ))}
            </Grid>
          </>
        )}

        <Divider sx={{ my: 4, borderColor: '#E0E6ED' }} />
        <Grid container spacing={3}>
          <LabelValue
            labelKey="createdAt"
            value={kyc?.createdAt ? moment(kyc.createdAt).format('DD MMM YYYY, hh:mm A') : ''}
            loading={loading}
          />
          <LabelValue
            labelKey="updatedAt"
            value={kyc?.updatedAt ? moment(kyc.updatedAt).format('DD MMM YYYY, hh:mm A') : ''}
            loading={loading}
          />
        </Grid>
      </CardContent>
    </Card>
  )
}

export default KycDetailsCard
