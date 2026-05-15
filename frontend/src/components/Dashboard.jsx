import { useState } from 'react'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export default function Dashboard({ transactions, debts }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const totalIngresos = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const totalGastos = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const saldoTotal = totalIngresos - totalGastos

  const mm = String(month + 1).padStart(2, '0')
  const prefix = `${year}-${mm}`

  const mesTransacciones = transactions.filter(t => t.date && t.date.startsWith(prefix))
  const mesIngresos = mesTransacciones.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const mesGastos = mesTransacciones.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const mesBalance = mesIngresos - mesGastos

  // gastos por categoría del mes
  const catGastos = {}
  mesTransacciones.filter(t => t.type === 'gasto').forEach(t => {
    catGastos[t.category] = (catGastos[t.category] || 0) + t.amount
  })
  const catEntries = Object.entries(catGastos).sort((a, b) => b[1] - a[1])
  const maxCat = catEntries.length ? catEntries[0][1] : 0

  const deudaTotal = debts.reduce((s, d) => s + d.remaining, 0)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div>
      {/* Saldo total */}
      <div style={{ background: '#1a1a1a', color: '#fff', borderRadius: 16, padding: '32px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>Saldo total acumulado</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: saldoTotal >= 0 ? '#22c55e' : '#ef4444' }}>
          {fmt(saldoTotal)}
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
          Ingresos históricos: {fmt(totalIngresos)} &nbsp;·&nbsp; Gastos históricos: {fmt(totalGastos)}
        </div>
      </div>

      {/* Navegador de mes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 16, minWidth: 140, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Tarjetas del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <Card label="Ingresos del mes" value={fmt(mesIngresos)} color="#22c55e" />
        <Card label="Gastos del mes" value={fmt(mesGastos)} color="#ef4444" />
        <Card label="Balance del mes" value={fmt(mesBalance)} color={mesBalance >= 0 ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Gráfico de barras por categoría */}
      {catEntries.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Gastos por categoría</div>
          {catEntries.map(([cat, val]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{cat}</span>
                <span style={{ color: '#888' }}>{fmt(val)}</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${(val / maxCat) * 100}%`, background: '#ef4444', height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {catEntries.length === 0 && (
        <div style={{ ...card, color: '#888', textAlign: 'center', padding: 32 }}>
          Sin gastos en {MONTHS[month]} {year}
        </div>
      )}

      {/* Deuda total */}
      {deudaTotal > 0 && (
        <div style={{ ...card, marginTop: 14, borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Deuda total pendiente</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f97316', marginTop: 4 }}>{fmt(deudaTotal)}</div>
        </div>
      )}
    </div>
  )
}

function Card({ label, value, color }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

const card = {
  background: '#fff',
  borderRadius: 12,
  padding: '16px 20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}

const navBtn = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 8,
  width: 36,
  height: 36,
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}
