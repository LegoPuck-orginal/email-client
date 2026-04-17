import api from './api.js'

export async function getEmails(folder = 'inbox', page = 1, limit = 20, search = '') {
  const params = { folder, page, limit }
  if (search) params.search = search
  const res = await api.get('/emails', { params })
  return res.data
}

export async function getEmail(id) {
  const res = await api.get(`/emails/${id}`)
  return res.data
}

export async function sendEmail(emailData) {
  const res = await api.post('/emails/send', emailData)
  return res.data
}

export async function updateEmail(id, data) {
  const res = await api.patch(`/emails/${id}`, data)
  return res.data
}

export async function deleteEmail(id) {
  const res = await api.delete(`/emails/${id}`)
  return res.data
}

export async function syncEmails() {
  const res = await api.post('/emails/sync')
  return res.data
}

export async function getFolders() {
  const res = await api.get('/emails/folders')
  return res.data
}
