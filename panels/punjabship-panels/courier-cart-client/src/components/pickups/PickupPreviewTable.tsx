/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { SiTicktick } from 'react-icons/si'

export interface PreviewProps {
  rows: any[]
  errors: Record<number, string>
  onCellChange: (idx: number, field: string, value: string) => void
}

// Styled component for CSV-like look
const CsvTableCell = styled(TableCell)(() => ({
  border: '1px solid #ccc',
  padding: '6px 8px',
  fontFamily: 'monospace',
  fontSize: '13px',
  whiteSpace: 'nowrap',
}))

const PickupPreviewTable = ({ rows, errors, onCellChange }: PreviewProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        overflowX: 'auto',
        border: '1px solid #ccc',
        borderRadius: 1,
        mt: 2,
      }}
    >
      <Table
        size="small"
        sx={{
          minWidth: 3600, // widened because we now include RTO
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <TableHead>
          <TableRow>
            <CsvTableCell>#</CsvTableCell>
            <CsvTableCell>Nickname</CsvTableCell>
            <CsvTableCell>Address Line 1</CsvTableCell>
            <CsvTableCell>Address Line 2</CsvTableCell>
            <CsvTableCell>Landmark</CsvTableCell>
            <CsvTableCell>City</CsvTableCell>
            <CsvTableCell>Pincode</CsvTableCell>
            <CsvTableCell>State</CsvTableCell>
            <CsvTableCell>POC Name</CsvTableCell>
            <CsvTableCell>POC Phone</CsvTableCell>
            <CsvTableCell>POC Email</CsvTableCell>

            {/* 🔹 RTO Columns */}
            <CsvTableCell>RTO Name</CsvTableCell>
            <CsvTableCell>RTO Phone</CsvTableCell>
            <CsvTableCell>RTO Email</CsvTableCell>
            <CsvTableCell>RTO Address Line 1</CsvTableCell>
            <CsvTableCell>RTO Address Line 2</CsvTableCell>
            <CsvTableCell>RTO Landmark</CsvTableCell>
            <CsvTableCell>RTO City</CsvTableCell>
            <CsvTableCell>RTO Pincode</CsvTableCell>
            <CsvTableCell>RTO State</CsvTableCell>

            <CsvTableCell>Error Status</CsvTableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r, i) => {
            const hasError = !!errors[i]
            return (
              <TableRow
                key={i}
                sx={{
                  backgroundColor: hasError
                    ? '#9e0005'
                    : i % 2 === 0
                    ? 'rgb(108,89,137,0.2)'
                    : 'rgb(108,89,137,0.3)',
                }}
              >
                <CsvTableCell>{i + 1}</CsvTableCell>

                {/* Pickup fields */}
                {[
                  ['addressNickname', r.addressNickname],
                  ['addressLine1', r.addressLine1],
                  ['addressLine2', r.addressLine2],
                  ['landmark', r.landmark],
                  ['city', r.city],
                  ['pincode', r.pincode],
                  ['state', r.state],
                  ['contactName', r.contactName],
                  ['contactPhone', r.contactPhone],
                  ['contactEmail', r.contactEmail],
                ].map(([field, value]) => (
                  <CsvTableCell key={field}>
                    <TextField
                      variant="standard"
                      value={value ?? ''}
                      onChange={(e) => onCellChange(i, field, e.target.value)}
                      fullWidth
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontFamily: 'monospace',
                          fontSize: '13px',
                        },
                      }}
                    />
                  </CsvTableCell>
                ))}

                {/* RTO fields */}
                {[
                  ['rtoContactName', r.rtoContactName],
                  ['rtoContactPhone', r.rtoContactPhone],
                  ['rtoContactEmail', r.rtoContactEmail],
                  ['rtoAddressLine1', r.rtoAddressLine1],
                  ['rtoAddressLine2', r.rtoAddressLine2],
                  ['rtoLandmark', r.rtoLandmark],
                  ['rtoCity', r.rtoCity],
                  ['rtoPincode', r.rtoPincode],
                  ['rtoState', r.rtoState],
                ].map(([field, value]) => (
                  <CsvTableCell key={field}>
                    <TextField
                      variant="standard"
                      value={value ?? ''}
                      onChange={(e) => onCellChange(i, field, e.target.value)}
                      fullWidth
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          fontFamily: 'monospace',
                          fontSize: '13px',
                        },
                      }}
                    />
                  </CsvTableCell>
                ))}

                {/* Error column */}
                <CsvTableCell sx={{ color: 'red' }}>
                  {hasError ? (
                    <Tooltip title={errors[i]}>
                      <Typography variant="caption" sx={{ fontSize: 12, color: 'white' }}>
                        {errors[i]}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" sx={{ fontSize: 12, color: 'success.main' }}>
                      <SiTicktick />
                    </Typography>
                  )}
                </CsvTableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Paper>
  )
}

export default PickupPreviewTable
