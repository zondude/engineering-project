import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions'
import TransactionTable, { type SortField, type SortDirection } from '../components/TransactionTable'
import BulkActionBar from '../components/BulkActionBar'
import AddTransactionForm from '../components/AddTransactionForm'
import ExportModal from '../components/ExportModal'
import type { Transaction } from '../types'

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idFilter = searchParams.get('id') ?? ''

  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortField>('id')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const queryFilters = useMemo(
    () => ({ ...filters, sort, direction, ...(idFilter ? { id: idFilter } : {}) }),
    [filters, sort, direction, idFilter]
  )

  const clearIdFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('id')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTransactions(queryFilters)
  const deleteMutation = useDeleteTransaction()

  const handleSortChange = useCallback((field: SortField) => {
    if (field === sort) {
      setDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('desc')
    }
  }, [sort])

  const allTransactions = useMemo(
    () => data?.pages.flatMap(p => p.transactions) ?? [],
    [data]
  )

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      if (!value) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }, [])

  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? allTransactions.map(t => t.id) : [])
  }, [allTransactions])

  const handleDelete = useCallback((tx: Transaction) => {
    if (confirm(`Delete transaction #${tx.id}?`)) {
      deleteMutation.mutate(tx.id)
    }
  }, [deleteMutation])


  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowExportModal(true)}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Add Transaction</button>
        </div>
      </div>

      {idFilter && (
        <div className="active-filter-chip">
          Showing transaction <strong>#{idFilter}</strong> only
          <button onClick={clearIdFilter}>Clear filter</button>
        </div>
      )}

      <div className="table-wrap">
        <div className="filters-row">
          <input
            className="filter-input" placeholder="Search..."
            onChange={e => handleFilterChange('search', e.target.value)}
          />
          <select className="filter-select" onChange={e => handleFilterChange('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
            <option value="reviewed">Reviewed</option>
          </select>
          <select className="filter-select" onChange={e => handleFilterChange('category', e.target.value)}>
            <option value="">All Categories</option>
            {['Shopping', 'Food & Dining', 'Entertainment', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Travel', 'Education', 'Subscriptions'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input className="filter-input" type="date" onChange={e => handleFilterChange('date_from', e.target.value)} />
          <input className="filter-input" type="date" onChange={e => handleFilterChange('date_to', e.target.value)} />
        </div>

        {isLoading ? (
          <div className="empty-state">Loading transactions...</div>
        ) : (
          <TransactionTable
            transactions={allTransactions}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            sort={sort}
            direction={direction}
            onSortChange={handleSortChange}
          />
        )}

        {hasNextPage && (
          <div className="load-more">
            <button className="btn" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      <BulkActionBar selectedIds={selectedIds} onApply={() => setSelectedIds([])} />

      {showAddForm && (
        <>
          <div className="slide-over-backdrop" onClick={() => setShowAddForm(false)} />
          <div className="slide-over">
            <h2>Add Transaction</h2>
            <AddTransactionForm onClose={() => setShowAddForm(false)} />
          </div>
        </>
      )}

      {showExportModal && (
        <ExportModal initialFilters={filters} onClose={() => setShowExportModal(false)} />
      )}
    </>
  )
}
