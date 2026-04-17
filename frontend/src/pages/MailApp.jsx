import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import EmailList from '../components/EmailList.jsx'
import EmailDetail from '../components/EmailDetail.jsx'
import ComposeModal from '../components/ComposeModal.jsx'
import UpdateChecker from '../components/UpdateChecker.jsx'
import { getEmails, getEmail, getFolders } from '../services/emailService.js'

export default function MailApp({ folder = 'inbox', compose = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailLoading, setEmailLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(compose)
  const [replyData, setReplyData] = useState(null)
  const [showDetail, setShowDetail] = useState(!!id)

  const loadEmails = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEmails(folder, page, 20, search)
      setEmails(data.emails || data || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      setEmails([])
    } finally {
      setLoading(false)
    }
  }, [folder, page, search])

  const loadFolders = useCallback(async () => {
    try {
      const data = await getFolders()
      setFolders(data || [])
    } catch {
      setFolders([])
    }
  }, [])

  useEffect(() => {
    loadEmails()
    loadFolders()
  }, [loadEmails, loadFolders])

  useEffect(() => {
    if (id) {
      setEmailLoading(true)
      getEmail(id)
        .then(data => { setSelectedEmail(data); setShowDetail(true) })
        .catch(() => setSelectedEmail(null))
        .finally(() => setEmailLoading(false))
    } else {
      setSelectedEmail(null)
      setShowDetail(false)
    }
  }, [id])

  function handleSelectEmail(email) {
    setSelectedEmail(email)
    setShowDetail(true)
    navigate(`/inbox/${email._id || email.id}`)
  }

  function handleBack() {
    setShowDetail(false)
    setSelectedEmail(null)
    navigate(`/${folder}`)
  }

  function handleReply(email) {
    setReplyData({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\n${email.body}`
    })
    setComposeOpen(true)
  }

  function handleForward(email) {
    setReplyData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nTo: ${email.to}\n\n${email.body}`
    })
    setComposeOpen(true)
  }

  function handleCompose() {
    setReplyData(null)
    setComposeOpen(true)
  }

  function handleComposeSent() {
    setComposeOpen(false)
    setReplyData(null)
    if (folder === 'sent') loadEmails()
  }

  return (
    <div className="mail-app">
      <UpdateChecker />
      <Sidebar
        currentFolder={folder}
        folders={folders}
        onCompose={handleCompose}
      />
      <div className={`email-list-panel${showDetail ? ' hidden-mobile' : ''}`}>
        <EmailList
          emails={emails}
          loading={loading}
          selectedId={selectedEmail?._id || selectedEmail?.id}
          onSelect={handleSelectEmail}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          search={search}
          onSearch={setSearch}
          folder={folder}
          onRefresh={loadEmails}
        />
      </div>
      <div className={`email-detail-panel${!showDetail ? ' hidden-mobile' : ''}`}>
        {emailLoading ? (
          <div className="detail-loading"><div className="spinner" /></div>
        ) : selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onBack={handleBack}
            onReply={handleReply}
            onForward={handleForward}
            onDelete={() => { handleBack(); loadEmails() }}
            onUpdate={(updated) => {
              setSelectedEmail(updated)
              setEmails(prev => prev.map(e => (e._id || e.id) === (updated._id || updated.id) ? updated : e))
            }}
          />
        ) : (
          <div className="no-selection">
            <span className="no-selection-duck">🦆</span>
            <p>Select an email to read it</p>
          </div>
        )}
      </div>
      {composeOpen && (
        <ComposeModal
          initialData={replyData}
          onClose={() => { setComposeOpen(false); setReplyData(null) }}
          onSent={handleComposeSent}
        />
      )}
    </div>
  )
}
