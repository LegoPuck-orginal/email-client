import React, { useState } from 'react'
import { ArrowLeft, Reply, Forward, Trash2, Star, MoreVertical, ExternalLink } from 'lucide-react'
import { updateEmail, deleteEmail } from '../services/emailService.js'

function formatFullDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString([], {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function EmailDetail({ email, onBack, onReply, onForward, onDelete, onUpdate }) {
  const [starring, setStarring] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleStar() {
    setStarring(true)
    try {
      const updated = await updateEmail(email._id || email.id, { starred: !email.starred })
      onUpdate({ ...email, starred: !email.starred, ...updated })
    } catch {
      // ignore
    } finally {
      setStarring(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Move this email to trash?')) return
    setDeleting(true)
    try {
      await deleteEmail(email._id || email.id)
      onDelete()
    } catch {
      setDeleting(false)
    }
  }

  const bodyContent = email.htmlBody || email.body || ''
  const isHtml = email.htmlBody || bodyContent.includes('<')

  return (
    <div className="email-detail">
      <div className="detail-toolbar">
        <button className="icon-btn" onClick={onBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={() => onReply(email)} title="Reply">
            <Reply size={16} />
            <span>Reply</span>
          </button>
          <button className="toolbar-btn" onClick={() => onForward(email)} title="Forward">
            <Forward size={16} />
            <span>Forward</span>
          </button>
          <button
            className={`icon-btn${email.starred ? ' starred' : ''}`}
            onClick={handleStar}
            disabled={starring}
            title={email.starred ? 'Unstar' : 'Star'}
          >
            <Star size={18} fill={email.starred ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-btn danger" onClick={handleDelete} disabled={deleting} title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="detail-header">
        <h1 className="detail-subject">{email.subject || '(No Subject)'}</h1>
        <div className="detail-meta">
          <div className="meta-row">
            <span className="meta-label">From:</span>
            <span className="meta-value">{email.from || email.sender}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">To:</span>
            <span className="meta-value">{Array.isArray(email.to) ? email.to.join(', ') : email.to}</span>
          </div>
          {email.cc && (
            <div className="meta-row">
              <span className="meta-label">CC:</span>
              <span className="meta-value">{Array.isArray(email.cc) ? email.cc.join(', ') : email.cc}</span>
            </div>
          )}
          <div className="meta-row">
            <span className="meta-label">Date:</span>
            <span className="meta-value">{formatFullDate(email.date || email.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="detail-body">
        {isHtml ? (
          /* Note: In production, sanitize HTML with DOMPurify before rendering */
          <div dangerouslySetInnerHTML={{ __html: bodyContent }} className="html-body" />
        ) : (
          <pre className="text-body">{bodyContent}</pre>
        )}
      </div>
    </div>
  )
}
