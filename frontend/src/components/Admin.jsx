import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUsers().then(u => {
      setUsers(u || [])
      setLoading(false)
    })
  }, [])

  async function changeRole(id, role) {
    await api.updateUser(id, { role })
    setUsers(users.map(u => u.id === id ? { ...u, role } : u))
  }

  async function deleteUser(id) {
    if (!confirm('¿Eliminar este usuario y todos sus datos?')) return
    await api.deleteUser(id)
    setUsers(users.filter(u => u.id !== id))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Cargando usuarios...</div>

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Administrar usuarios</h2>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {users.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>No hay usuarios registrados.</div>
        )}
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px',
            borderBottom: i < users.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}>
            {u.picture
              ? <img src={u.picture} width={36} height={36} style={{ borderRadius: '50%', flexShrink: 0 }} alt="" />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 13, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
            <select
              value={u.role}
              onChange={e => changeRole(u.id, e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, background: '#fff' }}
            >
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => deleteUser(u.id)}
              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
