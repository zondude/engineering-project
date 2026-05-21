import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Transaction } from '../types'
import AnomalyBadge from './AnomalyBadge'

export type SortField = 'id' | 'date' | 'amount'
export type SortDirection = 'asc' | 'desc'

interface Props {
  transactions: Transaction[]
  selectedIds: number[]
  onSelect: (id: number, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onDelete: (tx: Transaction) => void
  sort: SortField
  direction: SortDirection
  onSortChange: (field: SortField) => void
}

export default function TransactionTable({ transactions, selectedIds, onSelect, onSelectAll, onDelete, sort, direction, onSortChange }: Props) {
  const sortIndicator = (field: SortField) => {
    if (sort !== field) return <span className="sort-indicator">↕</span>
    return <span className="sort-indicator active">{direction === 'asc' ? '↑' : '↓'}</span>
  }
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 20,
  })

  const allSelected = transactions.length > 0 && selectedIds.length === transactions.length

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" checked={allSelected} onChange={e => onSelectAll(e.target.checked)} />
            </th>
            <th className="sortable" onClick={() => onSortChange('date')}>
              Date {sortIndicator('date')}
            </th>
            <th>Description</th>
            <th className="sortable" onClick={() => onSortChange('amount')}>
              Amount {sortIndicator('amount')}
            </th>
            <th>Category</th>
            <th>Status</th>
            <th>Flags</th>
            <th>Actions</th>
          </tr>
        </thead>
      </table>
      <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const tx = transactions[virtualRow.index]
            return (
              <div
                key={tx.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <table style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    <tr className={tx.status === 'flagged' ? 'flagged' : ''}>
                      <td style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(tx.id)}
                          onChange={e => onSelect(tx.id, e.target.checked)}
                        />
                      </td>
                      <td>{tx.date}</td>
                      <td>{tx.description || <span style={{ color: 'var(--text3)' }}>(none)</span>}</td>
                      <td className="amount">${Number(tx.amount).toFixed(2)}</td>
                      <td>{tx.category ? <span className="badge badge-blue">{tx.category}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                      <td><span className={`status-pill status-${tx.status}`}>{tx.status}</span></td>
                      <td>
                        {tx.anomaly_flags.map(flag => (
                          <AnomalyBadge key={flag} type={flag} />
                        ))}
                      </td>
                      <td className="actions">
                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(tx)}>Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
