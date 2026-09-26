# List Page Standardization Guide

## Overview
This guide documents the standardized layout for all list/table pages in the courier-cart-client application, based on the B2COrdersList component pattern.

## Pattern Structure

All list pages should follow this basic structure:

```tsx
import ListPageLayout from './ListPageLayout'

const MyListPage = () => {
  // State management
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Data fetching
  const { data, isLoading } = useMyData(page, rowsPerPage, filters)

  // Filter configuration
  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text' },
    // ... other filter fields
  ]

  // Controls Section (Filter Bar)
  const controls = (
    <Box sx={{ px: 2 }}>
      <FilterBar
        fields={filterFields}
        defaultValues={filters}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setPage(1)
        }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={Object.values(filters).filter(Boolean).length}
      />
    </Box>
  )

  // Main Content (Table/List)
  const content = (
    <DataTable
      rows={data?.items || []}
      columns={columns}
      pagination
      currentPage={page}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      totalCount={data?.totalCount || 0}
    />
  )

  // Render with ListPageLayout
  return (
    <ListPageLayout
      title="My Items"
      description="Manage your items effectively"
      actions={[
        {
          label: 'Create New',
          onClick: handleCreate,
          icon: <FiPlus />,
          variant: 'contained',
        },
        {
          label: 'Import',
          onClick: handleImport,
          icon: <FiUpload />,
          variant: 'outlined',
        },
      ]}
      controls={controls}
      feedback={feedback}
      onClearFeedback={() => setFeedback(null)}
      selectionInfo={selectedRows.length > 0 ? selectionInfo : null}
    >
      {content}
    </ListPageLayout>
  )
}
```

## Key Components

### 1. ListPageLayout Props
- **title** (string): Main page title
- **description** (string): Subtitle/description
- **children** (React.ReactNode): Main content (usually DataTable)
- **actions** (optional): Array of action buttons (Create, Import, Export, etc.)
- **controls** (optional): Filter bar or other control elements
- **feedback** (optional): Alert messages for user feedback
- **onClearFeedback** (optional): Handler to clear feedback
- **selectionInfo** (optional): Selection info box with bulk actions

### 2. Actions Configuration
```tsx
actions: [
  {
    label: 'Button Label',
    onClick: () => handleAction(),
    icon: <IconComponent />,
    variant: 'contained' | 'outlined'  // defaults to 'contained'
  }
]
```

### 3. Controls Section
Typically contains FilterBar in button mode:
```tsx
const controls = (
  <Box sx={{ px: 2 }}>
    <FilterBar
      fields={filterFields}
      mode="button"
      buttonLabel="Filters"
      appliedCount={appliedFiltersCount}
      // ... other props
    />
  </Box>
)
```

### 4. Selection Info (Bulk Actions)
For pages supporting bulk actions:
```tsx
const selectionInfo = (
  <Box sx={{ p: 2, border: '1px solid rgba(...)', borderRadius: '10px' }}>
    <Stack direction={{ xs: 'column', lg: 'row' }} gap={2}>
      <Box>
        <Typography fontWeight={700} color="primary">
          {selectedCount} item(s) selected
        </Typography>
        <Typography fontSize="0.88rem" color="text.secondary">
          Perform bulk operations...
        </Typography>
      </Box>
      <Stack direction="row" gap={1}>
        <Button variant="contained" onClick={handleBulkAction}>
          Bulk Action
        </Button>
        <Button variant="text" onClick={clearSelection}>
          Clear
        </Button>
      </Stack>
    </Stack>
  </Box>
)
```

## Pages Updated
✅ Completed:
- NdrList.tsx
- RtoList.tsx
- CodRemittancesList.tsx

## Pages to Update
The following pages should be refactored to use ListPageLayout:
- [ ] Invoices.tsx
- [ ] WalletTransactions.tsx
- [ ] Couriers.tsx
- [ ] B2bOrders.tsx
- [ ] PickupAddresses.tsx
- [ ] ApiKeysTable.tsx
- [ ] WebhooksTable.tsx
- [ ] SupportTicketsPage.tsx
- [ ] RateCard.tsx
- [ ] WeightReconciliation.tsx

## Responsive Design
ListPageLayout includes built-in responsive design:
- **Mobile (xs)**: Full-width layout, stacked buttons
- **Tablet (md)**: 98% width, inline buttons
- **Desktop (lg+)**: 98% fixed width, inline controls

No additional responsive styling needed in most cases.

## Best Practices
1. **Always use FilterBar in button mode** for consistency
2. **Keep action buttons to 2-3 max** (Create, Import, Export)
3. **Use `px: 2`** for horizontal padding inside controls
4. **Reset pagination to page 1** when filters change
5. **Clear selection** when filters or page changes
6. **Provide feedback messages** for all major operations
7. **Use TypeScript** for type safety on components

## Example: Complete Implementation
See B2COrdersList.tsx for a comprehensive example with:
- Tabs for status filtering
- Bulk manifest operations
- Multiple document downloads
- Expanded row details
- Complex selection management

## Common Issues & Solutions

### Issue: Content not showing
**Solution**: Ensure controls and children are wrapped properly:
```tsx
<ListPageLayout ...>
  {controls && <Box>{controls}</Box>}
  {table}
</ListPageLayout>
```

### Issue: Filter button not appearing
**Solution**: Use `mode="button"` in FilterBar:
```tsx
<FilterBar mode="button" buttonLabel="Filters" ... />
```

### Issue: Actions buttons too wide on mobile
**Solution**: ListPageLayout handles this automatically with `fullWidth` on xs

## Questions?
Refer to B2COrdersList.tsx as the canonical implementation.
