import { useState } from 'react'
import { PackagePlus, AlertTriangle, Plus } from 'lucide-react'
import { useStore, uid, ppt, trayPrice } from '../store.jsx'
import { br, num } from '../util.js'
import Modal, { Field } from '../components/Modal.jsx'

export default function Stock() {
  const { products, act, create, toast, t } = useStore()
  const [modal, setModal] = useState(null), [f, setF] = useState({})
  const open = (m, init = {}) => { setF({ productId: products[0]?.id, ...init }); setModal(m) }
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const done = m => { setModal(null); toast(m) }
  const run = fn => async () => { try { await fn() } catch (e) { toast(e.message) } }

  const receive = run(async () => {
    const tr = +f.trays, c = +f.cost
    if (!f.productId || !(tr > 0) || !(c > 0)) return toast('Enter the trays and the price per tray')
    await act('/purchases', { clientId: uid(), productId: +f.productId, supplier: f.supplier, trays: tr, costPerTray: c, paid: f.paid === undefined || f.paid === '' ? tr * c : +f.paid }); done('Stock added')
  })
  const lose = run(async () => {
    if (!f.productId || !(+f.pieces > 0)) return toast('Enter the number of eggs')
    await act('/adjustments', { clientId: uid(), productId: +f.productId, pieces: +f.pieces, reason: f.reason || 'Broken eggs' }); done('Loss recorded')
  })
  const addType = run(async () => {
    if (!f.name?.trim()) return toast('Enter a name')
    await create('/products', { name: f.name, sellingPrice: +f.sell || 0, trayPrice: +f.tray || null, costPerTray: +f.cost || 0, trays: +f.trays || 0, perTray: +f.per || 30 }); done('Egg type added')
  })
  const productPick = <Field label="Egg type"><select value={f.productId} onChange={set('productId')}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
  return (
    <>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="chips">
          <button className="btn primary" disabled={!products.length} onClick={() => open('receive')}><PackagePlus size={16} />{t('Receive eggs')}</button>
          <button className="btn" disabled={!products.length} onClick={() => open('loss', { reason: 'Broken eggs' })}><AlertTriangle size={16} />{t('Record loss')}</button>
        </div>
        <button className="btn" onClick={() => open('type', { per: 30 })}><Plus size={16} />New egg type</button>
      </div>
      <div className="card" style={{ padding: 6 }}>
        {products.length ? <table><thead><tr><th>Egg type</th><th className="r">Buy / tray</th><th className="r">Sell / tray</th><th className="r">Margin</th><th className="r">In stock</th></tr></thead><tbody>
          {products.map(p => {
            const cost = p.cost * ppt(p), sell = trayPrice(p), tr = Math.floor(p.stock / ppt(p)), e = Math.round(p.stock % ppt(p))
            return <tr key={p.id}><td><b>{p.name}</b></td><td className="r">{num(cost)}</td><td className="r">{num(sell)}</td>
              <td className="r"><span className={'badge ' + (sell - cost > 0 ? 'ok' : 'bad')}>{num(sell - cost)}</span></td>
              <td className="r"><b>{tr} trays{e ? ' + ' + e : ''}</b>{p.stock < ppt(p) * 2 && <div><span className="badge bad">{p.stock <= 0 ? 'Out' : 'Low'}</span></div>}</td></tr>
          })}
        </tbody></table> : <div className="empty">Add your first egg type to start.</div>}
      </div>
      {modal === 'receive' && <Modal title={t('Receive eggs')} onClose={() => setModal(null)}>{productPick}
        <Field label="Supplier or farm (optional)"><input value={f.supplier || ''} onChange={set('supplier')} /></Field>
        <div className="row" style={{ gap: 10 }}><Field label="Trays received"><input type="number" min="0" value={f.trays || ''} onChange={set('trays')} /></Field><Field label="Price per tray"><input type="number" min="0" value={f.cost || ''} onChange={set('cost')} /></Field></div>
        <Field label="Paid now (empty = paid in full)"><input type="number" min="0" value={f.paid ?? ''} onChange={set('paid')} /></Field>
        {+f.trays > 0 && +f.cost > 0 && <div className="muted">Total {br(f.trays * f.cost)}</div>}
        <button className="btn primary block" onClick={receive}>Add to stock</button></Modal>}
      {modal === 'loss' && <Modal title={t('Record loss')} onClose={() => setModal(null)}>{productPick}
        <Field label="Number of eggs"><input type="number" min="0" value={f.pieces || ''} onChange={set('pieces')} /></Field>
        <Field label="Reason"><select value={f.reason} onChange={set('reason')}><option>Broken eggs</option><option>Spoiled eggs</option><option>Eggs given away</option></select></Field>
        <div className="muted">The cost of these eggs is counted as an expense.</div>
        <button className="btn primary block" onClick={lose}>Record loss</button></Modal>}
      {modal === 'type' && <Modal title="New egg type" onClose={() => setModal(null)}>
        <Field label="Name (e.g. Large white, Local)"><input value={f.name || ''} onChange={set('name')} /></Field>
        <div className="row" style={{ gap: 10 }}><Field label="Price per tray"><input type="number" value={f.tray || ''} onChange={set('tray')} /></Field><Field label="Price per single egg"><input type="number" step="0.01" value={f.sell || ''} onChange={set('sell')} /></Field></div>
        <div className="row" style={{ gap: 10 }}><Field label="Buying price per tray"><input type="number" value={f.cost || ''} onChange={set('cost')} /></Field><Field label="Trays in stock now"><input type="number" value={f.trays || ''} onChange={set('trays')} /></Field></div>
        <Field label="Eggs per tray"><input type="number" value={f.per || ''} onChange={set('per')} /></Field>
        <button className="btn primary block" onClick={addType}>Add egg type</button></Modal>}
    </>
  )
}
