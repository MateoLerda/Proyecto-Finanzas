import { useState } from 'react'
import { api } from '../api'

const CATEGORIES = ['Alimentación','Transporte','Vivienda','Salud','Entretenimiento','Ropa','Educación','Servicios','Otros']

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default function Presupuesto({ budgets, transactions, onRefresh }) {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [limit, setLimit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const gastosMes = transactions.filter(t => t.type === 'gasto' && t.date && t.date.startsWith(prefix))

  function getGasto(cat) {
    return gastosMes.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) {
      setError('Ingresá un límite válido'); return
    }
    setLoading(true); setError('')
    try {
      await api.saveBudget({ category, limit: parseFloat(limit) })
      setLimit('')
      await onRefresh()
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteBudget(id)
      await onRefresh()
    } catch(err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={labelStyle}>
          Categoría
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Límite mensual ($)
          <input type="number" min="0" step="1" value={limit} onChange={e => setLimit(e.target.value)} style={inputStyle} placeholder="0" />
        </label>
        <div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 6 }}>{error}</div>}
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? 'Guardando...' : 'Agregar / Actualizar'}
          </button>
        </div>
      </form>

      {budgets.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#888' }}>
          Todavía no configuraste ningún presupuesto
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map(b => {
            const gasto = getGasto(b.category)
            const pct = b.limit > 0 ? Math.min((gasto / b.limit) * 100, 100) : 0
            const excede = gasto > b.limit
            const alerta = pct >= 80 && !excede
            const barColor = excede ? '#ef4444' : alerta ? '#f59e0b' : '#22c55e'

            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{b.category}</span>
                    {excede && <span style={{ marginLeft: 8, fontSize: 12, color: '#ef4444', fontWeight: 500 }}>⚠ Límite superado</span>}
                    {alerta && <span style={{ marginLeft: 8, fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>⚠ Cerca del límite</span>}
                  </div>
                  <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#555' }}>
                  <span>Gastado: <b style={{ color: barColor }}>{fmt(gasto)}</b></span>
                  <span>Límite: {fmt(b.limit)}</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: barColor, height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 6, textAlign: 'right' }}>{Math.round(pct)}% utilizado</div>
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
