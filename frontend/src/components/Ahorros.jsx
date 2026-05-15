import { useState } from 'react'
import { api } from '../api'

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

const emptyForm = { name: '', target: '', saved: '' }

export default function Ahorros({ goals, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [abonar, setAbonar] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Ingresá un nombre'); return }
    if (!form.target || Number(form.target) <= 0) { setError('Ingresá un objetivo válido'); return }
    setLoading(true); setError('')
    try {
      await api.addGoal({
        name: form.name.trim(),
        target: parseFloat(form.target),
        saved: form.saved ? parseFloat(form.saved) : 0,
      })
      setForm(emptyForm)
      setShowForm(false)
      await onRefresh()
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAbonar(goal) {
    const monto = parseFloat(abonar[goal.id] || 0)
    if (!monto || monto <= 0) return
    try {
      await api.updateGoal(goal.id, { ...goal, saved: goal.saved + monto })
      setAbonar(a => ({ ...a, [goal.id]: '' }))
      await onRefresh()
    } catch(err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteGoal(id)
      await onRefresh()
    } catch(err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowForm(s => !s)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Meta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <label style={labelStyle}>
              Nombre de la meta
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inputStyle} placeholder="Ej: Viaje a Europa" />
            </label>
            <label style={labelStyle}>
              Objetivo ($)
              <input type="number" min="0" step="1" value={form.target} onChange={e => setForm(f => ({...f, target: e.target.value}))} style={inputStyle} placeholder="0" />
            </label>
            <label style={labelStyle}>
              Ya ahorré ($)
              <input type="number" min="0" step="1" value={form.saved} onChange={e => setForm(f => ({...f, saved: e.target.value}))} style={inputStyle} placeholder="0" />
            </label>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 14 }}>
            {loading ? 'Guardando...' : 'Crear meta'}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#888' }}>
          Todavía no tenés metas de ahorro
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map(g => {
            const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0
            const cumplida = g.saved >= g.target

            return (
              <div key={g.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                    {cumplida && <span style={{ marginLeft: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Meta alcanzada!</span>}
                  </div>
                  <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 8 }}>
                  <span>Ahorrado: <b style={{ color: '#22c55e' }}>{fmt(g.saved)}</b></span>
                  <span>Objetivo: {fmt(g.target)}</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, background: '#22c55e', height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'right' }}>{Math.round(pct)}% completado</div>

                {!cumplida && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number" min="0" step="1"
                      placeholder="Sumar ahorro ($)"
                      value={abonar[g.id] || ''}
                      onChange={e => setAbonar(a => ({ ...a, [g.id]: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => handleAbonar(g)} style={btnSecondary}>Agregar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: '#555', fontWeight: 500 }
const inputStyle = { border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', background: '#fafafa' }
const btnPrimary = {
  background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 20, padding: '9px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
}
const btnSecondary = {
  background: '#f0f0f0', color: '#1a1a1a', border: 'none',
  borderRadius: 20, padding: '9px 16px', fontSize: 14, cursor: 'pointer',
}
