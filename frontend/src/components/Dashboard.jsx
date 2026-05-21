import { useState } from 'react'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const CAT_COLORS = ['#6366f1','#f59e0b','#10b981','#f97316','#3b82f6','#ec4899','#14b8a6','#8b5cf6','#84cc16','#64748b']

function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

function DonutChart({ segments, size = 130, thickness = 22 }) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const C = 2 * Math.PI * r
  const total = segments.reduce((s, g) => s + g.value, 0)

  const arcs = []
  let acc = 0
  if (total > 0) {
    segments.forEach((seg, i) => {
      const dash = (seg.value / total) * C
      arcs.push(
        <circle key={i} cx={cx} cy={cy} r={r}
          fill="none" stroke={seg.color} strokeWidth={thickness}
          strokeDasharray={`${dash} ${C - dash}`}
          strokeDashoffset={-acc}
        />
      )
      acc += dash
    })
  }

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {total === 0
          ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={thickness} />
          : arcs
        }
      </g>
    </svg>
  )
}

function MonthlyChart({ transactions }) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const txs = transactions.filter(t => t.date && t.date.startsWith(prefix))
    const ingresos = txs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const gastos = txs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
    months.push({ label: MONTHS_SHORT[d.getMonth()], ingresos, gastos })
  }

  const maxVal = Math.max(...months.flatMap(m => [m.ingresos, m.gastos]), 1)
  const chartH = 90
  const barW = 14
  const barGap = 4
  const groupW = barW * 2 + barGap + 14
  const padL = 6
  const svgW = months.length * groupW + padL * 2
  const svgH = chartH + 26

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {months.map((m, i) => {
        const x = padL + i * groupW
        const inH = m.ingresos > 0 ? Math.max((m.ingresos / maxVal) * chartH, 3) : 0
        const gaH = m.gastos > 0 ? Math.max((m.gastos / maxVal) * chartH, 3) : 0
        return (
          <g key={i}>
            <rect x={x} y={chartH - inH} width={barW} height={inH} fill="#22c55e" rx={3} />
            <rect x={x + barW + barGap} y={chartH - gaH} width={barW} height={gaH} fill="#ef4444" rx={3} />
            <text x={x + barW} y={svgH - 4} textAnchor="middle" fontSize={9} fill="#aaa">{m.label}</text>
          </g>
        )
      })}
    </svg>
  )
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
  const mesTx = transactions.filter(t => t.date && t.date.startsWith(prefix))
  const mesIngresos = mesTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const mesGastos = mesTx.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const mesBalance = mesIngresos - mesGastos
  const tasaAhorro = mesIngresos > 0 ? Math.round((mesBalance / mesIngresos) * 100) : null

  const catMap = {}
  mesTx.filter(t => t.type === 'gasto').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
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

  const pieIngGas = [
    { label: 'Ingresos', value: mesIngresos, color: '#22c55e' },
    { label: 'Gastos', value: mesGastos, color: '#ef4444' },
  ]
  const pieCat = catEntries.map(([cat, val], i) => ({
    label: cat, value: val, color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  return (
    <div>
      {/* Saldo total */}
      <div style={{ background: '#1a1a1a', color: '#fff', borderRadius: 16, padding: '28px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>Saldo total acumulado</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: saldoTotal >= 0 ? '#22c55e' : '#ef4444' }}>
          {fmt(saldoTotal)}
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Card label="Ingresos del mes" value={fmt(mesIngresos)} color="#22c55e" />
        <Card label="Gastos del mes" value={fmt(mesGastos)} color="#ef4444" />
        <Card label="Balance del mes" value={fmt(mesBalance)} color={mesBalance >= 0 ? '#22c55e' : '#ef4444'} />
        {tasaAhorro !== null && (
          <Card label="Tasa de ahorro" value={`${tasaAhorro}%`} color={tasaAhorro >= 0 ? '#6366f1' : '#ef4444'} />
        )}
      </div>

      {/* Donuts: Ingresos vs Gastos + Por categoría */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Ingresos vs Gastos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart segments={pieIngGas} />
            <div style={{ flex: 1 }}>
              {pieIngGas.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{fmt(s.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {pieCat.length > 0 && (
          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Gastos por categoría</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <DonutChart segments={pieCat} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {pieCat.slice(0, 5).map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(s.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Últimos 6 meses */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Últimos 6 meses</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} /> Ingresos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Gastos
            </span>
          </div>
        </div>
        <MonthlyChart transactions={transactions} />
      </div>

      {/* Detalle gastos por categoría */}
      {catEntries.length > 0 && (
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Detalle por categoría — {MONTHS[month]} {year}</div>
          {catEntries.map(([cat, val], i) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length], display: 'inline-block' }} />
                  {cat}
                </span>
                <span style={{ color: '#888' }}>{fmt(val)}</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${(val / maxCat) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length], height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {catEntries.length === 0 && (
        <div style={{ ...card, color: '#888', textAlign: 'center', padding: 32, marginBottom: 14 }}>
          Sin gastos en {MONTHS[month]} {year}
        </div>
      )}

      {/* Deuda total */}
      {deudaTotal > 0 && (
        <div style={{ ...card, borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Deuda total pendiente</div>
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
  background: '#fff', border: '1px solid #ddd', borderRadius: 8,
  width: 36, height: 36, fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
