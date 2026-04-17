import api from './api.js'

export async function checkForUpdates() {
  const res = await api.get('/updates/check')
  return res.data
}

export async function triggerUpdate() {
  const res = await api.post('/updates/trigger')
  return res.data
}

export async function getUpdateStatus() {
  const res = await api.get('/updates/status')
  return res.data
}
