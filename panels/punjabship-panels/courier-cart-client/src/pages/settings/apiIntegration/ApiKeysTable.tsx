import { Chip, IconButton, Stack, Typography } from '@mui/material'
import { MdDelete, MdPowerSettingsNew } from 'react-icons/md'
import type { ApiKey } from '../../../api/apiIntegration'
import DataTable, { type Column } from '../../../components/UI/table/DataTable'

interface ApiKeysTableProps {
  apiKeys: ApiKey[]
  isLoading: boolean
  onUpdate: (id: string, data: { is_active?: boolean }) => void
  onDelete: (id: string) => void
}

export const ApiKeysTable = ({ apiKeys, isLoading, onUpdate, onDelete }: ApiKeysTableProps) => {
  const columns: Column<ApiKey>[] = [
    {
      id: 'key_name',
      label: 'Name',
      minWidth: 200,
    },
    {
      id: 'is_active',
      label: 'Status',
      align: 'center',
      minWidth: 100,
      render: (value) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'last_used_at',
      label: 'Last Used',
      minWidth: 150,
      render: (value) =>
        value ? (
          new Date(value).toLocaleDateString()
        ) : (
          <Typography color="text.secondary">Never</Typography>
        ),
    },
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 150,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      minWidth: 120,
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <IconButton
            size="small"
            onClick={() => onUpdate(row.id, { is_active: !row.is_active })}
            color={row.is_active ? 'success' : 'default'}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            <MdPowerSettingsNew size={18} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(row.id)}>
            <MdDelete size={18} />
          </IconButton>
        </Stack>
      ),
    },
  ]

  if (isLoading) {
    return <Typography>Loading...</Typography>
  }

  return <DataTable rows={apiKeys} columns={columns} maxHeight={600} pagination={false} />
}
