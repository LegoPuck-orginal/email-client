/**
 * Extracts a user-friendly message from known API error response formats.
 * @param {any} error Axios-style error object that may include response.data.
 * @param {string} fallbackMessage Message used when no API-specific message exists.
 * @returns {string} Best available error message for display.
 */
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
