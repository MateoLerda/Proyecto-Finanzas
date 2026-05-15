import { useState } from 'react'
import { api } from '../api'

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

const emptyForm = { name: '', total: '', remaining: '', dues: '', due_date: '' }

export default function Deudas({ debts, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [pagos, setPagos] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Ingresá un nombre'); return }
    if (!form.total || Number(form.total) <= 0) { setError('Ingresá un total válido'); return }
    setLoading(true); setError('')
    const remaining = form.remaining ? parseFloat(form.remaining) : parseFloat(form.total)
    try {
      await api.addDebt({
        name: form.name.trim(),
        total: parseFloat(form.total),
        remaining,
        dues: form.dues ? parseInt(form.dues) : 1,
        due_date: form.due_date || '',
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

  async function handlePago(debt) {
    const monto = parseFloat(pagos[debt.id] || 0)
    if (!monto || monto <= 0) return
    const newRemaining = Math.max(0, debt.remaining - monto)
    try {
      await api.updateDebt(debt.id, { ...debt, remaining: newRemaining })
      setPagos(p => ({ ...p, [debt.id]: '' }))
      await onRefresh()
    } catch(err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteDebt(id)
      await onRefresh()
    } catch(err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowForm(s => !s)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Deuda'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <label style={labelStyle}>
              Nombre / Acreedor
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inputStyle} placeholder="Ej: Tarjeta Visa" />
            </label>
            <label style={labelStyle}>
              Total original ($)
              <input type="number" min="0" step="1" value={form.total} onChange={e => setForm(f => ({...f, total: e.target.value}))} style={inputStyle} placeholder="0" />
            </label>
            <label style={labelStyle}>
              Saldo restante ($)
              <input type="number" min="0" step="1" value={form.remaining} onChange={e => setForm(f => ({...f, remaining: e.target.value}))} style={inputStyle} placeholder="Igual al total si es nuevo" />
            </label>
            <label style={labelStyle}>
              Cuotas restantes
              <input type="number" min="1" step="1" value={form.dues} onChange={e => setForm(f => ({...f, dues: e.target.value}))} style={inputStyle} placeholder="1" />
            </label>
            <label style={labelStyle}>
              Fecha de vencimiento
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} style={inputStyle} />
            </label>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 14 }}>
            {loading ? 'Guardando...' : 'Agregar deuda'}
          </button>
        </form>
      )}

      {debts.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#888' }}>
          No tenés deudas registradas
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {debts.map(d => {
            const pagado = d.total - d.remaining
            const pct = d.total > 0 ? Math.min((pagado / d.total) * 100, 100) : 0
            const cancelada = d.remaining <= 0
            const cuota = d.dues > 0 ? d.remaining / d.dues : d.remaining

            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                    {cancelada && <span style={{ marginLeft: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Deuda cancelada!</span>}
                  </div>
                  <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 4 }}>
                  <span>Pagado: <b style={{ color: '#22c55e' }}>{fmt(pagado)}</b></span>
                  <span>Restante: <b style={{ color: '#ef4444' }}>{fmt(d.remaining)}</b></span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  Total: {fmt(d.total)}
                  {d.dues > 0 && !cancelada && <span> &nbsp;·&nbsp; Cuota aprox: {fmt(cuota)} x {d.dues} cuotas</span>}
                  {d.due_date && <span> &nbsp;·&nbsp; Vence: {d.due_date}</span>}
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${pct}%`, background: '#22c55e', height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: cancelada ? 0 : 12, textAlign: 'right' }}>{Math.round(pct)}% pagado</div>

                {!cancelada && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number" min="0" step="1"
                      placeholder="Registrar pago ($)"
                      value={pagos[d.id] || ''}
                      onChange={e => setPagos(p => ({ ...p, [d.id]: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => handlePago(d)} style={btnSecondary}>Pagar</button>
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
