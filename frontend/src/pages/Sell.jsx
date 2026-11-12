import { useState } from 'react'
import { Minus, Plus, Trash2, Search, Printer } from 'lucide-react'
import { useStore, uid, ppt, trayPrice } from '../store.jsx'
import { br, METHODS } from '../util.js'
import Modal from '../components/Modal.jsx'

const stockText = p => { const n = +p.stock, tr = Math.floor(n / ppt(p)), e = Math.round(n % ppt(p)); return `${tr} ${tr === 1 ? 'tray' : 'trays'}${e ? ' + ' + e + ' eggs' : ''}` }

export default function Sell() {
  const { products, customers, cart, setCart, act, toast, t } = useStore()
  const [q, setQ] = useState(''), [cust, setCust] = useState(''), [disc, setDisc] = useState(''), [method, setMethod] = useState('CASH')
  const [paid, setPaid] = useState(null), [receipt, setReceipt] = useState(null), [busy, setBusy] = useState(false)
  const sub = cart.reduce((a, i) => a + i.price * i.qty, 0), total = Math.max(0, sub - (+disc || 0))
  const paidNow = paid === null ? total : Math.min(+paid || 0, total), owing = total - paidNow

  const add = p => setCart(c => { const i = c.find(x => x.id === p.id && x.unit === 'TRAY'); return i ? c.map(x => x === i ? { ...x, qty: x.qty + 1 } : x) : [...c, { id: p.id, name: p.name, unit: 'TRAY', ppt: ppt(p), qty: 1, price: trayPrice(p) }] })
  const patch = (i, o) => setCart(c => c.map((x, k) => k === i ? { ...x, ...o } : x))
  const setUnit = (i, unit) => { const x = cart[i], p = products.find(p => p.id === x.id); patch(i, { unit, price: unit === 'TRAY' ? trayPrice(p) : +p.sellingPrice }) }
  const bump = (i, d) => setCart(c => c.flatMap((x, k) => k !== i ? [x] : x.qty + d > 0 ? [{ ...x, qty: x.qty + d }] : []))

  async function finish() {
    if (!cart.length) return toast('Add at least one egg type')
    if (owing > 0 && !cust) return toast('Choose a customer to sell on credit')
    const body = { clientId: uid(), customerId: cust ? +cust : null, discount: +disc || 0, paid: paidNow, total, method, items: cart.map(i => ({ productId: i.id, unit: i.unit, qty: i.qty, price: i.price })) }
    setBusy(true)
    try {
      const r = await act('/sales', body)
      setReceipt({ no: body.clientId.slice(-6).toUpperCase(), lines: cart, total, paid: paidNow, owing, method, queued: !!r.queued, date: new Date(), customer: customers.find(c => c.id === +cust)?.name })
      setCart([]); setCust(''); setDisc(''); setPaid(null)
    } catch (e) { toast(e.message) } finally { setBusy(false) }
  }
  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="pos">
      <div>
        <div className="search"><Search size={18} /><input placeholder="Search egg type" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" /></div>
        <div className="prods">
          {list.map(p => (
            <button key={p.id} className={'prod' + (p.stock <= 0 ? ' out' : '')} onClick={() => add(p)}>
              <span className="egg" /><b>{p.name}</b><span className="price">{br(trayPrice(p))}<span className="muted" style={{ fontSize: 12, fontWeight: 600 }}> / tray</span></span>
              <span className="muted" style={{ fontSize: 12 }}>{br(p.sellingPrice)} each · {p.stock <= 0 ? 'Out of stock' : stockText(p) + ' left'}</span>
            </button>
          ))}
          {!list.length && <div className="card empty" style={{ gridColumn: '1/-1' }}>No egg types yet. Add one in Stock.</div>}
        </div>
      </div>
      <aside className="card cart">
        <div className="row"><h3 style={{ margin: 0 }}>{t('Cart')}</h3>{cart.length > 0 && <button className="btn sm" onClick={() => setCart([])}><Trash2 size={14} />Clear</button>}</div>
        {!cart.length && <div className="empty">Tap an egg type to add it.</div>}
        {cart.map((x, i) => (
          <div className="line" key={i}>
            <div className="row"><b>{x.name}</b><span className="qty"><button onClick={() => bump(i, -1)} aria-label="Less"><Minus size={14} /></button><b style={{ minWidth: 22, textAlign: 'center' }}>{x.qty}</b><button onClick={() => bump(i, 1)} aria-label="More"><Plus size={14} /></button></span></div>
            <div className="row" style={{ gap: 8 }}>
              <select value={x.unit} onChange={e => setUnit(i, e.target.value)} style={{ width: '45%' }}><option value="TRAY">Tray ({x.ppt})</option><option value="PIECE">Single egg</option></select>
              <input type="number" step="0.01" min="0" value={x.price} onChange={e => patch(i, { price: +e.target.value })} aria-label="Price" />
            </div>
          </div>
        ))}
        <label className="field">Customer<select value={cust} onChange={e => setCust(e.target.value)}><option value="">{t('Walk-in customer')}</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` (owes ${c.balance})` : ''}</option>)}</select></label>
        <div className="chips">{METHODS.map(([k, v]) => <button key={k} className={'chip' + (method === k ? ' on' : '')} onClick={() => setMethod(k)}>{v}</button>)}</div>
        <div className="row" style={{ gap: 10 }}>
          <label className="field" style={{ flex: 1 }}>{t('Discount')}<input type="number" min="0" value={disc} onChange={e => setDisc(e.target.value)} placeholder="0" /></label>
          <label className="field" style={{ flex: 1 }}>{t('Paid now')}<input type="number" min="0" value={paid === null ? total : paid} onChange={e => setPaid(e.target.value)} /></label>
        </div>
        <div className="totals">
          <div className="row muted"><span>Subtotal</span><span>{br(sub)}</span></div>
          <div className="row"><b>{t('Total')}</b><span className="big">{br(total)}</span></div>
          {owing > 0 && <div className="row"><span className="badge">Customer borrows</span><b>{br(owing)}</b></div>}
        </div>
        <button className="btn primary block" disabled={busy || !cart.length} onClick={finish}>{t('Complete sale')}</button>
      </aside>
      {receipt && (
        <Modal title="Sale complete" onClose={() => setReceipt(null)}>
          <div className="receipt">
            <b style={{ fontSize: 16 }}>EGG SALES · Receipt #{receipt.no}</b>
            <span>{receipt.date.toLocaleString()}{receipt.customer ? ' · ' + receipt.customer : ''}</span><hr />
            {receipt.lines.map((l, i) => <div className="row" key={i}><span>{l.qty} × {l.name} ({l.unit === 'TRAY' ? 'tray' : 'egg'}) @ {l.price}</span><span>{(l.qty * l.price).toFixed(2)}</span></div>)}<hr />
            <div className="row"><b>TOTAL</b><b>{br(receipt.total)}</b></div>
            <div className="row"><span>Paid ({receipt.method})</span><span>{br(receipt.paid)}</span></div>
            {receipt.owing > 0 && <div className="row"><b>Still owing</b><b>{br(receipt.owing)}</b></div>}
          </div>
          {receipt.queued && <div className="banner" style={{ margin: 0 }}>Saved on this device. It will sync when you are online.</div>}
          <div className="row"><button className="btn" onClick={() => window.print()}><Printer size={16} />Print</button><button className="btn primary" onClick={() => setReceipt(null)}>New sale</button></div>
        </Modal>
      )}
    </div>
  )
}
