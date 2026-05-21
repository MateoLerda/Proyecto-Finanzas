import { useState } from 'react'
import { api } from '../api'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const CATEGORIAS_GASTO = ['Alimentación','Transporte','Vivienda','Salud','Entretenimiento','Ropa','Educación','Servicios','Suscripciones','Otros']
const CATEGORIAS_INGRESO = ['Sueldo','Freelance','Negocio','Inversiones','Alquiler','Bono','Otros']

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

const emptyForm = {
  type: 'gasto',
  amount: '',
  category: CATEGORIAS_GASTO[0],
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export default function Transacciones({ transactions, onRefresh }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mm = String(month + 1).padStart(2, '0')
  const prefix = `${year}-${mm}`
  const mesTx = transactions
    .filter(t => t.date && t.date.startsWith(prefix))
    .sort((a, b) => b.date.localeCompare(a.date))

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function handleTypeChange(e) {
    const type = e.target.value
    const cats = type === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO
    setForm(f => ({ ...f, type, category: cats[0] }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Ingresá un monto válido'); return
    }
    setLoading(true); setError('')
    try {
      await api.addTransaction({ ...form, amount: parseFloat(form.amount) })
      setForm(emptyForm)
      setShowForm(false)
      await onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTransaction(id)
      await onRefresh()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  const cats = form.type === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <span style={{ fontWeight: 600, fontSize: 15, minWidth: 140, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <label style={labelStyle}>
              Tipo
              <select value={form.type} onChange={handleTypeChange} style={inputStyle}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </label>
            <label style={labelStyle}>
              Monto ($)
              <input
                type="number" min="0" step="1"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                style={inputStyle} placeholder="0"
              />
            </label>
            <label style={labelStyle}>
              Categoría
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{
                  ...inputStyle,
                  borderColor: form.type === 'gasto' ? '#fca5a5' : '#86efac',
                }}
              >
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Fecha
              <input
                type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
              Nota (opcional)
              <input
                type="text" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                style={inputStyle} placeholder="Descripción..."
              />
            </label>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 14 }}>
            {loading ? 'Guardando...' : 'Guardar transacción'}
          </button>
        </form>
      )}

      {mesTx.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#888' }}>
          Sin transacciones en {MONTHS[month]} {year}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mesTx.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'ingreso' ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t.category}</div>
                  {t.note && <div style={{ fontSize: 12, color: '#888' }}>{t.note}</div>}
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{t.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontWeight: 700, color: t.type === 'ingreso' ? '#22c55e' : '#ef4444', fontSize: 15 }}>
                  {t.type === 'ingreso' ? '+' : '-'}{fmt(t.amount)}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}
                  title="Eliminar"
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const navBtn = {
  background: '#fff', border: '1px solid #ddd', borderRadius: 8,
  width: 34, height: 34, fontSize: 18, cursor: 'pointer',
}
const btnPrimary = {
  background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 20, padding: '9px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
}
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: '#555', fontWeight: 500 }
const inputStyle = { border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', background: '#fafafa' }
