// components/support/SupportTicketTable.tsx

import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import type { SupportTicket } from '../../api/support.api'
import StatusChip from '../UI/chip/StatusChip'
import DataTable, { type Column } from '../UI/table/DataTable'
import { supportCategories } from './SupportTicketForm'

const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  open: 'info',
  in_progress: 'pending',
  resolved: 'success',
  closed: 'error',
}

// Helper function to get category and subcategory labels
const getCategoryLabel = (categoryKey: string, subcategoryKey: string): string => {
  const category = supportCategories.find((c) => c.key === categoryKey)
  if (!category) return `${categoryKey} > ${subcategoryKey}`

  const subcategory = category.subcategories.find((s) => s.key === subcategoryKey)
  if (!subcategory) return `${category.label} > ${subcategoryKey}`

  return `${category.label} > ${subcategory.label}`
}

interface Props {
  rows: SupportTicket[]
  currentPage: number
  rowsPerPage: number
  totalCount: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}

const SupportTicketList: React.FC<Props> = ({
  rows,
  currentPage,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const navigate = useNavigate()
  const columns: Column<SupportTicket>[] = [
    {
      label: 'Subject',
      id: 'subject',
    },
    {
      label: 'Category',
      id: 'category',
      render: (_, row) => getCategoryLabel(row?.category || '', row?.subcategory || ''),
    },
    {
      label: 'AWB No.',
      id: 'awbNumber',
    },
    {
      label: 'Status',
      id: 'status',
      render: (value) => <StatusChip label={value} status={statusColorMap[value]} />,
    },
    {
      label: 'Created At',
      id: 'createdAt',
      render: (value) => moment(value?.createdAt).format('DD MMM YYYY'),
    },
    {
      label: 'Due Date',
      id: 'dueDate',
      render: (value) => (value ? moment(value).format('DD MMM YYYY') : '—'),
    },
  ]

  return (
    <DataTable<SupportTicket>
      rows={rows}
      columns={columns}
      title="My Support Tickets"
      subTitle="All tickets raised by you"
      pagination
      currentPage={currentPage}
      defaultRowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onRowClick={(row) => navigate(`/support/tickets/${row.id}`)}
    />
  )
}

export default SupportTicketList
