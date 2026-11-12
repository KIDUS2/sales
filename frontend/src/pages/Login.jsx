import { useEffect, useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { useStore } from '../store.jsx'
import Logo from '../components/Logo.jsx'
import { Field } from '../components/Modal.jsx'

export default function Login() {
  const { login, queue, toast, toastMsg } = useStore()
  const [setup, setSetup] = useState(false), [checked, setChecked] = useState(false)
  const [f, setF] = useState({ fullName: '', phone: '', password: '', confirm: '' }), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(s => setSetup(!!s.setupNeeded)).catch(() => {}).finally(() => setChecked(true))
  }, [])

  async function submit(e) {
    e.preventDefault(); setErr('')
    try {
      setBusy(true)
      if (setup) {
        if (!f.fullName.trim()) throw new Error('Enter your name')
        if (f.password.length < 8) throw new Error('The password needs at least 8 characters')
        if (f.password !== f.confirm) throw new Error('The two passwords do not match')
        const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: f.fullName, phone: f.phone, password: f.password }) })
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || 'Could not create the account')
      }
      await login(f.phone, f.password)
    } catch (e2) { setErr(e2.message === 'Failed to fetch' ? 'No connection to the server. Login needs internet.' : e2.message) } finally { setBusy(false) }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-brand"><Logo size={64} /><b>Laba</b><span className="muted">ላባ · Egg sales</span></div>
        <h2>{setup ? 'Create the owner account' : 'Sign in'}</h2>
        {setup && <p className="muted sm">No one has registered yet. The first account becomes the Owner (admin) and can add salespeople later.</p>}
        {setup && <Field label="Full name"><input value={f.fullName} onChange={set('fullName')} autoComplete="name" /></Field>}
        <Field label="Phone number"><input type="tel" inputMode="tel" placeholder="0912345678" value={f.phone} onChange={set('phone')} autoComplete="username" autoFocus /></Field>
        <Field label="Password"><input type="password" value={f.password} onChange={set('password')} autoComplete={setup ? 'new-password' : 'current-password'} /></Field>
        {setup && <Field label="Repeat the password"><input type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>}
        {err && <div className="banner" style={{ margin: 0, background: '#d1434318', borderColor: '#d1434355', color: 'var(--red)' }} role="alert">{err}</div>}
        {queue.length > 0 && <div className="banner" style={{ margin: 0 }}>{queue.length} saved {queue.length === 1 ? 'entry is' : 'entries are'} waiting. They will be sent after you sign in.</div>}
        <button className="btn primary block" disabled={busy || !checked}>{setup ? <UserPlus size={18} /> : <LogIn size={18} />}{busy ? 'Please wait...' : setup ? 'Create account' : 'Sign in'}</button>
      </form>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  )
}
