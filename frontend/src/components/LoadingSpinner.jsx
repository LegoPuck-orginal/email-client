import React from 'react'

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  )
}
