import { useEffect, useState } from 'react'
import { UserPlus, Pencil, KeyRound, Power, Trash2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import Modal, { Field } from '../components/Modal.jsx'

const ROLES = { OWNER: 'Owner', MANAGER: 'Manager', CASHIER: 'Cashier' }
const empty = { fullName: '', phone: '', email: '', password: '' }

export default function UsersPage() {
  const { api, online, toast } = useStore()
  const [users, setUsers] = useState([]), [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null), [f, setF] = useState(empty), [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function load() { setLoading(true); try { setUsers(await api('/users')) } catch (e) { toast(e.message) } finally { setLoading(false) } }
  useEffect(() => { if (online) load() }, [online]) // eslint-disable-line

  const run = (fn, msg) => async () => {
    setBusy(true)
    try { await fn(); setModal(null); toast(msg); await load() } catch (e) { toast(e.message) } finally { setBusy(false) }
  }
  const open = (m, u = {}) => { setF({ ...empty, ...u, password: '', current: '', confirm: '', mode: 'reset' }); setModal({ m, u }) }

  const add = run(async () => {
    if (!f.fullName.trim() || !f.phone.trim()) throw new Error('Enter the name and phone number')
    if (f.password.length < 8) throw new Error('The password needs at least 8 characters')
    await api('/auth/register', 'POST', { fullName: f.fullName, phone: f.phone, email: f.email || null, password: f.password })
  }, 'User added')
  const edit = run(() => api('/users/' + modal.u.id, 'PUT', { fullName: f.fullName, phone: f.phone, email: f.email || null }), 'User updated')
  const password = run(async () => {
    if (f.password.length < 8) throw new Error('The new password needs at least 8 characters')
    if (f.password !== f.confirm) throw new Error('The two passwords do not match')
    if (f.mode === 'reset') await api(`/users/${modal.u.id}/reset-password`, 'POST', { newPassword: f.password })
    else await api(`/users/${modal.u.id}/change-password`, 'POST', { currentPassword: f.current, newPassword: f.password })
  }, 'Password changed')
  const remove = run(() => api('/users/' + modal.u.id, 'DELETE'), 'User deleted')
  async function role(u, r) { try { await api(`/users/${u.id}/role`, 'PATCH', { role: r }); toast('Role changed'); load() } catch (e) { toast(e.message); load() } }
  async function toggle(u) { try { await api(`/users/${u.id}/${u.active ? 'deactivate' : 'activate'}`, 'POST'); toast(u.active ? 'User deactivated' : 'User activated'); load() } catch (e) { toast(e.message) } }

  if (!online) return <div className="card empty">Users are kept on the server, so this screen needs a connection.</div>
  return (
    <>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <p className="muted" style={{ flex: 1 }}>The first person registered is the Owner. Everyone else starts as a Cashier, and you can change the role here.</p>
        <button className="btn primary" onClick={() => open('add')}><UserPlus size={16} />Add user</button>
      </div>
      <div className="card" style={{ padding: 6, overflowX: 'auto' }}>
        {users.length ? <table><thead><tr><th>User</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>
          {users.map(u => (
            <tr key={u.id} style={{ opacity: u.active ? 1 : .55 }}>
              <td><b>{u.fullName}</b><div className="muted sm">{u.phone}{u.email ? ' · ' + u.email : ''}</div></td>
              <td><select value={u.role} onChange={e => role(u, e.target.value)} style={{ minWidth: 118 }} aria-label={'Role of ' + u.fullName}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
              <td><span className={'badge ' + (u.active ? 'ok' : 'bad')}>{u.active ? 'Active' : 'Inactive'}</span></td>
              <td><div className="acts">
                <button className="btn sm icon" onClick={() => open('edit', u)} aria-label="Edit"><Pencil size={15} /></button>
                <button className="btn sm icon" onClick={() => open('password', u)} aria-label="Change password"><KeyRound size={15} /></button>
                <button className="btn sm icon" onClick={() => toggle(u)} aria-label={u.active ? 'Deactivate' : 'Activate'}><Power size={15} /></button>
                <button className="btn sm icon" onClick={() => open('delete', u)} aria-label="Delete"><Trash2 size={15} /></button>
              </div></td>
            </tr>
          ))}
        </tbody></table> : <div className="empty">{loading ? 'Loading...' : 'No users yet. Add the first one, who becomes the Owner.'}</div>}
      </div>

      {modal?.m === 'add' && <Modal title="Add user" onClose={() => setModal(null)}>
        <Field label="Full name"><input value={f.fullName} onChange={set('fullName')} autoFocus /></Field>
        <Field label="Phone (e.g. 0912345678)"><input type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email (optional)"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password (8 characters or more)"><input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <button className="btn primary block" disabled={busy} onClick={add}>Add user</button></Modal>}
      {modal?.m === 'edit' && <Modal title={'Edit ' + modal.u.fullName} onClose={() => setModal(null)}>
        <Field label="Full name"><input value={f.fullName} onChange={set('fullName')} /></Field>
        <Field label="Phone"><input type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email (optional)"><input type="email" value={f.email || ''} onChange={set('email')} /></Field>
        <button className="btn primary block" disabled={busy} onClick={edit}>Save changes</button></Modal>}
      {modal?.m === 'password' && <Modal title={'Password · ' + modal.u.fullName} onClose={() => setModal(null)}>
        <div className="chips"><button className={'chip' + (f.mode === 'reset' ? ' on' : '')} onClick={() => setF({ ...f, mode: 'reset' })}>Forgot it (set a new one)</button><button className={'chip' + (f.mode === 'change' ? ' on' : '')} onClick={() => setF({ ...f, mode: 'change' })}>Change (I know the old one)</button></div>
        {f.mode === 'change' && <Field label="Current password"><input type="password" value={f.current} onChange={set('current')} autoComplete="current-password" /></Field>}
        <Field label="New password (8 characters or more)"><input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Repeat the new password"><input type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        <button className="btn primary block" disabled={busy} onClick={password}>Save password</button></Modal>}
      {modal?.m === 'delete' && <Modal title="Delete user" onClose={() => setModal(null)}>
        <p>Delete <b>{modal.u.fullName}</b>? This cannot be undone. To stop someone logging in but keep their record, use the Deactivate button instead.</p>
        <div className="row"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={remove}>Delete</button></div></Modal>}
    </>
  )
}
