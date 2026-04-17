import React, { useState, useEffect, useCallback } from 'react'
import { X, Download } from 'lucide-react'
import { getUpdateStatus, triggerUpdate } from '../services/updateService.js'

const POLL_INTERVAL = 60000

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [version, setVersion] = useState(null)

  const checkStatus = useCallback(async () => {
    try {
      const data = await getUpdateStatus()
      if (data?.updateAvailable) {
        setUpdateAvailable(true)
        setVersion(data.latestVersion || data.version || null)
        setDismissed(false)
      }
    } catch {
      // silently fail - update check is non-critical
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [checkStatus])

  async function handleUpdate() {
    setUpdating(true)
    try {
      await triggerUpdate()
      setUpdateAvailable(false)
    } catch {
      setUpdating(false)
    }
  }

  if (!updateAvailable || dismissed) return null

  return (
    <div className="update-banner">
      <span className="update-duck">🦆</span>
      <div className="update-text">
        <strong>Update available{version ? ` (v${version})` : ''}!</strong>
        <span>A new version of Email Client is ready.</span>
      </div>
      <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={updating}>
        <Download size={14} />
        {updating ? 'Updating...' : 'Update Now'}
      </button>
      <button className="icon-btn-sm" onClick={() => setDismissed(true)} title="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
