import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Inbox, Send, FileText, Trash2, AlertOctagon, PenSquare, LogOut, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const FOLDERS = [
  { key: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox' },
  { key: 'sent', label: 'Sent', icon: Send, path: '/sent' },
  { key: 'drafts', label: 'Drafts', icon: FileText, path: '/drafts' },
  { key: 'spam', label: 'Spam', icon: AlertOctagon, path: '/spam' },
  { key: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
]

export default function Sidebar({ currentFolder, folders, onCompose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function getCount(key) {
    const f = folders.find(f => (f.name || f.key || f.folder) === key)
    return f?.unread || f?.count || 0
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Mail size={22} />
          <span>🦆 Mail</span>
        </div>
      </div>
      <button className="compose-btn" onClick={onCompose}>
        <PenSquare size={18} />
        Compose
      </button>
      <nav className="sidebar-nav">
        {FOLDERS.map(({ key, label, icon: Icon, path }) => {
          const count = getCount(key)
          return (
            <NavLink
              key={key}
              to={path}
              className={({ isActive }) => `nav-item${isActive || currentFolder === key ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user.name || 'User'}</span>
              <span className="user-email">{user.email || ''}</span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
