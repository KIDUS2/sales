import { useState } from 'react'
import { useStore, uid } from '../store.jsx'
import { br } from '../util.js'
import { Field } from '../components/Modal.jsx'

const CATS = ['Transport', 'Rent', 'Salary', 'Electricity', 'Trays and packaging', 'Bad debt', 'Other']

export default function Expenses() {
  const { report, delta, act, toast, t } = useStore()
  const [cat, setCat] = useState('Transport'), [amount, setAmount] = useState(''), [note, setNote] = useState('')
  async function save() {
    if (!(+amount > 0)) return toast('Enter an amount')
    try { await act('/expenses', { clientId: uid(), category: cat, amount: +amount, note }); setAmount(''); setNote(''); toast('Expense saved') } catch (e) { toast(e.message) }
  }
  const lines = report?.expenseList || []
  return (
    <div className="grid two" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)' }}>
      <div className="card stack">
        <h3>Record an expense</h3>
        <div className="chips">{CATS.map(c => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
        <Field label="Amount"><input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field label="Note (optional)"><input value={note} onChange={e => setNote(e.target.value)} /></Field>
        <button className="btn primary block" onClick={save}>{t('Save expense')}</button>
      </div>
      <div className="card">
        <h3>Today by category</h3>
        {lines.map(e => <div className="row" key={e.category} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}><span>{e.category}</span><b>{br(e.amount)}</b></div>)}
        {!lines.length && <div className="empty">No expenses on the server yet today.</div>}
        {delta.exp > 0 && <div className="banner" style={{ marginTop: 12 }}>+ {br(delta.exp)} saved on this device, not yet synced.</div>}
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Broken and spoiled eggs are added here automatically from Stock.</p>
      </div>
    </div>
  )
}
