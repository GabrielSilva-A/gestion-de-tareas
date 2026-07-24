const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const buildHeaders = (token, customHeaders) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export const apiRequest = async (path, { method = 'GET', token, body, headers } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    const message = payload?.message || 'Error en la solicitud'
    throw new Error(message)
  }

  return payload
}

export const authApi = {
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
}

export const tasksApi = {
  list: (token) => apiRequest('/api/tasks', { token }),
  create: (token, payload) => apiRequest('/api/tasks', { method: 'POST', token, body: payload }),
  update: (token, id, payload) => apiRequest(`/api/tasks/${id}`, { method: 'PATCH', token, body: payload }),
  remove: async (token, id) => {
    await apiRequest(`/api/tasks/${id}`, { method: 'DELETE', token })
  },
}
