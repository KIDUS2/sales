import { useEffect, useState } from 'react'
import { PackagePlus, PackageCheck } from 'lucide-react'
import { useStore } from '../store.jsx'
import { br } from '../util.js'
import Modal, { Field } from '../components/Modal.jsx'
import { eggsText } from './MyLoad.jsx'

const blank = () => ({ productId: '', unit: 'TRAY', qty: '' })

/** Admin: give eggs to a salesperson, then close the load when they come back. */
export default function Loads() {
  const { api, online, products, refresh, toast } = useStore()
  const [loads, setLoads] = useState(null), [staff, setStaff] = useState([]), [modal, setModal] = useState(null), [busy, setBusy] = useState(false)
  const [sp, setSp] = useState(''), [lines, setLines] = useState([blank()]), [note, setNote] = useState('')
  const [close, setClose] = useState({}), [counted, setCounted] = useState('')

  const load = () => api('/dispatches').then(setLoads).catch(e => toast(e.message))
  useEffect(() => { if (online) { load(); api('/users').then(u => setStaff(u.filter(x => x.role === 'CASHIER' && x.active))).catch(() => {}) } }, [online]) // eslint-disable-line
  if (!online) return <div className="card empty">Giving out and closing loads changes the stock, so this screen needs a connection.</div>

  const run = (fn, msg) => async () => { setBusy(true); try { await fn(); setModal(null); toast(msg); await load(); await refresh() } catch (e) { toast(e.message) } finally { setBusy(false) } }
  const setLine = (i, o) => setLines(ls => ls.map((l, k) => (k === i ? { ...l, ...o } : l)))
  const per = id => products.find(p => p.id === +id)?.ppt || 30

  const openIssue = () => { setSp(staff[0]?.id || ''); setLines([blank()]); setNote(''); setModal({ m: 'issue' }) }
  const issue = run(async () => {
    const items = lines.filter(l => l.productId && +l.qty > 0).map(l => ({ productId: +l.productId, unit: l.unit, qty: +l.qty }))
    if (!sp) throw new Error('Choose the salesperson. Add them in Users first if the list is empty.')
    if (!items.length) throw new Error('Add at least one egg type and a quantity')
    await api('/dispatches', 'POST', { salespersonId: +sp, note: note || null, items })
  }, 'Stock given')

  const openClose = l => {
    setClose(Object.fromEntries(l.items.map(i => [i.productId, { returned: String(Math.max(0, +i.remaining)), broken: '' }])))
    setCounted(String(Math.max(0, +l.totals.cashExpected))); setModal({ m: 'close', l })
  }
  const closeLoad = run(async () => {
    const l = modal.l
    const items = l.items.map(i => ({ productId: i.productId, returned: +close[i.productId].returned || 0, broken: +close[i.productId].broken || 0 }))
    if (counted === '') throw new Error('Enter the cash you received')
    await api(`/dispatches/${l.id}/close`, 'POST', { cashCounted: +counted, items })
  }, 'Load closed. Unsold eggs are back in stock.')

  const open = loads?.filter(l => l.status === 'OPEN') || [], done = loads?.filter(l => l.status !== 'OPEN') || []
  const Card = ({ l }) => (
    <div className="card stack">
      <div className="row"><div><b>{l.salespersonName}</b> <span className={'badge ' + (l.status === 'OPEN' ? '' : 'ok')}>{l.status === 'OPEN' ? 'Out selling' : 'Closed'}</span><div className="muted sm">Load #{l.id} · {new Date(l.openedAt).toLocaleString()}</div></div>
        {l.status === 'OPEN' && <button className="btn primary sm" onClick={() => openClose(l)}><PackageCheck size={16} />Close load</button>}</div>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Egg type</th><th>Given</th><th>Sold</th><th>{l.status === 'OPEN' ? 'Left' : 'Back'}</th><th>Broken</th></tr></thead><tbody>
        {l.items.map(i => <tr key={i.productId}><td><b>{i.name}</b></td><td>{eggsText(i.issued, i.piecesPerTray)}</td><td>{eggsText(i.sold, i.piecesPerTray)}</td><td>{eggsText(l.status === 'OPEN' ? i.remaining : i.returned, i.piecesPerTray)}</td><td>{+i.broken || '-'}</td></tr>)}
      </tbody></table></div>
      <div className="row muted sm" style={{ flexWrap: 'wrap' }}><span>Sales {br(l.totals.salesTotal)}</span><span>On credit {br(l.totals.creditGiven)}</span><span>Cash {br(l.totals.cashCollected)}</span><span>Mobile/bank {br(l.totals.otherCollected)}</span><span>Trip expenses {br(l.totals.tripExpenses)}</span></div>
      <div className="row"><b>Cash to receive</b><b>{br(l.totals.cashExpected)}</b></div>
      {l.status !== 'OPEN' && <div className="row sm"><span className="muted">Cash counted {br(l.cashCounted)}</span>
        {(() => { const d = (+l.cashCounted || 0) - +l.totals.cashExpected; return Math.abs(d) < 0.5 ? <span className="badge ok">Cash matches</span> : <span className="badge bad">{d < 0 ? 'Short ' : 'Over '}{br(Math.abs(d))}</span> })()}
        {+l.totals.lossCost > 0 && <span className="muted">Broken/missing eggs cost {br(l.totals.lossCost)}</span>}</div>}
    </div>
  )

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <p className="muted" style={{ flex: 1 }}>Give eggs to a salesperson. They sell at your prices. When they return, close the load: unsold eggs go back to stock.</p>
        <button className="btn primary" onClick={openIssue}><PackagePlus size={16} />Give stock</button>
      </div>
      {loads === null && <div className="card empty">Loading...</div>}
      {loads && !open.length && <div className="card empty">No one is out selling right now.</div>}
      {open.map(l => <Card key={l.id} l={l} />)}
      {done.length > 0 && <h3 style={{ marginTop: 8 }}>Closed loads</h3>}
      {done.map(l => <Card key={l.id} l={l} />)}

      {modal?.m === 'issue' && <Modal title="Give stock to a salesperson" onClose={() => setModal(null)}>
        <Field label="Salesperson"><select value={sp} onChange={e => setSp(e.target.value)}><option value="">Choose...</option>{staff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></Field>
        {lines.map((l, i) => {
          const p = products.find(p => p.id === +l.productId)
          return <div key={i} className="stack" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 8 }}>
              <select value={l.productId} onChange={e => setLine(i, { productId: e.target.value })} style={{ flex: 2 }} aria-label="Egg type"><option value="">Egg type...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <select value={l.unit} onChange={e => setLine(i, { unit: e.target.value })} style={{ flex: 1 }} aria-label="Unit"><option value="TRAY">Trays</option><option value="PIECE">Eggs</option></select>
              <input type="number" inputMode="decimal" min="0" placeholder="Qty" value={l.qty} onChange={e => setLine(i, { qty: e.target.value })} style={{ flex: 1, minWidth: 0 }} aria-label="Quantity" />
            </div>
            {p && <span className="muted sm">In warehouse: {eggsText(p.stock, p.ppt)}</span>}
          </div>
        })}
        <button className="btn sm" onClick={() => setLines(ls => [...ls, blank()])}>+ Another egg type</button>
        <Field label="Note (optional)"><input value={note} onChange={e => setNote(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy} onClick={issue}>Give stock</button>
      </Modal>}

      {modal?.m === 'close' && <Modal title={`Close load #${modal.l.id}`} onClose={() => setModal(null)}>
        <p className="muted sm">Count what {modal.l.salespersonName} brought back. Numbers are single eggs ({'1 tray = 30'}). Anything not accounted for is booked as missing eggs, an expense at cost.</p>
        {modal.l.items.map(i => {
          const c = close[i.productId] || { returned: '', broken: '' }, miss = +i.remaining - (+c.returned || 0) - (+c.broken || 0)
          return <div key={i.productId} className="stack" style={{ gap: 6 }}>
            <div className="row"><b>{i.name}</b><span className="muted sm">Left in load: {+i.remaining} eggs ({eggsText(i.remaining, i.piecesPerTray)})</span></div>
            <div className="row" style={{ gap: 8 }}>
              <label className="field" style={{ flex: 1 }}>Returned eggs<input type="number" inputMode="numeric" min="0" value={c.returned} onChange={e => setClose({ ...close, [i.productId]: { ...c, returned: e.target.value } })} /></label>
              <label className="field" style={{ flex: 1 }}>Broken eggs<input type="number" inputMode="numeric" min="0" value={c.broken} onChange={e => setClose({ ...close, [i.productId]: { ...c, broken: e.target.value } })} /></label>
            </div>
            {miss !== 0 && <span className={'badge ' + (miss > 0 ? 'bad' : '')} style={{ justifySelf: 'start' }}>{miss > 0 ? `${miss} eggs missing` : `${-miss} more than the load has`}</span>}
          </div>
        })}
        <div className="row muted sm"><span>Cash the system expects</span><b>{br(modal.l.totals.cashExpected)}</b></div>
        <Field label="Cash you received"><input type="number" inputMode="decimal" min="0" value={counted} onChange={e => setCounted(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy} onClick={closeLoad}>Close load</button>
      </Modal>}
    </div>
  )
}
