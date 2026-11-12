import { useStore } from '../store.jsx'
import { br, qtyText } from '../util.js'


/** The salesperson's own stock: what they were given, what is sold, what is left, and the cash they hold. */
export default function MyLoad({ go }) {
  const { loads, user } = useStore()
  const open = loads.find(l => l.status === 'OPEN'), past = loads.filter(l => l.status !== 'OPEN').slice(0, 5)
  return (
    <div className="stack">
      <h3 style={{ fontSize: 20 }}>Hello, {user?.fullName}</h3>
      {!open && <div className="card empty">You have no stock right now. Ask the admin to give you a load, then it will appear here.</div>}
      {open && <>
        <div className="grid kpis" style={{ margin: 0 }}>
          <div className="card kpi"><small>Sales made</small><div className="v">{br(open.totals.salesTotal)}</div></div>
          <div className="card kpi"><small>Cash collected</small><div className="v">{br(open.totals.cashCollected)}</div></div>
          <div className="card kpi"><small>Trip expenses</small><div className="v">{br(open.totals.tripExpenses)}</div></div>
          <div className="card kpi"><small>Cash to hand over</small><div className="v">{br(open.totals.cashExpected)}</div></div>
        </div>
        {+open.totals.creditGiven > 0 && <div className="banner" style={{ margin: 0 }}>{br(open.totals.creditGiven)} was sold on credit. That money is not in your cash.</div>}
        <div className="card" style={{ padding: 6, overflowX: 'auto' }}>
          <table><thead><tr><th>Product</th><th>Given</th><th>Sold</th><th>Left</th></tr></thead><tbody>
            {open.items.map(i => <tr key={i.productId}><td><b>{i.name}</b></td><td>{qtyText(i.issued, i)}</td><td>{qtyText(i.sold, i)}</td><td><b>{qtyText(i.remaining, i)}</b></td></tr>)}
          </tbody></table>
        </div>
        <div className="acts" style={{ justifyContent: 'stretch' }}><button className="btn primary" style={{ flex: 1 }} onClick={() => go('Sell')}>Start selling</button><button className="btn" style={{ flex: 1 }} onClick={() => go('Expenses')}>Add expense</button></div>
        <p className="muted sm">Prices are set by the admin. When you finish, give the cash and the unsold stock to the admin, who closes the load.</p>
      </>}
      {past.length > 0 && <div className="card"><h3>Earlier loads</h3>
        {past.map(l => <div className="row" key={l.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}><span>#{l.id} · {new Date(l.openedAt).toLocaleDateString()}</span><span className="muted">Sold {br(l.totals.salesTotal)}</span></div>)}
      </div>}
    </div>
  )
}
