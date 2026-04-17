import React, { useState } from 'react'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { updateEmail } from '../services/emailService.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function EmailSkeleton() {
  return (
    <div className="email-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line long" />
        </div>
      ))}
    </div>
  )
}

export default function EmailList({
  emails, loading, selectedId, onSelect, page, totalPages,
  onPageChange, search, onSearch, folder, onRefresh
}) {
  const [searchInput, setSearchInput] = useState(search)
  const [starring, setStarring] = useState({})

  function handleSearch(e) {
    e.preventDefault()
    onSearch(searchInput)
  }

  async function toggleStar(e, email) {
    e.stopPropagation()
    const id = email._id || email.id
    setStarring(prev => ({ ...prev, [id]: true }))
    try {
      await updateEmail(id, { starred: !email.starred })
      onRefresh()
    } catch {
      // ignore
    } finally {
      setStarring(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="email-list">
      <div className="email-list-header">
        <h2 className="folder-title">{folder.charAt(0).toUpperCase() + folder.slice(1)}</h2>
        <button className="icon-btn" onClick={onRefresh} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>
      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search emails..."
        />
        {searchInput && (
          <button type="button" className="search-clear" onClick={() => { setSearchInput(''); onSearch('') }}>✕</button>
        )}
      </form>
      {loading ? <EmailSkeleton /> : (
        <div className="email-items">
          {emails.length === 0 ? (
            <div className="empty-state">
              <span className="empty-duck">🦆</span>
              <p>No emails found</p>
            </div>
          ) : emails.map(email => {
            const id = email._id || email.id
            const isSelected = selectedId === id
            const isUnread = !email.read && !email.isRead
            return (
              <div
                key={id}
                className={`email-item${isSelected ? ' selected' : ''}${isUnread ? ' unread' : ''}`}
                onClick={() => onSelect(email)}
              >
                <button
                  className={`star-btn${email.starred ? ' starred' : ''}`}
                  onClick={e => toggleStar(e, email)}
                  disabled={starring[id]}
                  title={email.starred ? 'Unstar' : 'Star'}
                >
                  <Star size={14} fill={email.starred ? 'currentColor' : 'none'} />
                </button>
                <div className="email-item-content">
                  <div className="email-item-top">
                    <span className="email-sender">{email.from || email.sender || 'Unknown'}</span>
                    <span className="email-date">{formatDate(email.date || email.createdAt)}</span>
                  </div>
                  <div className="email-subject">{email.subject || '(No Subject)'}</div>
                  <div className="email-preview">{email.preview || email.snippet || (email.body ? email.body.slice(0, 100) : '')}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="icon-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={16} />
          </button>
          <span>{page} / {totalPages}</span>
          <button className="icon-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
