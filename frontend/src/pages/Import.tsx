import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import CSVDropzone from '../components/CSVDropzone'
import TransactionForm from '../components/TransactionForm'
import { uploadCSV, updateTransaction, deleteTransaction } from '../api/client'
import { useImportProgress } from '../hooks/useWebSocket'
import type { Transaction, NeedsAttentionRow } from '../types'
import AnomalyBadge from '../components/AnomalyBadge'

interface CompleteResult {
  imported: number
  errors: number
  flagged: number
  error_details: string[]
  preview: NeedsAttentionRow[]
  preview_limit: number
}

export default function Import() {
  const [importId, setImportId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<CompleteResult | null>(null)
  const [previewRows, setPreviewRows] = useState<NeedsAttentionRow[]>([])
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const progress = useImportProgress(importId)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    setResult(null)
    setPreviewRows([])
    try {
      const data = await uploadCSV(file)
      setImportId(data.import_id)
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  if (progress?.status === 'complete' && !result) {
    setResult({
      imported: progress.imported!,
      errors: progress.errors!,
      flagged: progress.flagged!,
      error_details: progress.error_details ?? [],
      preview: progress.preview ?? [],
      preview_limit: progress.preview_limit ?? 50,
    })
    setPreviewRows(progress.preview ?? [])
    setUploading(false)
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }, [queryClient])

  const handleApprove = useCallback(async (row: NeedsAttentionRow) => {
    await updateTransaction(row.id, { approve: true })
    setPreviewRows(prev => prev.filter(r => r.id !== row.id))
    invalidateAll()
  }, [invalidateAll])

  const handleDelete = useCallback(async (row: NeedsAttentionRow) => {
    if (!confirm(`Delete transaction #${row.id}?`)) return
    await deleteTransaction(row.id)
    setPreviewRows(prev => prev.filter(r => r.id !== row.id))
    invalidateAll()
  }, [invalidateAll])

  const handleEditClose = useCallback(() => {
    setEditingTx(null)
    invalidateAll()
  }, [invalidateAll])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Import CSV</h1>
      </div>

      <CSVDropzone onFile={handleFile} disabled={uploading} />

      {uploading && progress && (
        <div style={{ marginTop: 24 }}>
          <p>Processing... {progress.processed} rows processed, {progress.imported} imported</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: progress.processed ? '50%' : '10%' }} />
          </div>
        </div>
      )}

      {uploading && !progress && (
        <div style={{ marginTop: 24 }}>
          <p>Uploading and processing...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '10%' }} />
          </div>
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

      {result && (
        <>
          <div style={{ marginTop: 24 }}>
            <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="label">Imported</div>
                <div className="value green">{result.imported}</div>
              </div>
              <div className="stat-card">
                <div className="label">Errors (Skipped)</div>
                <div className="value amber">{result.errors}</div>
              </div>
              <div className="stat-card">
                <div className="label">Flagged</div>
                <div className="value red">{result.flagged}</div>
              </div>
            </div>
          </div>

          {result.errors > 0 && (
            <div className="section">
              <h2 className="section-title">Skipped rows ({result.errors})</h2>
              <div className="error-panel">
                {result.error_details.map((msg, i) => (
                  <div key={i} className="error-row">{msg}</div>
                ))}
                {result.errors > result.error_details.length && (
                  <div className="error-row" style={{ color: 'var(--text3)' }}>
                    …and {result.errors - result.error_details.length} more errors not shown
                  </div>
                )}
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Imported transactions
                  {result.imported > result.preview_limit && (
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>
                      showing first {result.preview_limit} of {result.imported}
                    </span>
                  )}
                </h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map(row => (
                      <tr key={row.id} className={row.status === 'flagged' ? 'flagged' : ''}>
                        <td style={{ color: 'var(--text3)' }}>#{row.id}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                        <td>{row.description || <span style={{ color: 'var(--text3)' }}>(none)</span>}</td>
                        <td className="amount">${Number(row.amount).toFixed(2)}</td>
                        <td>{row.category ? <span className="badge badge-blue">{row.category}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                        <td><span className={`status-pill status-${row.status}`}>{row.status}</span></td>
                        <td>{row.anomaly_flags.map(flag => <AnomalyBadge key={flag} type={flag} />)}</td>
                        <td className="actions">
                          <button className="btn btn-sm" onClick={() => setEditingTx(row)}>Edit</button>
                          {(row.status === 'pending' || row.status === 'flagged') && (
                            <button className="btn btn-sm btn-primary" onClick={() => handleApprove(row)}>Approve</button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {editingTx && (
        <>
          <div className="slide-over-backdrop" onClick={() => setEditingTx(null)} />
          <div className="slide-over">
            <h2>Edit Transaction #{editingTx.id}</h2>
            <TransactionForm transaction={editingTx} onClose={handleEditClose} />
          </div>
        </>
      )}
    </>
  )
}
