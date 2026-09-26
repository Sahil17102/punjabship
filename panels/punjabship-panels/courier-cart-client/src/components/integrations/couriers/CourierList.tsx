// src/components/CourierList.tsx
import { Chip, Stack, Typography } from '@mui/material'
import moment from 'moment'
import { type FC } from 'react'
import type { Courier } from '../../../api/courier'
import DataTable, { type Column } from '../../UI/table/DataTable'
import TableSkeleton from '../../UI/table/TableSkeleton'

interface CourierListProps {
  couriers: Courier[]
  totalCount: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (limit: number) => void
  loading?: boolean
}

const CourierList: FC<CourierListProps> = ({
  couriers,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
}) => {
  const columns: Column<Courier>[] = [
    {
      id: 'name',
      label: 'Courier Name',
      minWidth: 150,
      render: (_, row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={600}>{row.name}</Typography>
          {row.isHyperlocal && <Chip label="Hyperlocal" size="small" color="secondary" />}
        </Stack>
      ),
    },
    {
      id: 'masterCompany',
      label: 'Master Company',
      minWidth: 180,
      render: (val) => <Typography variant="body2">{val ?? '-'}</Typography>,
    },
    {
      id: 'podAvailable',
      label: 'POD Available',
      minWidth: 120,
      render: (val) => val ?? '-',
    },
    {
      id: 'activatedDate',
      label: 'Established On',
      minWidth: 140,
      render: (val) => (val ? moment(val).format('DD MMM YYYY') : '-'),
    },
  ]

  if (loading) return <TableSkeleton />

  return (
    <DataTable<Courier>
      rows={couriers}
      columns={columns}
      title="Courier Partners"
      subTitle="List of available couriers from integrated service providers"
      pagination
      currentPage={page}
      defaultRowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  )
}

export default CourierList
