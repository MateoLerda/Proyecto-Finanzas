const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')

export default function Login() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        maxWidth: 360, width: '100%',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Mis Finanzas</h1>
        <p style={{ color: '#888', marginBottom: 36, fontSize: 15 }}>Iniciá sesión para continuar</p>
        <a
          href={`${BACKEND}/api/auth/google`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#1a1a1a', color: '#fff',
            padding: '12px 28px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Iniciar sesión con Google
        </a>
      </div>
    </div>
  )
}
