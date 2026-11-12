import { useEffect, useState } from 'react'
import { Printer, Download } from 'lucide-react'
import { useStore } from '../store.jsx'
import { br, num, daysSince } from '../util.js'
import ReportSections, { exportCsv } from '../components/ReportSections.jsx'

const iso = d => d.toLocaleDateString('en-CA')
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const PRESETS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Pick dates']]
function rangeOf(key) {
  const now = new Date()
  if (key === 'today') return [iso(now), iso(now)]
  if (key === 'yesterday') { const y = iso(addDays(now, -1)); return [y, y] }
  if (key === '30') return [iso(addDays(now, -29)), iso(now)]
  if (key === 'month') return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), iso(now)]
  return [iso(addDays(now, -6)), iso(now)]
}
const greet = t => { const h = new Date().getHours(); return t(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') }
function useCount(v) {
  const [x, setX] = useState(v)
  useEffect(() => {
    const from = x, s = performance.now(); let f
    const step = n => { const k = Math.min(1, (n - s) / 600); setX(from + (v - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) f = requestAnimationFrame(step) }
    f = requestAnimationFrame(step); return () => cancelAnimationFrame(f)
  }, [v]) // eslint-disable-line
  return x
}

export default function Dashboard({ go }) {
  const { report: r0, delta: d, byProduct, customers, queue, t, api, online, toast } = useStore()
  const [key, setKey] = useState('today'), [[from, to], setRange] = useState(rangeOf('today')), [r, setR] = useState(null)
  const isToday = key === 'today'

  useEffect(() => {
    if (!online || !from || !to) return
    let live = true
    api(`/reports/summary?from=${from}&to=${to}`).then(x => live && setR(x)).catch(e => live && toast(e.message))
    return () => { live = false }
  }, [from, to, online, r0]) // eslint-disable-line  (r0 changes after every sync and refresh)
  const pick = k => { setKey(k); if (k !== 'custom') setRange(rangeOf(k)) }

  const stale = !r || r.from !== from || r.to !== to
  const tt = stale ? null : r.totals
  const base = r0 || {}
  // Today also counts entries saved on this device and not yet synced. Other periods come from the server.
  const n = isToday
    ? { sales: +(base.netSales || 0) + d.gross - d.disc, cogs: +(base.cogs || 0) + d.cogs, exp: +(base.expenses || 0) + d.exp, cash: +(base.cashReceived || 0) + d.cash, credit: +(base.creditGiven || 0) + d.credit, sup: +(base.supplierPaid || 0) + d.sup }
    : tt ? { sales: +tt.netSales, cogs: +tt.cogs, exp: +tt.expenses, cash: +tt.cashReceived, credit: +tt.creditGiven, sup: +tt.supplierPaid }
      : { sales: 0, cogs: 0, exp: 0, cash: 0, credit: 0, sup: 0 }
  const gp = n.sales - n.cogs, net = gp - n.exp, netA = useCount(net)
  const pc = Math.max(0, Math.min(100, (n.cash / (n.cash + n.credit || 1)) * 100))
  const debtors = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance)
  const period = key === 'today' ? '' : key === 'yesterday' ? 'Yesterday' : from === to ? from : `${from} to ${to}`
  const kpis = [['Net sales', br(n.sales)], ['Cost of eggs', br(n.cogs)], ['Gross profit', br(gp), tt && tt.marginPct + '% margin'], ['Expenses', br(n.exp)], ['Paid to suppliers', br(n.sup)],
    ...(tt ? [['Sales made', tt.salesCount, 'avg ' + br(tt.avgSale)]] : [])]

  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="scroll" style={{ padding: 0 }}>{PRESETS.map(([k, v]) => <button key={k} className={'chip' + (key === k ? ' on' : '')} onClick={() => pick(k)}>{t(v)}</button>)}</div>
        <div className="acts">
          <button className="btn sm" disabled={stale} onClick={() => exportCsv(r)}><Download size={15} />CSV</button>
          <button className="btn sm" onClick={() => window.print()}><Printer size={15} />Print</button>
        </div>
      </div>
      {key === 'custom' && <div className="row" style={{ gap: 10, marginBottom: 14 }}>
        <label className="field" style={{ flex: 1 }}>From<input type="date" value={from} max={to} onChange={e => setRange([e.target.value, to])} /></label>
        <label className="field" style={{ flex: 1 }}>To<input type="date" value={to} min={from} onChange={e => setRange([from, e.target.value])} /></label>
      </div>}
      {isToday && queue.length > 0 && <div className="banner">{queue.length} entries are saved on this device and included below. They will go to the server when you are online.</div>}

      <div className="printarea" style={{ opacity: !isToday && online && stale ? .6 : 1 }}>
        <section className="hero">
          <div className="greet">{greet(t)}</div>
          <small>{t(isToday ? 'Net profit today' : 'Net profit')}{period ? ' · ' + period : ''} · {t('after all expenses')}</small>
          <div className="big">{br(netA)}</div>
          <div className="quick"><button className="btn primary sm" onClick={() => go('Sell')}>{t('New sale')}</button><button className="btn glass sm" onClick={() => go('Customers')}>{t('Collect payment')}</button></div>
          <div className="bar"><i style={{ width: pc + '%', background: '#3ddba5' }} /><i style={{ width: 100 - pc + '%', background: 'var(--brand)' }} /></div>
          <div className="legend">
            <div><span className="dot" style={{ background: '#3ddba5' }} />{t('Cash received')}<b>{br(n.cash)}</b></div>
            <div><span className="dot" style={{ background: 'var(--brand)' }} />{t('On credit')}<b>{br(n.credit)}</b></div>
          </div>
        </section>
        <div className="grid kpis">
          {kpis.map(([k, v, s]) => <div className="card kpi" key={k}><small>{t(k)}</small><div className="v">{v}</div>{s && <div className="muted sm">{s}</div>}</div>)}
        </div>

        {online && r && !stale ? <ReportSections r={r} />
          : isToday ? (
            <div className="grid two">
              <div className="card"><h3>{t('Sales by product')}</h3>
                {byProduct.length ? <table><thead><tr><th>Eggs</th><th className="r">Sold</th><th className="r">Cost</th><th className="r">Profit</th></tr></thead><tbody>
                  {byProduct.map(p => <tr key={p.name}><td><b>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{num(p.qty)} eggs · {num(p.qty / 30)} trays</div></td><td className="r">{num(p.revenue)}</td><td className="r">{num(p.cost)}</td><td className="r"><b>{num(p.profit)}</b></td></tr>)}
                </tbody></table> : <div className="empty">No sales yet today.<br /><button className="btn primary sm" style={{ marginTop: 12 }} onClick={() => go('Sell')}>Record the first sale</button></div>}
              </div>
              <div className="card"><h3>{t('Owed to you')}</h3>
                {debtors.length ? debtors.map(c => <div className="row" key={c.id} style={{ padding: '9px 0' }}><div><b>{c.name}</b>{daysSince(c.oldestDebt) > 0 && <div className="muted" style={{ fontSize: 12 }}>{daysSince(c.oldestDebt)} days</div>}</div><b>{br(c.balance)}</b></div>) : <div className="empty">Nobody owes you right now.</div>}
              </div>
            </div>
          ) : <div className="card empty">{online ? 'Loading report...' : 'Reports for other dates are calculated on the server, so they need a connection. Choose Today to see your saved numbers.'}</div>}
      </div>
    </>
  )
}
