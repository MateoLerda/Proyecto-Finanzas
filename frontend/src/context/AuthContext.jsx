import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', window.location.pathname)
    }

    const stored = localStorage.getItem('token')
    if (stored) {
      fetchMe(stored)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchMe(token) {
    try {
      const res = await fetch(`${BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUser(data)
    } catch {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  async function register(email, password, name) {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al registrarse')
    localStorage.setItem('token', data.token)
    await fetchMe(data.token)
  }

  async function login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
    localStorage.setItem('token', data.token)
    await fetchMe(data.token)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
