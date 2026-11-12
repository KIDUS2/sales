import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { T } from './i18n.js'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
export const ppt = p => p?.ppt || 30
export const trayPrice = p => +(p.trayPrice || p.sellingPrice * ppt(p))
export const pieces = (i, p) => (i.unit === 'TRAY' ? i.qty * ppt(p) : i.qty)

async function http(path, opt) {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opt })
  if (!r.ok) { const e = new Error((await r.json().catch(() => ({}))).message || 'Error ' + r.status); e.status = r.status; throw e }
  if (r.status === 204) return null
  return r.json()
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => load('products', []))
  const [customers, setCustomers] = useState(() => load('customers', []))
  const [report, setReport] = useState(() => load('report', null))
  const [byProduct, setByProduct] = useState(() => load('byProduct', []))
  const [queue, setQueue] = useState(() => load('queue', []))
  const [manual, setManual] = useState(() => load('manual', false))
  const [lang, setLang] = useState(() => load('lang', 'en'))
  const [netUp, setNetUp] = useState(navigator.onLine)
  const [serverUp, setServerUp] = useState(true)
  const [cart, setCart] = useState([])
  const [toastMsg, setToastMsg] = useState('')
  const queueRef = useRef(queue); queueRef.current = queue
  const syncing = useRef(false), timer = useRef()

  useEffect(() => {
    const s = { products, customers, report, byProduct, queue, manual, lang }
    for (const k in s) localStorage.setItem(k, JSON.stringify(s[k]))
  }, [products, customers, report, byProduct, queue, manual, lang])
  useEffect(() => {
    const on = () => setNetUp(true), off = () => setNetUp(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])

  const online = !manual && netUp && serverUp
  const t = useCallback(k => (lang === 'am' && T[k]) || k, [lang])
  const toast = useCallback(m => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(''), 3000) }, [])

  const refresh = useCallback(async () => {
    try {
      const [p, c, r, b] = await Promise.all([http('/products'), http('/customers'), http('/reports/daily'), http('/reports/products')])
      setProducts(p); setCustomers(c); setReport(r); setByProduct(b); setServerUp(true)
    } catch { setServerUp(false) }
  }, [])

  const sync = useCallback(async () => {
    if (syncing.current) return
    syncing.current = true; let done = 0
    try {
      for (const op of [...queueRef.current]) {
        try { await http(op.path, { method: 'POST', body: JSON.stringify(op.body) }); done++; setQueue(q => q.filter(x => x.id !== op.id)) }
        catch (e) {
          if (e.status && e.status < 500) { setQueue(q => q.filter(x => x.id !== op.id)); toast('Rejected: ' + e.message) }
          else { setServerUp(false); break }
        }
      }
    } finally { syncing.current = false }
    if (done) toast(done + (done === 1 ? ' entry' : ' entries') + ' saved to the server')
    await refresh()
  }, [refresh, toast])

  useEffect(() => { if (online) (queueRef.current.length ? sync() : refresh()) }, [online]) // eslint-disable-line
  useEffect(() => { const i = setInterval(() => { if (!manual && navigator.onLine && !syncing.current) refresh() }, 15000); return () => clearInterval(i) }, [manual, refresh])

  const send = async (path, body) => {
    if (online) {
      try { const r = await http(path, { method: 'POST', body: JSON.stringify(body) }); refresh(); return r }
      catch (e) { if (e.status && e.status < 500) throw e; setServerUp(false) }
    }
    setQueue(q => [...q, { id: body.clientId, path, body }])
    return { queued: true }
  }
  // keeps the screen numbers right while entries wait to be synced
  const applyLocal = (path, b) => {
    if (path === '/sales') {
      setProducts(ps => ps.map(p => { const ls = b.items.filter(i => i.productId === p.id); return ls.length ? { ...p, stock: p.stock - ls.reduce((a, i) => a + pieces(i, p), 0) } : p }))
      if (b.customerId) setCustomers(cs => cs.map(c => c.id === b.customerId ? { ...c, balance: +c.balance + Math.max(0, b.total - b.paid) } : c))
    }
    if (path === '/payments') setCustomers(cs => cs.map(c => c.id === b.customerId ? { ...c, balance: +c.balance - b.amount } : c))
    if (path === '/purchases') setProducts(ps => ps.map(p => { if (p.id !== b.productId) return p; const pc = b.trays * ppt(p), base = Math.max(+p.stock, 0); return { ...p, cost: (base * p.cost + b.trays * b.costPerTray) / (base + pc), stock: +p.stock + pc } }))
    if (path === '/adjustments') setProducts(ps => ps.map(p => p.id === b.productId ? { ...p, stock: p.stock - b.pieces } : p))
  }
  const act = async (path, body) => { const r = await send(path, body); if (r.queued) applyLocal(path, body); return r }
  const api = async (path, method = 'GET', body) => { if (!online) throw new Error('This screen needs a connection to the server.'); return http(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }) }
  const create = async (path, body) => { if (!online) throw new Error('Adding this needs a connection. Add it before going offline.'); const r = await http(path, { method: 'POST', body: JSON.stringify(body) }); await refresh(); return r }

  const delta = useMemo(() => {
    const d = { gross: 0, cogs: 0, disc: 0, cash: 0, credit: 0, exp: 0, sup: 0 }
    for (const o of queue) {
      const b = o.body
      if (o.path === '/sales') {
        let g = 0, c = 0
        for (const i of b.items) { g += i.price * i.qty; const p = products.find(p => p.id === i.productId); c += (p ? +p.cost : 0) * pieces(i, p) }
        d.gross += g; d.cogs += c; d.disc += b.discount || 0; d.cash += b.paid || 0; d.credit += Math.max(0, g - (b.discount || 0) - (b.paid || 0))
      }
      if (o.path === '/payments') d.cash += b.amount
      if (o.path === '/expenses') d.exp += b.amount
      if (o.path === '/purchases') d.sup += b.paid
      if (o.path === '/adjustments') { const p = products.find(p => p.id === b.productId); d.exp += (p ? +p.cost : 0) * b.pieces }
    }
    return d
  }, [queue, products])

  const value = { products, customers, report, byProduct, queue, delta, manual, setManual, lang, setLang, online, cart, setCart, t, toast, toastMsg, sync, refresh, act, create, api }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
