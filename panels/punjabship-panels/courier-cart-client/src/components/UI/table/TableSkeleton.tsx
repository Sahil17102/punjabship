import React from 'react'
import {
  Box,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

interface SkeletonDataTableProps {
  rowCount?: number
  colCount?: number
  title?: string
  subTitle?: string
}

const TableSkeleton: React.FC<SkeletonDataTableProps> = ({
  rowCount = 6,
  colCount = 6,
  title = 'Loading orders',
  subTitle = 'Preparing the latest rows, filters, and pagination state.',
}) => {
  const columns = Array.from({ length: colCount })
  const rows = Array.from({ length: rowCount })

  return (
    <Box
      sx={{
        borderRadius: 4,
        border: '1px solid rgba(17,17,17,0.08)',
        bgcolor: '#FFFFFF',
        boxShadow: '0 12px 28px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{
          px: 3,
          py: 1.25,
          borderBottom: '1px solid rgba(17,17,17,0.08)',
        }}
      >
        <Stack spacing={0.6}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#111111' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: '#6B7280' }}>{subTitle}</Typography>
        </Stack>

        <Skeleton
          variant="rounded"
          width={170}
          height={36}
          sx={{ borderRadius: 999, bgcolor: 'rgba(15, 23, 42, 0.08)' }}
        />
      </Stack>

      <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table stickyHeader sx={{ minWidth: { xs: colCount * 140, md: '100%' } }}>
          <TableHead>
            <TableRow>
              {columns.map((_, colIdx) => (
                <TableCell key={colIdx} sx={{ bgcolor: '#e6e6e6', py: 1.6 }}>
                  <Skeleton
                    variant="text"
                    width={90}
                    height={18}
                    sx={{ bgcolor: 'rgba(15, 23, 42, 0.08)' }}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((__, colIdx) => (
                  <TableCell
                    key={colIdx}
                    sx={{
                      py: 1.3,
                      borderBottom: '1px solid rgba(17,17,17,0.05)',
                    }}
                  >
                    <Skeleton
                      variant="text"
                      width={colIdx === 0 ? '62%' : colIdx === columns.length - 1 ? '46%' : '84%'}
                      height={16}
                      sx={{ bgcolor: 'rgba(15, 23, 42, 0.08)' }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default TableSkeleton
