import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { br, num, daysSince } from '../util.js'

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
  const { report: r0, delta: d, byProduct, customers, queue, t } = useStore()
  const r = r0 || { netSales: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, cashReceived: 0, creditGiven: 0, supplierPaid: 0 }
  const sales = +r.netSales + d.gross - d.disc, cogs = +r.cogs + d.cogs, gp = sales - cogs, exp = +r.expenses + d.exp
  const net = gp - exp, cash = +r.cashReceived + d.cash, credit = +r.creditGiven + d.credit
  const pc = Math.max(0, Math.min(100, (cash / (cash + credit || 1)) * 100))
  const netA = useCount(net)
  const debtors = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance)
  return (
    <>
      {queue.length > 0 && <div className="banner">{queue.length} entries are saved on this device and included below. They will go to the server when you are online.</div>}
      <section className="hero">
        <div className="greet">{greet(t)}</div>
        <small>{t('Net profit today')} · {t('after all expenses')}</small>
        <div className="big">{br(netA)}</div>
        <div className="quick"><button className="btn primary sm" onClick={() => go('Sell')}>{t('New sale')}</button><button className="btn glass sm" onClick={() => go('Customers')}>{t('Collect payment')}</button></div>
        <div className="big">{br(net)}</div>
        <div className="bar"><i style={{ width: pc + '%', background: '#3ddba5' }} /><i style={{ width: 100 - pc + '%', background: 'var(--brand)' }} /></div>
        <div className="legend">
          <div><span className="dot" style={{ background: '#3ddba5' }} />{t('Cash received')}<b>{br(cash)}</b></div>
          <div><span className="dot" style={{ background: 'var(--brand)' }} />{t('On credit')}<b>{br(credit)}</b></div>
        </div>
      </section>
      <div className="grid kpis">
        {[['Net sales', sales], ['Cost of eggs', cogs], ['Gross profit', gp], ['Expenses', exp], ['Paid to suppliers', +(r.supplierPaid || 0) + d.sup]].map(([k, v]) => (
          <div className="card kpi" key={k}><small>{t(k)}</small><div className="v">{br(v)}</div></div>
        ))}
      </div>
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
    </>
  )
}
