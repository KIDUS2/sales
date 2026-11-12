import { useState } from 'react'
import { PackagePlus, AlertTriangle, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useStore, uid, ppt, trayPrice } from '../store.jsx'
import { br, num } from '../util.js'
import Modal, { Field } from '../components/Modal.jsx'

const trays = p => { const n = Math.max(0, +p.stock), tr = Math.floor(n / ppt(p)), e = Math.round(n % ppt(p)); return `${tr} trays${e ? ' + ' + e + ' eggs' : ''}` }

export default function Stock() {
  const { products, act, create, api, refresh, toast, t } = useStore()
  const [modal, setModal] = useState(null), [f, setF] = useState({}), [q, setQ] = useState('')
  const open = (m, init = {}) => { setF({ productId: products[0]?.id, ...init }); setModal(m) }
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const done = m => { setModal(null); toast(m) }
  const run = fn => async () => { try { await fn() } catch (e) { toast(e.message) } }

  const cost = products.reduce((a, p) => a + Math.max(0, p.stock) * p.cost, 0)
  const retail = products.reduce((a, p) => a + (Math.max(0, p.stock) * trayPrice(p)) / ppt(p), 0)
  const eggs = products.reduce((a, p) => a + Math.max(0, +p.stock) / ppt(p), 0)
  const low = products.filter(p => p.stock > 0 && p.stock < ppt(p) * 2).length, out = products.filter(p => p.stock <= 0).length
  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))

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
    await create('/products', { name: f.name, sellingPrice: +f.sell || 0, trayPrice: +f.tray || null, costPerTray: +f.cost || 0, trays: +f.trays || 0, perTray: +f.per || 30 }); done('Product added')
  })
  const edit = run(async () => {
    if (!f.name?.trim()) return toast('Enter a name')
    await api('/products/' + f.id, 'PUT', { name: f.name, sellingPrice: +f.sell || 0, trayPrice: +f.tray || null, perTray: +f.per || null }); await refresh(); done('Product updated')
  })
  const remove = run(async () => { await api('/products/' + f.id, 'DELETE'); await refresh(); done('Product removed') })
  const productPick = <Field label="Egg type"><select value={f.productId} onChange={set('productId')}>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
  const kpis = [['Stock on hand', num(eggs) + ' trays'], ['Value at cost', br(cost)], ['Value at selling price', br(retail)], ['Possible profit', br(retail - cost)], ['Low / out of stock', low + ' / ' + out]]

  return (
    <>
      <div className="grid kpis" style={{ marginTop: 0 }}>{kpis.map(([k, v]) => <div className="card kpi" key={k}><small>{k}</small><div className="v">{v}</div></div>)}</div>
      <div className="row" style={{ margin: '4px 0 14px', flexWrap: 'wrap' }}>
        <div className="search" style={{ minWidth: 200, maxWidth: 360 }}><Search size={18} /><input placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" /></div>
        <div className="chips">
          <button className="btn primary" onClick={() => open('type', { per: 30 })}><Plus size={16} />Add product</button>
          <button className="btn" disabled={!products.length} onClick={() => open('receive')}><PackagePlus size={16} />{t('Receive eggs')}</button>
          <button className="btn" disabled={!products.length} onClick={() => open('loss', { reason: 'Broken eggs' })}><AlertTriangle size={16} />{t('Record loss')}</button>
        </div>
      </div>
      <div className="card" style={{ padding: 6, overflowX: 'auto' }}>
        {list.length ? <table><thead><tr><th>Product</th><th className="r">Buy / tray</th><th className="r">Sell / tray</th><th className="r">Margin</th><th className="r">In stock</th><th className="r">Value</th><th /></tr></thead><tbody>
          {list.map(p => {
            const c = p.cost * ppt(p), s = trayPrice(p)
            return <tr key={p.id}><td><b>{p.name}</b><div className="muted sm">{ppt(p)} eggs per tray · {br(p.sellingPrice)} each</div></td><td className="r">{num(c)}</td><td className="r">{num(s)}</td>
              <td className="r"><span className={'badge ' + (s - c > 0 ? 'ok' : 'bad')}>{num(s - c)}</span></td>
              <td className="r"><b>{trays(p)}</b>{p.stock < ppt(p) * 2 && <div><span className="badge bad">{p.stock <= 0 ? 'Out' : 'Low'}</span></div>}</td>
              <td className="r">{num(Math.max(0, p.stock) * p.cost)}</td>
              <td><div className="acts">
                <button className="btn sm icon" aria-label={'Edit ' + p.name} onClick={() => open('edit', { id: p.id, name: p.name, tray: p.trayPrice || '', sell: p.sellingPrice, per: ppt(p) })}><Pencil size={15} /></button>
                <button className="btn sm icon" aria-label={'Remove ' + p.name} onClick={() => open('delete', { id: p.id, name: p.name, left: trays(p) })}><Trash2 size={15} /></button>
              </div></td></tr>
          })}
        </tbody></table> : <div className="empty">{products.length ? 'No product matches your search.' : 'Add your first product to start.'}</div>}
      </div>
      {modal === 'receive' && <Modal title={t('Receive eggs')} onClose={() => setModal(null)}>{productPick}
        <Field label="Supplier or farm (optional)"><input value={f.supplier || ''} onChange={set('supplier')} /></Field>
        <div className="row" style={{ gap: 10 }}><Field label="Trays received"><input type="number" inputMode="decimal" min="0" value={f.trays || ''} onChange={set('trays')} /></Field><Field label="Price per tray"><input type="number" inputMode="decimal" min="0" value={f.cost || ''} onChange={set('cost')} /></Field></div>
        <Field label="Paid now (empty = paid in full)"><input type="number" inputMode="decimal" min="0" value={f.paid ?? ''} onChange={set('paid')} /></Field>
        {+f.trays > 0 && +f.cost > 0 && <div className="muted">Total {br(f.trays * f.cost)}</div>}
        <button className="btn primary block" onClick={receive}>Add to stock</button></Modal>}
      {modal === 'loss' && <Modal title={t('Record loss')} onClose={() => setModal(null)}>{productPick}
        <Field label="Number of eggs"><input type="number" inputMode="numeric" min="0" value={f.pieces || ''} onChange={set('pieces')} /></Field>
        <Field label="Reason"><select value={f.reason} onChange={set('reason')}><option>Broken eggs</option><option>Spoiled eggs</option><option>Eggs given away</option></select></Field>
        <div className="muted">The cost of these eggs is counted as an expense.</div>
        <button className="btn primary block" onClick={lose}>Record loss</button></Modal>}
      {modal === 'type' && <Modal title="Add product" onClose={() => setModal(null)}>
        <Field label="Name (e.g. Large white, Local)"><input value={f.name || ''} onChange={set('name')} autoFocus /></Field>
        <div className="row" style={{ gap: 10 }}><Field label="Price per tray"><input type="number" inputMode="decimal" value={f.tray || ''} onChange={set('tray')} /></Field><Field label="Price per single egg"><input type="number" inputMode="decimal" step="0.01" value={f.sell || ''} onChange={set('sell')} /></Field></div>
        <div className="row" style={{ gap: 10 }}><Field label="Buying price per tray"><input type="number" inputMode="decimal" value={f.cost || ''} onChange={set('cost')} /></Field><Field label="Trays in stock now"><input type="number" inputMode="decimal" value={f.trays || ''} onChange={set('trays')} /></Field></div>
        <Field label="Eggs per tray"><input type="number" inputMode="numeric" value={f.per || ''} onChange={set('per')} /></Field>
        <button className="btn primary block" onClick={addType}>Add product</button></Modal>}
      {modal === 'edit' && <Modal title={'Edit ' + f.name} onClose={() => setModal(null)}>
        <Field label="Name"><input value={f.name || ''} onChange={set('name')} /></Field>
        <div className="row" style={{ gap: 10 }}><Field label="Price per tray"><input type="number" inputMode="decimal" value={f.tray || ''} onChange={set('tray')} /></Field><Field label="Price per single egg"><input type="number" inputMode="decimal" step="0.01" value={f.sell || ''} onChange={set('sell')} /></Field></div>
        <Field label="Eggs per tray"><input type="number" inputMode="numeric" value={f.per || ''} onChange={set('per')} /></Field>
        <div className="muted sm">Stock and buying price change only when you receive eggs or record a loss. Old sales keep the prices they were sold at.</div>
        <button className="btn primary block" onClick={edit}>Save changes</button></Modal>}
      {modal === 'delete' && <Modal title="Remove product" onClose={() => setModal(null)}>
        <p>Remove <b>{f.name}</b> from the shop? It stops showing in Sell and Stock. Old sales and reports keep it. Stock left: {f.left}.</p>
        <div className="row"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={remove}>Remove</button></div></Modal>}
    </>
  )
}
