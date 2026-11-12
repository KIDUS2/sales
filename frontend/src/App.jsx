import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Users, Package, Receipt, RefreshCw, Languages, Sun, Moon, UserCog, Truck, ListOrdered, LogOut, Boxes } from 'lucide-react'
import { useStore } from './store.jsx'
import { ethDate } from './util.js'
import Logo from './components/Logo.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Sell from './pages/Sell.jsx'
import Customers from './pages/Customers.jsx'
import Stock from './pages/Stock.jsx'
import Expenses from './pages/Expenses.jsx'
import UsersPage from './pages/Users.jsx'
import Login from './pages/Login.jsx'
import Loads from './pages/Loads.jsx'
import MyLoad from './pages/MyLoad.jsx'
import Transactions from './pages/Transactions.jsx'

const ALL = {
  Dashboard: [LayoutDashboard, Dashboard], 'My Load': [Boxes, MyLoad], Sell: [ShoppingCart, Sell], Customers: [Users, Customers], Products: [Package, Stock],
  Loads: [Truck, Loads], Expenses: [Receipt, Expenses], Transactions: [ListOrdered, Transactions], Users: [UserCog, UsersPage],
}
// what each role sees: the admin runs the business, the salesperson only sells from their own load
const MENU = {
  OWNER: ['Dashboard', 'Sell', 'Customers', 'Products', 'Loads', 'Expenses', 'Transactions', 'Users'],
  MANAGER: ['Dashboard', 'Sell', 'Customers', 'Products', 'Loads', 'Expenses', 'Transactions'],
  CASHIER: ['My Load', 'Sell', 'Customers', 'Expenses', 'Transactions'],
}
export const ROLE_NAME = { OWNER: 'Admin', MANAGER: 'Manager', CASHIER: 'Salesperson' }

export default function App() {
  const { token, user } = useStore()
  if (!token || !user) return <Login />
  return <Shell key={user.id} />
}

function Shell() {
  const { user, logout } = useStore()
  const menu = MENU[user.role] || MENU.CASHIER
  const [page, setPage] = useState(menu[0])
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme])
  const { t, online, manual, setManual, queue, sync, lang, setLang, toastMsg } = useStore()
  const Page = ALL[menu.includes(page) ? page : menu[0]][1]
  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Logo size={38} /><span className="wm"><b>Laba</b><small>ላባ · Sales</small></span></div>
        {menu.map(name => { const Icon = ALL[name][0]; return (
          <button key={name} className={'nav' + (page === name ? ' on' : '')} onClick={() => setPage(name)}><Icon size={20} />{t(name)}</button>
        )})}
        <div className="foot"><b style={{ color: '#fff' }}>{user.fullName}</b><br />{ROLE_NAME[user.role]}<br />{queue.length ? queue.length + ' waiting to sync' : 'Everything is saved'}</div>
      </aside>
      <div className="main">
        <header className="top">
          <Logo size={34} className="top-logo" />
          <h1>{t(page)}<small>{ethDate()}</small></h1>
          <button className="pill" onClick={() => online ? sync() : setManual(false)} title="Send saved entries to the server">
            <RefreshCw size={15} /><span className="hide-s">{t('Sync')} </span>{queue.length > 0 && <span className="badge">{queue.length}</span>}
          </button>
          <button className={'pill ' + (online ? 'on' : 'off')} onClick={() => setManual(m => !m)} title="Switch between online and offline mode">
            <span className="dot" style={{ background: 'currentColor', margin: 0 }} />{manual ? t('Offline') : online ? t('Online') : 'No connection'}
          </button>
          <button className="pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Light or dark theme">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="pill" onClick={logout} aria-label="Sign out" title={'Sign out ' + user.fullName}><LogOut size={15} /><span className="hide-s">Sign out</span></button>
          <button className="pill" onClick={() => setLang(lang === 'am' ? 'en' : 'am')} aria-label="Language"><Languages size={15} />{lang === 'am' ? 'EN' : 'አማ'}</button>
        </header>
        <main className="page"><Page go={setPage} /></main>
      </div>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  )
}
