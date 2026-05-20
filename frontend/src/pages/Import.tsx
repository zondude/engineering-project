import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import CSVDropzone from '../components/CSVDropzone'
import { uploadCSV } from '../api/client'
import { useImportProgress } from '../hooks/useWebSocket'

export default function Import() {
  const [importId, setImportId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; flagged: number } | null>(null)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const progress = useImportProgress(importId)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const data = await uploadCSV(file)
      setImportId(data.import_id)
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  if (progress?.status === 'complete' && !result) {
    setResult({ imported: progress.imported!, errors: progress.errors!, flagged: progress.flagged! })
    setUploading(false)
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

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
      )}
    </>
  )
}
