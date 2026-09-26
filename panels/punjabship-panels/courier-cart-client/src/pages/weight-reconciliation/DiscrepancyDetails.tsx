import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import AWBLink from '../../components/UI/AWBLink'
import { FiArrowLeft, FiCheckCircle, FiDownload, FiMessageSquare, FiXCircle } from 'react-icons/fi'
import { RiScales3Line } from 'react-icons/ri'
import { useNavigate, useParams } from 'react-router-dom'
import FileUploader, { type UploadedFileInfo } from '../../components/UI/uploader/FileUploader'
import {
  useAcceptDiscrepancy,
  useCreateDispute,
  useDiscrepancyDetails,
  useRejectDiscrepancy,
} from '../../hooks/useWeightReconciliation'

export default function DiscrepancyDetails() {
  const BRAND_PURPLE = '#0877C9'
  const BRAND_ORANGE = '#B8D719'
  const shellCardSx = {
    borderRadius: 5,
    border: `1px solid ${alpha(BRAND_PURPLE, 0.12)}`,
    boxShadow: '0 18px 38px rgba(20, 20, 20, 0.08)',
    background: '#FFFFFF',
  }

  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    comment: '',
    evidenceUrls: [] as string[],
    proposedWeight: '',
  })

  const { data, isLoading, refetch } = useDiscrepancyDetails(id!)
  const acceptMutation = useAcceptDiscrepancy()
  const rejectMutation = useRejectDiscrepancy()
  const createDisputeMutation = useCreateDispute()

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Discrepancy not found</Alert>
      </Container>
    )
  }

  const { discrepancy, dispute, history } = data
  // Convert grams to kg for display
  const weightDiff = Number(discrepancy.weight_difference) / 1000
  const additionalCharge = Number(discrepancy.additional_charge)

  const handleAccept = () => {
    if (confirm('Are you sure you want to accept this weight discrepancy and charges?')) {
      acceptMutation.mutate(
        { id: discrepancy.id },
        {
          onSuccess: () => refetch(),
        },
      )
    }
  }

  const handleReject = () => {
    const reason = prompt('Please enter a reason for rejection:')
    if (!reason) return

    rejectMutation.mutate(
      { id: discrepancy.id, reason },
      {
        onSuccess: () => refetch(),
      },
    )
  }

  const handleDisputeSubmit = () => {
    if (!disputeForm.reason) {
      alert('Please select a dispute reason')
      return
    }

    createDisputeMutation.mutate(
      {
        discrepancyId: discrepancy.id,
        disputeReason: disputeForm.reason,
        customerComment: disputeForm.comment,
        evidenceUrls: disputeForm.evidenceUrls,
        // Convert KG input to grams for storage
        customerClaimedWeight: disputeForm.proposedWeight
          ? Number(disputeForm.proposedWeight) * 1000
          : undefined,
      },
      {
        onSuccess: () => {
          setShowDisputeForm(false)
          setDisputeForm({ reason: '', comment: '', evidenceUrls: [], proposedWeight: '' })
          refetch()
        },
      },
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'accepted':
        return 'success'
      case 'disputed':
        return 'info'
      case 'resolved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3.2 },
            borderRadius: 5,
            border: `1px solid ${alpha(BRAND_PURPLE, 0.12)}`,
            background:
              'radial-gradient(circle at top right, rgba(8,119,201,0.14) 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,247,250,0.98) 100%)',
            boxShadow: '0 18px 38px rgba(20, 20, 20, 0.08)',
          }}
        >
          <Button
            startIcon={<FiArrowLeft />}
            onClick={() => navigate('/reconciliation/weight')}
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              mb: 2,
              '&:hover': { color: '#0877C9' },
            }}
          >
            Back to Discrepancies
          </Button>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#17171A',
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <RiScales3Line size={28} color={BRAND_PURPLE} />
                Weight Discrepancy Details
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
                Order #{discrepancy.order_number}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.2} mt={2}>
                {[
                  `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(3)} kg difference`,
                  `₹${additionalCharge.toFixed(2)} billing impact`,
                  `${discrepancy.courier_partner || 'Courier'} review`,
                ].map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    sx={{
                      alignSelf: 'flex-start',
                      bgcolor: alpha(BRAND_ORANGE, 0.1),
                      color: BRAND_ORANGE,
                      borderRadius: '999px',
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Stack direction="row" gap={2}>
              {discrepancy.status === 'pending' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<FiXCircle />}
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                    sx={{
                      borderColor: '#E74C3C',
                      color: '#E74C3C',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#C0392B',
                        backgroundColor: 'rgba(231, 76, 60, 0.08)',
                      },
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FiCheckCircle />}
                    onClick={handleAccept}
                    disabled={acceptMutation.isPending}
                    sx={{
                      bgcolor: '#27AE60',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#229954' },
                    }}
                  >
                    Accept
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Status Card */}
        <Card sx={shellCardSx}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Status
                </Typography>
                <Chip
                  label={
                    discrepancy.status === 'resolved'
                      ? discrepancy.has_dispute &&
                        discrepancy.resolution_notes?.includes('rejected')
                        ? 'RESOLVED (DISPUTE REJECTED)'
                        : discrepancy.has_dispute &&
                          discrepancy.resolution_notes?.includes('approved')
                        ? 'RESOLVED (DISPUTE APPROVED)'
                        : 'RESOLVED'
                      : discrepancy.status.toUpperCase()
                  }
                  color={
                    getStatusColor(discrepancy.status) as
                      | 'default'
                      | 'primary'
                      | 'secondary'
                      | 'error'
                      | 'info'
                      | 'success'
                      | 'warning'
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Order Number
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#0877C9' }}>
                  {discrepancy.order_number}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  AWB Number
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#0877C9' }}>
                  {discrepancy.awb_number ? <AWBLink awb={discrepancy.awb_number} /> : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Courier
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#0877C9' }}>
                  {discrepancy.courier_partner || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Weight Comparison */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 3 }}>
              Weight Comparison
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Declared Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9' }}>
                  {(Number(discrepancy.declared_weight) / 1000).toFixed(3)} kg
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Actual Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9' }}>
                  {discrepancy.actual_weight
                    ? `${(Number(discrepancy.actual_weight) / 1000).toFixed(3)} kg`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Volumetric Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9' }}>
                  {discrepancy.volumetric_weight
                    ? `${(Number(discrepancy.volumetric_weight) / 1000).toFixed(3)} kg`
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Charged Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3498DB' }}>
                  {(Number(discrepancy.charged_weight) / 1000).toFixed(3)} kg
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Weight Difference
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: weightDiff > 0 ? '#E74C3C' : '#27AE60',
                  }}
                >
                  {weightDiff > 0 ? '+' : ''}
                  {weightDiff.toFixed(3)} kg
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  Additional Charge
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: additionalCharge > 0 ? '#E74C3C' : '#27AE60',
                  }}
                >
                  ₹{additionalCharge.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Dimensions Comparison (if available) */}
        {(discrepancy.declared_dimensions || discrepancy.actual_dimensions) && (
          <Card sx={shellCardSx}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 3 }}>
                Dimensions (cm)
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={4}>
                {discrepancy.declared_dimensions && (
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                      Declared
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {discrepancy.declared_dimensions.length} ×{' '}
                      {discrepancy.declared_dimensions.breadth} ×{' '}
                      {discrepancy.declared_dimensions.height}
                    </Typography>
                  </Box>
                )}
                {discrepancy.actual_dimensions && (
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                      Actual (Measured)
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: '#3498DB' }}>
                      {discrepancy.actual_dimensions.length} ×{' '}
                      {discrepancy.actual_dimensions.breadth} ×{' '}
                      {discrepancy.actual_dimensions.height}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Billing Impact */}
        {(discrepancy.original_shipping_charge || discrepancy.revised_shipping_charge) && (
          <Card sx={shellCardSx}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 3 }}>
                Billing Impact
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Original Charge
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ₹{Number(discrepancy.original_shipping_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Revised Charge
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#3498DB' }}>
                    ₹{Number(discrepancy.revised_shipping_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                    Difference
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: additionalCharge > 0 ? '#E74C3C' : '#27AE60',
                    }}
                  >
                    {additionalCharge > 0 ? '+' : ''}₹{additionalCharge.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Resolution Alert (if disputed and resolved) */}
        {discrepancy.status === 'resolved' && discrepancy.has_dispute && dispute && (
          <Alert
            severity={dispute.status === 'approved' ? 'success' : 'warning'}
            sx={{ ...shellCardSx, alignItems: 'flex-start' }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {dispute.status === 'approved'
                ? '✅ Your dispute was approved'
                : '⚠️ Your dispute was rejected'}
            </Typography>
            {dispute.admin_response && (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>
                  Admin Response:
                </Typography>
                <Typography variant="body2">{dispute.admin_response}</Typography>
              </>
            )}
            {discrepancy.resolution_notes && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#6B7280' }}>
                {discrepancy.resolution_notes}
              </Typography>
            )}
          </Alert>
        )}

        {/* Courier Remarks */}
        {discrepancy.courier_remarks && (
          <Card sx={shellCardSx}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 2 }}>
                Courier Remarks
              </Typography>
              <Typography sx={{ color: '#6B7280' }}>{discrepancy.courier_remarks}</Typography>
              {discrepancy.courier_weight_slip_url && (
                <Button
                  startIcon={<FiDownload />}
                  href={discrepancy.courier_weight_slip_url}
                  target="_blank"
                  sx={{ mt: 2, textTransform: 'none' }}
                >
                  Download Weight Slip
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dispute Section */}
        {!dispute && discrepancy.status === 'pending' && (
          <Card sx={shellCardSx}>
            <CardContent>
              {!showDisputeForm ? (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 1 }}>
                      Disagree with this discrepancy?
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      You can raise a dispute with supporting evidence
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<FiMessageSquare />}
                    onClick={() => setShowDisputeForm(true)}
                    sx={{
                      borderColor: '#0877C9',
                      color: '#0877C9',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#2F3B5F',
                        backgroundColor: 'rgba(59, 74, 116, 0.08)',
                      },
                    }}
                  >
                    Raise Dispute
                  </Button>
                </Stack>
              ) : (
                <Stack gap={3}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9' }}>
                    Raise a Dispute
                  </Typography>

                  <TextField
                    select
                    fullWidth
                    label="Dispute Reason"
                    value={disputeForm.reason}
                    onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                    SelectProps={{ native: true }}
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                        borderColor: '#0877C9',
                      },
                    }}
                  >
                    <option value="">Select a reason</option>
                    <option value="Incorrect Weight">Incorrect Weight</option>
                    <option value="Incorrect Dimensions">Incorrect Dimensions</option>
                    <option value="Wrong Product">Wrong Product</option>
                    <option value="Measurement Error">Measurement Error</option>
                    <option value="Other">Other</option>
                  </TextField>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Your Comment"
                    value={disputeForm.comment}
                    onChange={(e) => setDisputeForm({ ...disputeForm, comment: e.target.value })}
                    placeholder="Explain why you're disputing this weight discrepancy..."
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                        borderColor: '#0877C9',
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Proposed Weight (kg)"
                    value={disputeForm.proposedWeight}
                    onChange={(e) =>
                      setDisputeForm({ ...disputeForm, proposedWeight: e.target.value })
                    }
                    placeholder="Enter weight in kilograms (e.g., 0.600)"
                    inputProps={{ step: 0.001, min: 0 }}
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                        borderColor: '#0877C9',
                      },
                    }}
                  />

                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                      Upload Evidence (Images, Videos, Documents)
                    </Typography>
                    <FileUploader
                      variant="dnd"
                      accept="image/*,video/*,.pdf"
                      maxSizeMb={50}
                      multiple
                      folderKey="weight-disputes"
                      onUploaded={(files: UploadedFileInfo[]) => {
                        setDisputeForm({
                          ...disputeForm,
                          evidenceUrls: files.map((f) => f.url),
                        })
                      }}
                    />
                  </Box>

                  <Stack direction="row" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => setShowDisputeForm(false)}
                      sx={{
                        borderColor: '#E2E8F0',
                        color: '#6B7280',
                        textTransform: 'none',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleDisputeSubmit}
                      disabled={createDisputeMutation.isPending}
                      sx={{
                        bgcolor: '#0877C9',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#2F3B5F' },
                      }}
                    >
                      {createDisputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* Existing Dispute */}
        {dispute && (
          <Card sx={{ ...shellCardSx, borderLeft: `4px solid ${BRAND_PURPLE}` }}>
            <CardContent>
              <Stack gap={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9' }}>
                    Dispute Details
                  </Typography>
                  <Chip label={dispute.status.toUpperCase()} color="info" />
                </Stack>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                    Reason
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{dispute.dispute_reason}</Typography>
                </Box>
                {dispute.customer_comment && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Your Comment
                    </Typography>
                    <Typography>{dispute.customer_comment}</Typography>
                  </Box>
                )}
                {dispute.customer_claimed_weight && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Proposed Weight
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {(Number(dispute.customer_claimed_weight) / 1000).toFixed(3)} kg
                    </Typography>
                  </Box>
                )}
                {dispute.admin_response && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Admin Response
                    </Typography>
                    <Alert severity="info">{dispute.admin_response}</Alert>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Activity History */}
        {history && history.length > 0 && (
          <Card sx={shellCardSx}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0877C9', mb: 3 }}>
                Activity History
              </Typography>
              <Stack gap={2}>
                {history.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      bgcolor: '#F9FAFB',
                      borderLeft: '3px solid #0877C9',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography sx={{ fontWeight: 600, color: '#0877C9' }}>
                        {item.action_type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </Typography>
                    </Stack>
                    {item.notes && (
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
