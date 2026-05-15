import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import Dashboard from './components/Dashboard'
import Transacciones from './components/Transacciones'
import Presupuesto from './components/Presupuesto'
import Ahorros from './components/Ahorros'
import Deudas from './components/Deudas'

const TABS = ['Dashboard', 'Transacciones', 'Presupuesto', 'Ahorros', 'Deudas']

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [tx, bg, gl, db] = await Promise.all([
        api.getTransactions(),
        api.getBudgets(),
        api.getGoals(),
        api.getDebts(),
      ])
      setTransactions(tx || [])
      setBudgets(bg || [])
      setGoals(gl || [])
      setDebts(db || [])
      setError('')
    } catch(err) {
      setError('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: '#1a1a1a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>💰</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>Mis Finanzas</span>
      </header>

      {/* Tabs */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: tab === t ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
              borderRadius: 20,
              padding: '7px 16px',
              margin: '8px 0',
              background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#fff' : '#555',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 60 }}>Cargando datos...</div>
        ) : error ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 20, color: '#ef4444', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <>
            {tab === 'Dashboard' && <Dashboard transactions={transactions} debts={debts} />}
            {tab === 'Transacciones' && <Transacciones transactions={transactions} onRefresh={fetchAll} />}
            {tab === 'Presupuesto' && <Presupuesto budgets={budgets} transactions={transactions} onRefresh={fetchAll} />}
            {tab === 'Ahorros' && <Ahorros goals={goals} onRefresh={fetchAll} />}
            {tab === 'Deudas' && <Deudas debts={debts} onRefresh={fetchAll} />}
          </>
        )}
      </main>
    </div>
  )
}
