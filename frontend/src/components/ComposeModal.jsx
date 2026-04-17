import React, { useState, useEffect } from 'react'
import { X, Send, Minimize2 } from 'lucide-react'
import { sendEmail } from '../services/emailService.js'

export default function ComposeModal({ initialData, onClose, onSent }) {
  const [form, setForm] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    if (initialData) setForm(prev => ({ ...prev, ...initialData }))
  }, [initialData])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!form.to.trim()) { setError('Please enter a recipient.'); return }
    setError('')
    setLoading(true)
    try {
      await sendEmail(form)
      setSuccess(true)
      setTimeout(onSent, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="compose-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`compose-modal${minimized ? ' minimized' : ''}`}>
        <div className="compose-titlebar">
          <span>New Message</span>
          <div className="compose-controls">
            <button className="icon-btn-sm" onClick={() => setMinimized(!minimized)} title={minimized ? 'Expand' : 'Minimize'}>
              <Minimize2 size={14} />
            </button>
            <button className="icon-btn-sm" onClick={onClose} title="Close">
              <X size={14} />
            </button>
          </div>
        </div>
        {!minimized && (
          <form onSubmit={handleSend} className="compose-form">
            {error && <div className="compose-error">{error}</div>}
            {success && <div className="compose-success">✓ Email sent successfully!</div>}
            <div className="compose-field">
              <label>To</label>
              <input name="to" type="text" value={form.to} onChange={handleChange} placeholder="recipient@example.com" required />
            </div>
            <div className="compose-field">
              <label>CC</label>
              <input name="cc" type="text" value={form.cc} onChange={handleChange} placeholder="cc@example.com" />
            </div>
            <div className="compose-field">
              <label>BCC</label>
              <input name="bcc" type="text" value={form.bcc} onChange={handleChange} placeholder="bcc@example.com" />
            </div>
            <div className="compose-field">
              <label>Subject</label>
              <input name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="Subject" />
            </div>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              className="compose-body"
              placeholder="Write your message here..."
              rows={12}
            />
            <div className="compose-footer">
              <button type="submit" className="btn btn-primary" disabled={loading || success}>
                {loading ? 'Sending...' : <><Send size={16} /> Send</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Discard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
