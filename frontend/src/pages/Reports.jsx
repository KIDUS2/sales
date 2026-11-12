import { useEffect, useMemo, useState } from 'react'
import { Printer, Download } from 'lucide-react'
import { useStore } from '../store.jsx'
import { br, num, METHODS } from '../util.js'

const iso = d => d.toLocaleDateString('en-CA')
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const PRESETS = [['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Pick dates']]
const methodName = k => (METHODS.find(m => m[0] === k) || [k, k])[1]

function rangeOf(key) {
  const now = new Date()
  if (key === 'today') return [iso(now), iso(now)]
  if (key === '30') return [iso(addDays(now, -29)), iso(now)]
  if (key === 'month') return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(now)]
  return [iso(addDays(now, -6)), iso(now)]
}

function Chart({ days }) {
  const W = 640, H = 190, top = 14, bot = 26, h = H - top - bot
  const vals = days.flatMap(d => [+d.netSales, +d.profit]), max = Math.max(1, ...vals), min = Math.min(0, ...vals)
  const y = v => top + ((max - v) / (max - min || 1)) * h, y0 = y(0), step = W / Math.max(1, days.length), bw = Math.max(2, Math.min(18, step * 0.34))
  const label = d => d.slice(5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net sales and profit for each day" style={{ width: '100%', height: 'auto' }}>
      <line x1="0" x2={W} y1={y0} y2={y0} stroke="var(--line)" />
      {days.map((d, i) => {
        const cx = step * i + step / 2, s = +d.netSales, p = +d.profit
        return (
          <g key={d.date}>
            <rect x={cx - bw - 1} width={bw} y={Math.min(y(s), y0)} height={Math.abs(y(s) - y0)} rx="2" fill="var(--brand)"><title>{`${d.date}\nNet sales ${num(s)}`}</title></rect>
            <rect x={cx + 1} width={bw} y={Math.min(y(p), y0)} height={Math.abs(y(p) - y0)} rx="2" fill={p >= 0 ? 'var(--green)' : 'var(--red)'}><title>{`${d.date}\nProfit ${num(p)}`}</title></rect>
          </g>
        )
      })}
      <text x="0" y={H - 8} fontSize="11" fill="var(--mute)">{days[0] && label(days[0].date)}</text>
      <text x={W} y={H - 8} fontSize="11" fill="var(--mute)" textAnchor="end">{days.length > 1 && label(days[days.length - 1].date)}</text>
    </svg>
  )
}

function download(name, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

export default function Reports() {
  const { api, online, toast } = useStore()
  const [key, setKey] = useState('7'), [[from, to], setRange] = useState(rangeOf('7')), [r, setR] = useState(null), [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!online || !from || !to) return
    let live = true
    setLoading(true)
    api(`/reports/summary?from=${from}&to=${to}`).then(d => live && setR(d)).catch(e => toast(e.message)).finally(() => live && setLoading(false))
    return () => { live = false }
  }, [from, to, online]) // eslint-disable-line
  const pick = k => { setKey(k); if (k !== 'custom') setRange(rangeOf(k)) }
  const expTotal = useMemo(() => (r?.expenses || []).reduce((a, e) => a + +e.amount, 0), [r])

  function exportCsv() {
    const t = r.totals
    download(`laba-${r.from}_to_${r.to}.csv`, [
      ['Laba report', r.from, r.to], [],
      ['Summary'], ['Net sales', t.netSales], ['Cost of eggs', t.cogs], ['Gross profit', t.grossProfit], ['Expenses', t.expenses], ['Net profit', t.netProfit], ['Cash received', t.cashReceived], ['Credit given', t.creditGiven], [],
      ['Day', 'Net sales', 'Cost of eggs', 'Expenses', 'Profit'], ...r.days.map(d => [d.date, d.netSales, d.cogs, d.expenses, d.profit]), [],
      ['Product', 'Eggs', 'Sold', 'Cost', 'Profit'], ...r.products.map(p => [p.name, p.qty, p.revenue, p.cost, p.profit]), [],
      ['Customer', 'Orders', 'Total', 'Paid', 'Owing'], ...r.customers.map(c => [c.name, c.orders, c.total, c.paid, c.owing]), [],
      ['Expense', 'Amount'], ...r.expenses.map(e => [e.category, e.amount]), [],
      ['Owes now', 'Phone', '0-30 days', '31-60 days', 'Over 60 days', 'Total'], ...r.debts.map(d => [d.name, d.phone, d.current, d.days31to60, d.over60, d.total]),
    ])
  }

  if (!online) return <div className="card empty">Detailed reports are calculated on the server, so this screen needs a connection. The Today screen still shows your saved numbers.</div>
  const t = r?.totals
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="scroll" style={{ padding: 0 }}>{PRESETS.map(([k, v]) => <button key={k} className={'chip' + (key === k ? ' on' : '')} onClick={() => pick(k)}>{v}</button>)}</div>
        <div className="acts">
          <button className="btn sm" disabled={!r} onClick={exportCsv}><Download size={15} />CSV</button>
          <button className="btn sm" disabled={!r} onClick={() => window.print()}><Printer size={15} />Print</button>
        </div>
      </div>
      {key === 'custom' && <div className="row" style={{ gap: 10, marginBottom: 14 }}>
        <label className="field" style={{ flex: 1 }}>From<input type="date" value={from} max={to} onChange={e => setRange([e.target.value, to])} /></label>
        <label className="field" style={{ flex: 1 }}>To<input type="date" value={to} min={from} onChange={e => setRange([from, e.target.value])} /></label>
      </div>}
      {!r ? <div className="card empty">{loading ? 'Loading report...' : 'No data.'}</div> : (
        <div className="printarea" style={{ opacity: loading ? .6 : 1 }}>
          <h3 style={{ marginBottom: 10 }}>Laba report · {r.from === r.to ? r.from : `${r.from} to ${r.to}`}</h3>
          <div className="grid kpis" style={{ marginTop: 0 }}>
            {[['Net sales', br(t.netSales)], ['Gross profit', br(t.grossProfit), t.marginPct + '% margin'], ['Expenses', br(t.expenses)], ['Net profit', br(t.netProfit)],
              ['Sales made', t.salesCount, 'avg ' + br(t.avgSale)], ['Cash received', br(t.cashReceived)], ['Given on credit', br(t.creditGiven)], ['Paid to suppliers', br(t.supplierPaid)], ['Discounts', br(t.discounts)]].map(([k, v, s]) => (
              <div className="card kpi" key={k}><small>{k}</small><div className="v" style={k === 'Net profit' ? { color: +t.netProfit >= 0 ? 'var(--green)' : 'var(--red)' } : undefined}>{v}</div>{s && <div className="muted sm">{s}</div>}</div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="row"><h3>Day by day</h3><span className="muted sm"><span className="dot" style={{ background: 'var(--brand)' }} />Net sales <span className="dot" style={{ background: 'var(--green)', marginLeft: 10 }} />Profit</span></div>
            <Chart days={r.days} />
          </div>
          <div className="card" style={{ marginBottom: 14, overflowX: 'auto' }}><h3>Sales by product</h3>
            {r.products.length ? <table><thead><tr><th>Product</th><th className="r">Eggs</th><th className="r">Sold</th><th className="r">Cost</th><th className="r">Profit</th><th className="r">Margin</th></tr></thead><tbody>
              {r.products.map(p => <tr key={p.name}><td><b>{p.name}</b></td><td className="r">{num(p.qty)}<div className="muted sm">{num(p.qty / 30)} trays</div></td><td className="r">{num(p.revenue)}</td><td className="r">{num(p.cost)}</td><td className="r"><b>{num(p.profit)}</b></td><td className="r">{+p.revenue ? Math.round((p.profit / p.revenue) * 100) : 0}%</td></tr>)}
            </tbody></table> : <div className="empty">No sales in this period.</div>}
          </div>
          <div className="grid two" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', marginBottom: 14 }}>
            <div className="card" style={{ overflowX: 'auto' }}><h3>Sales by customer</h3>
              {r.customers.length ? <table><thead><tr><th>Customer</th><th className="r">Orders</th><th className="r">Total</th><th className="r">Owing</th></tr></thead><tbody>
                {r.customers.map(c => <tr key={c.name}><td>{c.name}</td><td className="r">{c.orders}</td><td className="r">{num(c.total)}</td><td className="r">{+c.owing > 0 ? <span className="badge">{num(c.owing)}</span> : '-'}</td></tr>)}
              </tbody></table> : <div className="empty">No sales in this period.</div>}</div>
            <div className="card"><h3>Expenses by category</h3>
              {r.expenses.length ? r.expenses.map(e => <div key={e.category} style={{ padding: '8px 0' }}><div className="row"><span>{e.category}</span><b>{br(e.amount)}</b></div><div className="stockbar"><i style={{ width: (expTotal ? (e.amount / expTotal) * 100 : 0) + '%', background: 'var(--brand)' }} /></div></div>) : <div className="empty">No expenses in this period.</div>}</div>
          </div>
          <div className="grid two" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
            <div className="card"><h3>Money received by method</h3>
              {r.methods.length ? r.methods.map(m => <div className="row" key={m.method} style={{ padding: '8px 0' }}><span>{methodName(m.method)}</span><b>{br(m.amount)}</b></div>) : <div className="empty">No payments in this period.</div>}</div>
            <div className="card" style={{ overflowX: 'auto' }}><h3>Who owes you now</h3>
              {r.debts.length ? <table><thead><tr><th>Customer</th><th className="r">0-30</th><th className="r">31-60</th><th className="r">60+</th><th className="r">Total</th></tr></thead><tbody>
                {r.debts.map(d => <tr key={d.name + d.phone}><td>{d.name}</td><td className="r">{num(d.current)}</td><td className="r">{num(d.days31to60)}</td><td className="r">{+d.over60 > 0 ? <span className="badge bad">{num(d.over60)}</span> : '-'}</td><td className="r"><b>{num(d.total)}</b></td></tr>)}
              </tbody></table> : <div className="empty">Nobody owes you right now.</div>}</div>
          </div>
        </div>
      )}
    </>
  )
}
