import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { br } from '../util.js'
import { eggsText } from './MyLoad.jsx'

const TYPES = [['', 'All'], ['SALE', 'Sales'], ['PAYMENT', 'Payments'], ['EXPENSE', 'Expenses'], ['PURCHASE', 'Purchases'], ['ISSUE', 'Stock given'], ['RETURN', 'Stock back']]
const SIGN = { SALE: '', PAYMENT: '+', EXPENSE: '−', PURCHASE: '−' }
const COLOR = { PAYMENT: 'var(--green)', EXPENSE: 'var(--red)', PURCHASE: 'var(--red)' }
const iso = d => d.toISOString().slice(0, 10)

/** Every sale, payment, expense, purchase and stock movement in one list, newest first. */
export default function Transactions() {
  const { api, online, isSales, toast, user } = useStore()
  const today = iso(new Date()), [from, setFrom] = useState(iso(new Date(Date.now() - 6 * 864e5))), [to, setTo] = useState(today)
  const [type, setType] = useState(''), [who, setWho] = useState(''), [staff, setStaff] = useState([]), [rows, setRows] = useState(null)

  useEffect(() => { if (online && !isSales) api('/users').then(setStaff).catch(() => {}) }, [online]) // eslint-disable-line
  useEffect(() => {
    if (!online) return
    let live = true
    const q = new URLSearchParams({ from, to }); if (type) q.set('type', type); if (who) q.set('userId', who)
    api('/transactions?' + q).then(r => live && setRows(r)).catch(e => live && toast(e.message))
    return () => { live = false }
  }, [online, from, to, type, who]) // eslint-disable-line

  if (!online) return <div className="card empty">The full history is kept on the server, so this screen needs a connection.</div>
  const money = rows?.filter(r => ['SALE', 'PAYMENT', 'EXPENSE', 'PURCHASE'].includes(r.kind)) || []
  const sum = k => money.filter(r => r.kind === k).reduce((a, r) => a + +r.amount, 0)
  return (
    <div className="stack">
      <div className="card stack">
        <div className="chips">{TYPES.map(([k, v]) => <button key={k} className={'chip' + (type === k ? ' on' : '')} onClick={() => setType(k)}>{v}</button>)}</div>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <label className="field" style={{ flex: 1, minWidth: 130 }}>From<input type="date" max={to} value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label className="field" style={{ flex: 1, minWidth: 130 }}>To<input type="date" min={from} max={today} value={to} onChange={e => setTo(e.target.value)} /></label>
          {!isSales && <label className="field" style={{ flex: 1, minWidth: 150 }}>Person<select value={who} onChange={e => setWho(e.target.value)}><option value="">Everyone</option>{staff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>}
        </div>
        {rows && <div className="row muted sm" style={{ flexWrap: 'wrap' }}><span>Sales {br(sum('SALE'))}</span><span>Received {br(sum('PAYMENT'))}</span><span>Expenses {br(sum('EXPENSE'))}</span><span>Purchases {br(sum('PURCHASE'))}</span></div>}
      </div>
      <div className="card" style={{ padding: 6, overflowX: 'auto' }}>
        {rows === null ? <div className="empty">Loading...</div> : !rows.length ? <div className="empty">Nothing recorded in these dates{user && isSales ? ' for you' : ''}.</div> :
          <table><thead><tr><th>When</th><th>What</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>
            {rows.map(r => {
              const eggs = r.kind === 'ISSUE' || r.kind === 'RETURN'
              return <tr key={r.kind + r.id + r.at}>
                <td className="sm" style={{ whiteSpace: 'nowrap' }}>{new Date(r.at).toLocaleDateString()}<div className="muted">{new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></td>
                <td><b>{r.title}</b><div className="muted sm">{TYPES.find(t => t[0] === r.kind)?.[1].replace(/s$/, '')}{r.detail ? ' · ' + r.detail : ''}{r.method ? ' · ' + r.method : ''}{r.userName ? ' · ' + r.userName : ''}</div></td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR[r.kind], whiteSpace: 'nowrap' }}>{eggs ? eggsText(r.amount) : (SIGN[r.kind] || '') + br(r.amount)}</td>
              </tr>
            })}
          </tbody></table>}
      </div>
    </div>
  )
}
