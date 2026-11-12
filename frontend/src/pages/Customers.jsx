import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useStore, uid } from '../store.jsx'
import { br, daysSince, TYPES, METHODS } from '../util.js'
import Modal, { Field } from '../components/Modal.jsx'

export default function Customers() {
  const { customers, act, create, toast, t } = useStore()
  const [q, setQ] = useState(''), [pay, setPay] = useState(null), [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState(''), [method, setMethod] = useState('CASH'), [f, setF] = useState({ name: '', phone: '', type: 'SHOP', creditLimit: '' })
  const list = customers.filter(c => (c.name + (c.phone || '')).toLowerCase().includes(q.toLowerCase()))

  async function receive() {
    if (!(+amount > 0)) return toast('Enter the amount received')
    try { await act('/payments', { clientId: uid(), customerId: pay.id, amount: +amount, method }); toast('Payment recorded'); setPay(null); setAmount('') } catch (e) { toast(e.message) }
  }
  async function add() {
    if (!f.name.trim()) return toast('Enter a name')
    try { await create('/customers', { ...f, creditLimit: +f.creditLimit || 0 }); setAdding(false); setF({ name: '', phone: '', type: 'SHOP', creditLimit: '' }); toast('Customer added') } catch (e) { toast(e.message) }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="search" style={{ flex: 1, maxWidth: 380 }}><Search size={18} /><input placeholder="Search customers" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" /></div>
        <button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} />{t('New customer')}</button>
      </div>
      <div className="card" style={{ padding: 6 }}>
        {list.length ? <table><thead><tr><th>Customer</th><th>Type</th><th className="r">Balance</th><th /></tr></thead><tbody>
          {list.map(c => (
            <tr key={c.id}>
              <td><b>{c.name}</b><div className="muted" style={{ fontSize: 12 }}>{c.phone}</div></td>
              <td className="muted">{TYPES[c.type]}</td>
              <td className="r">{c.balance > 0 ? <><span className="badge">owes {br(c.balance)}</span>{daysSince(c.oldestDebt) > 0 && <div className="muted" style={{ fontSize: 12 }}>{daysSince(c.oldestDebt)} days</div>}</> : <span className="badge ok">{c.balance < 0 ? 'advance ' + br(-c.balance) : 'clear'}</span>}</td>
              <td className="r"><button className="btn sm" onClick={() => { setPay(c); setAmount('') }}>{t('Receive payment')}</button></td>
            </tr>
          ))}
        </tbody></table> : <div className="empty">No customers found.</div>}
      </div>
      {pay && <Modal title={`${t('Receive payment')} · ${pay.name}`} onClose={() => setPay(null)}>
        <div className="muted">Balance now: <b>{br(pay.balance)}</b>. The payment clears the oldest debts first.</div>
        <Field label="Amount received"><input type="number" min="0" autoFocus value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        {pay.balance > 0 && <button className="btn sm" onClick={() => setAmount(String(pay.balance))}>Full balance {br(pay.balance)}</button>}
        <div className="chips">{METHODS.map(([k, v]) => <button key={k} className={'chip' + (method === k ? ' on' : '')} onClick={() => setMethod(k)}>{v}</button>)}</div>
        <button className="btn primary block" onClick={receive}>Save payment</button>
      </Modal>}
      {adding && <Modal title={t('New customer')} onClose={() => setAdding(false)}>
        <Field label="Name or shop name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Phone"><input type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Type"><select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Credit limit (0 = no limit)"><input type="number" min="0" value={f.creditLimit} onChange={e => setF({ ...f, creditLimit: e.target.value })} /></Field>
        <button className="btn primary block" onClick={add}>Add customer</button>
      </Modal>}
    </>
  )
}
