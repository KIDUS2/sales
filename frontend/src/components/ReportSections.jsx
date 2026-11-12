import { useMemo } from 'react'
import { br, num, METHODS } from '../util.js'

const methodName = k => (METHODS.find(m => m[0] === k) || [k, k])[1]

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


export function exportCsv(r) {
    const t = r.totals
    download(`laba-${r.from}_to_${r.to}.csv`, [
      ['Laba report', r.from, r.to], [],
      ['Summary'], ['Net sales', t.netSales], ['Cost of goods', t.cogs], ['Gross profit', t.grossProfit], ['Expenses', t.expenses], ['Net profit', t.netProfit], ['Cash received', t.cashReceived], ['Credit given', t.creditGiven], [],
      ['Day', 'Net sales', 'Cost of goods', 'Expenses', 'Profit'], ...r.days.map(d => [d.date, d.netSales, d.cogs, d.expenses, d.profit]), [],
      ['Product', 'Quantity', 'Sold', 'Cost', 'Profit'], ...r.products.map(p => [p.name, p.qty, p.revenue, p.cost, p.profit]), [],
      ['Customer', 'Orders', 'Total', 'Paid', 'Owing'], ...r.customers.map(c => [c.name, c.orders, c.total, c.paid, c.owing]), [],
      ['Expense', 'Amount'], ...r.expenses.map(e => [e.category, e.amount]), [],
      ['Owes now', 'Phone', '0-30 days', '31-60 days', 'Over 60 days', 'Total'], ...r.debts.map(d => [d.name, d.phone, d.current, d.days31to60, d.over60, d.total]),
    ])
  }
/** Chart and detail tables for one date range (the server's RangeReport). */
export default function ReportSections({ r }) {
  const expTotal = useMemo(() => (r.expenses || []).reduce((a, e) => a + +e.amount, 0), [r])
  return (
    <>
{r.days.length > 1 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="row"><h3>Day by day</h3><span className="muted sm"><span className="dot" style={{ background: 'var(--brand)' }} />Net sales <span className="dot" style={{ background: 'var(--green)', marginLeft: 10 }} />Profit</span></div>
            <Chart days={r.days} />
          </div>
)}
          <div className="card" style={{ marginBottom: 14, overflowX: 'auto' }}><h3>Sales by product</h3>
            {r.products.length ? <table><thead><tr><th>Product</th><th className="r">Quantity</th><th className="r">Sold</th><th className="r">Cost</th><th className="r">Profit</th><th className="r">Margin</th></tr></thead><tbody>
              {r.products.map(p => <tr key={p.name}><td><b>{p.name}</b></td><td className="r">{num(p.qty)}</td><td className="r">{num(p.revenue)}</td><td className="r">{num(p.cost)}</td><td className="r"><b>{num(p.profit)}</b></td><td className="r">{+p.revenue ? Math.round((p.profit / p.revenue) * 100) : 0}%</td></tr>)}
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
    </>
  )
}
