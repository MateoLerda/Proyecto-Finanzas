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

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
