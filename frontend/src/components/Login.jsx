import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [justVerified, setJustVerified] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setJustVerified(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const msg = await register(form.email, form.password, form.name)
        setPendingVerification(true)
      } else {
        await login(form.email, form.password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <div style={pageStyle}>
        <div style={boxStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Revisá tu email</h2>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Te enviamos un link de confirmación a <strong>{form.email}</strong>.
            <br />Hacé clic en el link para activar tu cuenta.
          </p>
          <p style={{ color: '#aaa', fontSize: 12 }}>¿No llegó? Revisá la carpeta de spam.</p>
          <button
            onClick={() => { setPendingVerification(false); setMode('login') }}
            style={{ marginTop: 20, background: 'none', border: 'none', color: '#6366f1', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={pageStyle}>
      <div style={boxStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>💰</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Mis Finanzas</h1>
        </div>

        {justVerified && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 14px', marginBottom: 16, color: '#16a34a', fontSize: 13, textAlign: 'center' }}>
            ✓ Cuenta confirmada. Ya podés iniciar sesión.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#1a1a1a' : '#6b7280',
                fontWeight: mode === m ? 600 : 400,
                fontSize: 14, cursor: 'pointer',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <input name="name" type="text" placeholder="Nombre completo"
              value={form.name} onChange={handleChange} required style={inputStyle} />
          )}
          <input name="email" type="email" placeholder="Email"
            value={form.email} onChange={handleChange} required style={inputStyle} />
          <input name="password" type="password"
            placeholder={mode === 'register' ? 'Contraseña (mínimo 6 caracteres)' : 'Contraseña'}
            value={form.password} onChange={handleChange} required
            minLength={mode === 'register' ? 6 : undefined} style={inputStyle} />

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', color: '#ef4444', fontSize: 13 }}>
              {error}
              {error.includes('confirmar tu email') && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ color: '#888' }}>¿No llegó el email? </span>
                  <button type="button" onClick={() => resendVerification(form.email)}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Reenviar
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#6b7280' : '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 8, padding: '11px 0',
            fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: 13 }}>o</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <a href={`${BACKEND}/api/auth/google`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 0',
          textDecoration: 'none', color: '#374151', fontWeight: 500, fontSize: 14,
        }}
          onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuar con Google
        </a>

      </div>
    </div>
  )
}

async function resendVerification(email) {
  if (!email) return
  try {
    await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8080/api') + '/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    alert('Email reenviado. Revisá tu bandeja.')
  } catch {
    alert('No se pudo reenviar el email.')
  }
}

const pageStyle = {
  minHeight: '100vh', background: '#f5f5f5',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const boxStyle = {
  background: '#fff', borderRadius: 16, padding: '40px 36px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.08)', maxWidth: 380, width: '100%',
}
