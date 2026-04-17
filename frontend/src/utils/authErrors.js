export function getApiErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first?.msg === 'string' && first.msg.trim()) {
      return first.msg
    }
  }

  return fallbackMessage
}
