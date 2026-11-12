import { useState } from 'react'
import { Minus, Plus, Trash2, Search, Printer, Share2, MessageSquare, ShoppingBag, X } from 'lucide-react'
import { Minus, Plus, Trash2, Search, Printer } from 'lucide-react'
import { useStore, uid, ppt, trayPrice } from '../store.jsx'
import { br, METHODS } from '../util.js'
import Modal from '../components/Modal.jsx'

const SHELLS = ['#f4e6c8', '#e9bd8c', '#f8f1e4', '#dba46d']
const shell = name => SHELLS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % SHELLS.length]
const stockText = p => { const n = +p.stock, tr = Math.floor(n / ppt(p)), e = Math.round(n % ppt(p)); return `${tr} ${tr === 1 ? 'tray' : 'trays'}${e ? ' + ' + e + ' eggs' : ''}` }
const stateOf = p => (p.stock <= 0 ? 'out' : p.stock < ppt(p) * 2 ? 'low' : 'in')
const FILTERS = [['all', 'All'], ['in', 'In stock'], ['low', 'Low'], ['out', 'Out']]

function receiptText(r) {
  const lines = r.lines.map(l => `${l.qty} x ${l.name} (${l.unit === 'TRAY' ? 'tray' : 'egg'}) @ ${l.price} = ${(l.qty * l.price).toFixed(2)}`)
  return ['Egg Sales - Receipt #' + r.no, r.date.toLocaleString(), '', ...lines, '', 'Total: ' + br(r.total), 'Paid (' + r.method + '): ' + br(r.paid),
    ...(r.owing > 0 ? ['Still owing: ' + br(r.owing)] : []), '', 'Thank you for buying from us! አመሰግናለሁ'].join('\n')
}

export default function Sell() {
  const { products, customers, cart, setCart, act, toast, t } = useStore()
  const [q, setQ] = useState(''), [filter, setFilter] = useState('all'), [open, setOpen] = useState(false)
  const [cust, setCust] = useState(''), [disc, setDisc] = useState(''), [method, setMethod] = useState('CASH')
  const [q, setQ] = useState(''), [cust, setCust] = useState(''), [disc, setDisc] = useState(''), [method, setMethod] = useState('CASH')
  const [paid, setPaid] = useState(null), [receipt, setReceipt] = useState(null), [busy, setBusy] = useState(false)
  const sub = cart.reduce((a, i) => a + i.price * i.qty, 0), total = Math.max(0, sub - (+disc || 0))
  const paidNow = paid === null ? total : Math.min(+paid || 0, total), owing = total - paidNow
  const maxStock = Math.max(1, ...products.map(p => +p.stock))
  const count = cart.reduce((a, i) => a + i.qty, 0)

  const add = p => setCart(c => { const i = c.find(x => x.id === p.id && x.unit === 'TRAY'); return i ? c.map(x => x === i ? { ...x, qty: x.qty + 1 } : x) : [...c, { id: p.id, name: p.name, unit: 'TRAY', ppt: ppt(p), qty: 1, price: trayPrice(p) }] })
  const patch = (i, o) => setCart(c => c.map((x, k) => k === i ? { ...x, ...o } : x))
  const add = (p, unit = 'TRAY') => setCart(c => {
    const i = c.find(x => x.id === p.id && x.unit === unit)
    return i ? c.map(x => (x === i ? { ...x, qty: x.qty + 1 } : x)) : [...c, { id: p.id, name: p.name, unit, ppt: ppt(p), qty: 1, price: unit === 'TRAY' ? trayPrice(p) : +p.sellingPrice }]
  })
  const patch = (i, o) => setCart(c => c.map((x, k) => (k === i ? { ...x, ...o } : x)))
  const setUnit = (i, unit) => { const x = cart[i], p = products.find(p => p.id === x.id); patch(i, { unit, price: unit === 'TRAY' ? trayPrice(p) : +p.sellingPrice }) }
  const bump = (i, d) => setCart(c => c.flatMap((x, k) => k !== i ? [x] : x.qty + d > 0 ? [{ ...x, qty: x.qty + d }] : []))
  const bump = (i, d) => setCart(c => c.flatMap((x, k) => (k !== i ? [x] : x.qty + d > 0 ? [{ ...x, qty: x.qty + d }] : [])))

  async function finish() {
    if (!cart.length) return toast('Add at least one egg type')
    if (owing > 0 && !cust) return toast('Choose a customer to sell on credit')
    const body = { clientId: uid(), customerId: cust ? +cust : null, discount: +disc || 0, paid: paidNow, total, method, items: cart.map(i => ({ productId: i.id, unit: i.unit, qty: i.qty, price: i.price })) }
    setBusy(true)
    try {
      const r = await act('/sales', body)
      setReceipt({ no: body.clientId.slice(-6).toUpperCase(), lines: cart, total, paid: paidNow, owing, method, queued: !!r.queued, date: new Date(), customer: customers.find(c => c.id === +cust)?.name })
      setCart([]); setCust(''); setDisc(''); setPaid(null)
      const c = customers.find(c => c.id === +cust)
      setReceipt({ no: body.clientId.slice(-6).toUpperCase(), lines: cart, total, paid: paidNow, owing, method, queued: !!r.queued, date: new Date(), customer: c?.name, phone: c?.phone })
      setCart([]); setCust(''); setDisc(''); setPaid(null); setOpen(false)
    } catch (e) { toast(e.message) } finally { setBusy(false) }
  }
  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  async function share() {
    const text = receiptText(receipt)
    try { if (navigator.share) await navigator.share({ title: 'Receipt', text }); else { await navigator.clipboard.writeText(text); toast('Receipt copied. Paste it in Telegram or SMS.') } } catch { /* cancelled */ }
  }

  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) && (filter === 'all' || stateOf(p) === filter))
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
        <div className="scroll">{FILTERS.map(([k, v]) => <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{v}</button>)}</div>
        <div className="prods" style={{ marginTop: 10 }}>
          {list.map(p => {
            const s = stateOf(p)
            return (
              <div key={p.id} className={'prod ' + s}>
                <button className="prod-main" onClick={() => add(p, 'TRAY')} aria-label={`Add a tray of ${p.name}`}>
                  <span className="shell" style={{ '--shell': shell(p.name) }} />
                  <b>{p.name}</b>
                  <span className="price">{br(trayPrice(p))}<small> / tray</small></span>
                  <span className="stockbar"><i data-s={s} style={{ width: Math.max(3, Math.min(100, (p.stock / maxStock) * 100)) + '%' }} /></span>
                  <span className="muted sm">{s === 'out' ? 'Out of stock' : stockText(p) + ' left'}</span>
                </button>
                <button className="prod-egg" onClick={() => add(p, 'PIECE')}>+ 1 egg · {br(p.sellingPrice)}</button>
              </div>
            )
          })}
          {!list.length && <div className="card empty" style={{ gridColumn: '1/-1' }}>No egg types found. Add one in Stock.</div>}
        </div>
      </div>
      <aside className="card cart">
        <div className="row"><h3 style={{ margin: 0 }}>{t('Cart')}</h3>{cart.length > 0 && <button className="btn sm" onClick={() => setCart([])}><Trash2 size={14} />Clear</button>}</div>

      {cart.length > 0 && !open && <button className="cartbar" onClick={() => setOpen(true)}><span><ShoppingBag size={18} style={{ verticalAlign: -3 }} /> {count} in cart</span><span>{br(total)} · View</span></button>}
      <div className={'backdrop' + (open ? ' show' : '')} onClick={() => setOpen(false)} />
      <aside className={'card cart' + (open ? ' open' : '')}>
        <div className="row"><h3 style={{ margin: 0 }}>{t('Cart')}</h3>
          <span className="acts">{cart.length > 0 && <button className="btn sm" onClick={() => setCart([])}><Trash2 size={14} />Clear</button>}<button className="btn sm icon sheet-x" onClick={() => setOpen(false)} aria-label="Close cart"><X size={16} /></button></span></div>
        {!cart.length && <div className="empty">Tap an egg type to add it.</div>}
        {cart.map((x, i) => (
          <div className="line" key={i}>
            <div className="row"><b>{x.name}</b><span className="qty"><button onClick={() => bump(i, -1)} aria-label="Less"><Minus size={14} /></button><b style={{ minWidth: 22, textAlign: 'center' }}>{x.qty}</b><button onClick={() => bump(i, 1)} aria-label="More"><Plus size={14} /></button></span></div>
            <div className="row"><b>{x.name}</b><span className="qty"><button onClick={() => bump(i, -1)} aria-label="Less"><Minus size={14} /></button><b style={{ minWidth: 24, textAlign: 'center' }}>{x.qty}</b><button onClick={() => bump(i, 1)} aria-label="More"><Plus size={14} /></button></span></div>
            <div className="row" style={{ gap: 8 }}>
              <select value={x.unit} onChange={e => setUnit(i, e.target.value)} style={{ width: '45%' }}><option value="TRAY">Tray ({x.ppt})</option><option value="PIECE">Single egg</option></select>
              <input type="number" step="0.01" min="0" value={x.price} onChange={e => patch(i, { price: +e.target.value })} aria-label="Price" />
              <select value={x.unit} onChange={e => setUnit(i, e.target.value)} style={{ width: '46%' }}><option value="TRAY">Tray ({x.ppt})</option><option value="PIECE">Single egg</option></select>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={x.price} onChange={e => patch(i, { price: +e.target.value })} aria-label="Price" />
            </div>
          </div>
        ))}
        <label className="field">Customer<select value={cust} onChange={e => setCust(e.target.value)}><option value="">{t('Walk-in customer')}</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` (owes ${c.balance})` : ''}</option>)}</select></label>
        <div className="chips">{METHODS.map(([k, v]) => <button key={k} className={'chip' + (method === k ? ' on' : '')} onClick={() => setMethod(k)}>{v}</button>)}</div>
        <div className="row" style={{ gap: 10 }}>
          <label className="field" style={{ flex: 1 }}>{t('Discount')}<input type="number" min="0" value={disc} onChange={e => setDisc(e.target.value)} placeholder="0" /></label>
          <label className="field" style={{ flex: 1 }}>{t('Paid now')}<input type="number" min="0" value={paid === null ? total : paid} onChange={e => setPaid(e.target.value)} /></label>
          <label className="field" style={{ flex: 1 }}>{t('Discount')}<input type="number" inputMode="decimal" min="0" value={disc} onChange={e => setDisc(e.target.value)} placeholder="0" /></label>
          <label className="field" style={{ flex: 1 }}>{t('Paid now')}<input type="number" inputMode="decimal" min="0" value={paid === null ? total : paid} onChange={e => setPaid(e.target.value)} /></label>
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
          <div className="thanks"><div className="tick"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div><b style={{ marginTop: 10 }}>Thank you{receipt.customer ? ', ' + receipt.customer : ''}!</b><span className="muted">አመሰግናለሁ · We appreciate your business</span></div>
          <div className="receipt">
            <b style={{ fontSize: 16 }}>EGG SALES · Receipt #{receipt.no}</b>
            <span>{receipt.date.toLocaleString()}{receipt.customer ? ' · ' + receipt.customer : ''}</span><hr />
            <b style={{ fontSize: 15 }}>EGG SALES · #{receipt.no}</b>
            <span>{receipt.date.toLocaleString()}</span><hr />
            {receipt.lines.map((l, i) => <div className="row" key={i}><span>{l.qty} × {l.name} ({l.unit === 'TRAY' ? 'tray' : 'egg'}) @ {l.price}</span><span>{(l.qty * l.price).toFixed(2)}</span></div>)}<hr />
            <div className="row"><b>TOTAL</b><b>{br(receipt.total)}</b></div>
            <div className="row"><span>Paid ({receipt.method})</span><span>{br(receipt.paid)}</span></div>
            {receipt.owing > 0 && <div className="row"><b>Still owing</b><b>{br(receipt.owing)}</b></div>}
          </div>
          {receipt.queued && <div className="banner" style={{ margin: 0 }}>Saved on this device. It will sync when you are online.</div>}
          <div className="row"><button className="btn" onClick={() => window.print()}><Printer size={16} />Print</button><button className="btn primary" onClick={() => setReceipt(null)}>New sale</button></div>
          <div className="acts" style={{ justifyContent: 'stretch' }}>
            <button className="btn" onClick={share}><Share2 size={16} />Share</button>
            {receipt.phone && <a className="btn" href={`sms:${receipt.phone}?&body=${encodeURIComponent(receiptText(receipt))}`}><MessageSquare size={16} />SMS</a>}
            <button className="btn" onClick={() => window.print()}><Printer size={16} />Print</button>
          </div>
          <button className="btn primary block" onClick={() => setReceipt(null)}>New sale</button>
        </Modal>
      )}
    </div>
  )
}
