const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function req(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.reload()
    return
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Error ${res.status}`)
  }
  if (res.status === 200 || res.status === 201) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) return res.json()
  }
  return null
}

export const api = {
  // transactions
  getTransactions: () => req(`${BASE}/transactions`),
  addTransaction: (data) => req(`${BASE}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteTransaction: (id) => req(`${BASE}/transactions/${id}`, { method: 'DELETE' }),

  // budgets
  getBudgets: () => req(`${BASE}/budgets`),
  saveBudget: (data) => req(`${BASE}/budgets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteBudget: (id) => req(`${BASE}/budgets/${id}`, { method: 'DELETE' }),

  // goals
  getGoals: () => req(`${BASE}/goals`),
  addGoal: (data) => req(`${BASE}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateGoal: (id, data) => req(`${BASE}/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteGoal: (id) => req(`${BASE}/goals/${id}`, { method: 'DELETE' }),

  // debts
  getDebts: () => req(`${BASE}/debts`),
  addDebt: (data) => req(`${BASE}/debts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateDebt: (id, data) => req(`${BASE}/debts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteDebt: (id) => req(`${BASE}/debts/${id}`, { method: 'DELETE' }),

  // admin
  getUsers: () => req(`${BASE}/admin/users`),
  updateUser: (id, data) => req(`${BASE}/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteUser: (id) => req(`${BASE}/admin/users/${id}`, { method: 'DELETE' }),
}
