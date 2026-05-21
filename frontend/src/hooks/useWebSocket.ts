import { useEffect, useRef, useState } from 'react'
import type { NeedsAttentionRow } from '../types'

interface ImportProgress {
  status?: string
  processed?: number
  imported?: number
  errors?: number
  flagged?: number
  error_details?: string[]
  preview?: NeedsAttentionRow[]
  preview_limit?: number
}

// Build the WebSocket URL pointing at the API service. In dev mode VITE_API_URL
// is empty, so we use the Vite proxy via window.location. In production
// VITE_API_URL is set to the API service URL, which lives on a different domain
// than the static frontend — we have to connect there explicitly.
function cableUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) {
    const host = apiUrl.replace(/^https?:\/\//, '')
    const proto = apiUrl.startsWith('https') ? 'wss' : 'ws'
    return `${proto}://${host}/cable`
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/cable`
}

export function useImportProgress(importId: string | null) {
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!importId) return

    const ws = new WebSocket(cableUrl())
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify({ channel: 'ImportStatusChannel', import_id: importId })
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'ping' || data.type === 'welcome' || data.type === 'confirm_subscription') return

      const message = data.message
      if (message) {
        setProgress(message)
      }
    }

    return () => {
      ws.close()
    }
  }, [importId])

  return progress
}
