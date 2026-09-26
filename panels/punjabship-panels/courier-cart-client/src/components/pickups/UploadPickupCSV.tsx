/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alert,
  Box,
  Button,
  DialogActions,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'
import React, { useState } from 'react'
import { TbCsv } from 'react-icons/tb'
import axiosInstance from '../../api/axiosInstance'
import type { HydratedPickup } from '../../types/generic.types'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomDialog from '../UI/modal/CustomModal'
import FileUploader, { type UploadedFileInfo } from '../UI/uploader/FileUploader'
import PickupPreviewTable from './PickupPreviewTable'

interface UploadPickupCSVModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (data: HydratedPickup[]) => void
  loading?: boolean
}

const UploadPickupCSVModal: React.FC<UploadPickupCSVModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => {
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleCSVUpload = async (files: UploadedFileInfo[]) => {
    setUploadError(null)

    if (!files?.[0]?.key) {
      setUploadError('Invalid file uploaded.')
      return
    }

    try {
      const { data: presigned } = await axiosInstance.post('/uploads/presign-download-url', {
        keys: [files[0].key],
      })
      const url = presigned?.urls?.[0]
      if (!url) throw new Error('Presigned URL not received')

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch CSV file')

      const text = await res.text()
      const parsed = Papa.parse<HydratedPickup>(text, {
        header: true,
        skipEmptyLines: true,
      })

      if (parsed.errors.length > 0) {
        setUploadError(parsed.errors[0].message || 'CSV contains errors.')
        return
      }

      if (!parsed.data?.length) {
        setUploadError('CSV appears to be empty.')
        return
      }

      const cleanData = parsed.data.map((row) => ({
        ...row,
        isPrimary: row.isPrimary?.toString() === 'true' || row.isPrimary === true,
        isPickupEnabled: row.isPickupEnabled?.toString() === 'true' || row.isPickupEnabled === true,
      }))

      setData(cleanData)
      setErrors({})
    } catch (err: any) {
      console.error('Error parsing CSV', err)
      setUploadError(err?.message || 'Something went wrong while parsing the CSV file.')
    }
  }

  const handleCellChange = (idx: number, field: string, value: string) => {
    const copy = [...data]
    ;(copy[idx] as any)[field] = value
    setData(copy)
    const newErrs = { ...errors }
    delete newErrs[idx]
    setErrors(newErrs)
  }

  const validateRows = () => {
    const newErrors: Record<number, string> = {}

    data.forEach((r, i) => {
      const idxLabel = `Row ${i + 1}`

      // ✅ Pickup validation (always required)
      if (!r.contactName) newErrors[i] = `${idxLabel}: pickup contact name missing`
      else if (!r.contactPhone) newErrors[i] = `${idxLabel}: pickup phone missing`
      else if (!r.addressLine1) newErrors[i] = `${idxLabel}: pickup address missing`
      else if (!r.city) newErrors[i] = `${idxLabel}: pickup city missing`
      else if (!r.state) newErrors[i] = `${idxLabel}: pickup state missing`
      else if (!r.pincode || isNaN(+r.pincode)) newErrors[i] = `${idxLabel}: pickup pincode invalid`

      // ✅ RTO validation (optional, but if one field exists → require all)
      const hasRto =
        r.rtoContactName ||
        r.rtoContactPhone ||
        r.rtoAddressLine1 ||
        r.rtoCity ||
        r.rtoState ||
        r.rtoPincode

      if (hasRto) {
        if (!r.rtoContactName) newErrors[i] = `${idxLabel}: RTO contact name missing`
        else if (!r.rtoContactPhone) newErrors[i] = `${idxLabel}: RTO phone missing`
        else if (!r.rtoAddressLine1) newErrors[i] = `${idxLabel}: RTO address missing`
        else if (!r.rtoCity) newErrors[i] = `${idxLabel}: RTO city missing`
        else if (!r.rtoState) newErrors[i] = `${idxLabel}: RTO state missing`
        else if (!r.rtoPincode || isNaN(+r.rtoPincode))
          newErrors[i] = `${idxLabel}: RTO pincode invalid`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = () => {
    if (validateRows()) {
      onConfirm(data)
      handleClose()
    }
  }

  const handleClose = () => {
    setData([])
    setErrors({})
    setUploadError(null)
    onClose()
  }

  const handleSampleDownload = () => {
    const sampleData: Partial<any>[] = [
      {
        // 🔹 Pickup fields
        contactName: 'Ramesh',
        contactPhone: '9876543210',
        addressLine1: '123 Example Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        addressNickname: 'Warehouse Mumbai',
        contactEmail: 'abcRamesh@gmail.com',
        landmark: 'Near ABC Hospital',
        addressLine2: 'Opp. XYZ Park',

        // 🔹 RTO fields (optional)
        rtoContactName: 'Returns Desk',
        rtoContactPhone: '9123456789',
        rtoAddressLine1: '456 RTO Road',
        rtoCity: 'Pune',
        rtoState: 'Maharashtra',
        rtoPincode: '411001',
      },
    ]

    const csv = Papa.unparse(sampleData, { quotes: true })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, 'sample-pickup-import.csv')
  }

  return (
    <CustomDialog
      maxWidth="md"
      open={open}
      title="📦 Upload Pickup Addresses"
      onClose={handleClose}
      footer={
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <CustomIconLoadingButton
            loadingText="Importing.."
            text={`Import ${data.length ? `(${data.length})` : ''}`}
            loading={loading}
            onClick={handleConfirm}
          />
        </DialogActions>
      }
    >
      <Stack spacing={2}>
        <Alert severity="info">
          Please download the sample file, update your required data and upload it here.
        </Alert>

        {uploadError && <Alert severity="error">{uploadError}</Alert>}

        <Grid container>
          <Grid size={{ xs: 12, md: 4 }}>
            <Tooltip title="Download a sample template to see the format">
              <Button
                onClick={handleSampleDownload}
                size="small"
                variant="outlined"
                startIcon={<TbCsv />}
                sx={{ textTransform: 'none', mt: { xs: 1, md: 0 } }}
              >
                Sample CSV
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="center">
          <FileUploader
            variant="dnd"
            accept=".csv"
            folderKey="pickupAddresses"
            onUploaded={handleCSVUpload}
            label="Pickup CSV File"
            fullWidth
            showAccept
          />
        </Box>

        {data.length > 0 && (
          <>
            <Divider />
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" mb={1}>
                Preview & Edit ({data.length} entries)
              </Typography>
              <PickupPreviewTable rows={data} errors={errors} onCellChange={handleCellChange} />
            </Paper>
          </>
        )}
      </Stack>
    </CustomDialog>
  )
}

export default UploadPickupCSVModal
