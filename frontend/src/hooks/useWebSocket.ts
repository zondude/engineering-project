import { useEffect, useRef, useState } from 'react'

interface ImportProgress {
  status?: string
  processed?: number
  imported?: number
  errors?: number
  flagged?: number
  error_details?: string[]
}

export function useImportProgress(importId: string | null) {
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!importId) return

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/cable`
    const ws = new WebSocket(wsUrl)
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
