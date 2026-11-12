import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { T } from './i18n.js'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
export const ppt = p => p?.ppt || 1   // single items per pack; 1 = this product has no pack
export const trayPrice = p => +(p.trayPrice || p.sellingPrice * ppt(p))
export const pieces = (i, p) => (i.unit === 'TRAY' ? i.qty * ppt(p) : i.qty)

let authToken = load('token', null)
async function http(path, opt) {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}) }, ...opt })
  if (!r.ok) { const e = new Error((await r.json().catch(() => ({}))).message || 'Error ' + r.status); e.status = r.status; throw e }
  if (r.status === 204) return null
  return r.json()
}

export function StoreProvider({ children }) {
  const [token, setTokenState] = useState(authToken)
  const [user, setUser] = useState(() => load('user', null))
  const [loads, setLoads] = useState(() => load('loads', []))
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
    const s = { products, customers, report, byProduct, queue, manual, lang, loads, user, token }
    for (const k in s) localStorage.setItem(k, JSON.stringify(s[k]))
  }, [products, customers, report, byProduct, queue, manual, lang, loads, user, token])
  useEffect(() => {
    const on = () => setNetUp(true), off = () => setNetUp(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])

  const setToken = v => { authToken = v; setTokenState(v) }
  const isSales = user?.role === 'CASHIER'
  // 401 = the login ran out. Go back to the login screen but KEEP the saved entries: they are sent after the next login.
  const lostLogin = () => { setToken(null) }
  const online = !manual && netUp && serverUp
  const t = useCallback(k => (lang === 'am' && T[k]) || k, [lang])
  const toast = useCallback(m => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(''), 3000) }, [])

  const refresh = useCallback(async () => {
    if (!authToken) return
    try {
      if (user?.role === 'CASHIER') {
        // a salesperson sells only what is in their open load, so the stock they see is what is left in it
        const [p, c, l] = await Promise.all([http('/products'), http('/customers'), http('/dispatches/mine')])
        const open = l.find(x => x.status === 'OPEN')
        setProducts(open ? p.filter(x => open.items.some(i => i.productId === x.id)).map(x => ({ ...x, cost: 0, stock: +open.items.find(i => i.productId === x.id).remaining })) : [])
        setCustomers(c); setLoads(l)
      } else {
        const [p, c, r, b] = await Promise.all([http('/products'), http('/customers'), http('/reports/daily'), http('/reports/products')])
        setProducts(p); setCustomers(c); setReport(r); setByProduct(b)
      }
      setServerUp(true)
    } catch (e) { if (e.status === 401) lostLogin(); else setServerUp(false) }
  }, [user?.role]) // eslint-disable-line

  const sync = useCallback(async () => {
    if (syncing.current) return
    syncing.current = true; let done = 0
    try {
      // entries are sent only by the person who made them
      for (const op of queueRef.current.filter(o => !o.uid || o.uid === user?.id)) {
        try { await http(op.path, { method: 'POST', body: JSON.stringify(op.body) }); done++; setQueue(q => q.filter(x => x.id !== op.id)) }
        catch (e) {
          if (e.status === 401) { lostLogin(); break }
          if (e.status && e.status < 500) { setQueue(q => q.filter(x => x.id !== op.id)); toast('Rejected: ' + e.message) }
          else { setServerUp(false); break }
        }
      }
    } finally { syncing.current = false }
    if (done) toast(done + (done === 1 ? ' entry' : ' entries') + ' saved to the server')
    await refresh()
  }, [refresh, toast, user?.id])

  useEffect(() => { if (online && token) (queueRef.current.length ? sync() : refresh()) }, [online, token]) // eslint-disable-line
  useEffect(() => { const i = setInterval(() => { if (token && !manual && navigator.onLine && !syncing.current) refresh() }, 15000); return () => clearInterval(i) }, [manual, refresh, token])

  const send = async (path, body) => {
    if (online) {
      try { const r = await http(path, { method: 'POST', body: JSON.stringify(body) }); refresh(); return r }
      catch (e) { if (e.status === 401) { lostLogin(); throw e }; if (e.status && e.status < 500) throw e; setServerUp(false) }
    }
    setQueue(q => [...q, { id: body.clientId, path, body, uid: user?.id }])
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

  const login = async (phone, password) => {
    const r = await http('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) })
    if (r.user.id !== user?.id) { setProducts([]); setCustomers([]); setReport(null); setByProduct([]); setLoads([]) }   // never show the previous person's numbers
    setUser(r.user); setToken(r.token)
  }
  const logout = async () => { try { await http('/auth/logout', { method: 'POST' }) } catch { /* offline: the token simply expires */ } setToken(null) }
  const value = { token, user, isSales, loads, login, logout, products, customers, report, byProduct, queue, delta, manual, setManual, lang, setLang, online, cart, setCart, t, toast, toastMsg, sync, refresh, act, create, api }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
