import { useEffect, useState } from 'react'
import { LayoutDashboard, ShoppingCart, Users, Package, Receipt, RefreshCw, Languages, Sun, Moon } from 'lucide-react'
import { useStore } from './store.jsx'
import { ethDate } from './util.js'
import Dashboard from './pages/Dashboard.jsx'
import Sell from './pages/Sell.jsx'
import Customers from './pages/Customers.jsx'
import Stock from './pages/Stock.jsx'
import Expenses from './pages/Expenses.jsx'

const PAGES = [['Today', LayoutDashboard, Dashboard], ['Sell', ShoppingCart, Sell], ['Customers', Users, Customers], ['Stock', Package, Stock], ['Expenses', Receipt, Expenses]]

export default function App() {
  const [page, setPage] = useState('Today')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme])
  const { t, online, manual, setManual, queue, sync, lang, setLang, toastMsg } = useStore()
  const Page = PAGES.find(p => p[0] === page)[2]
  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="egg" />Egg Sales</div>
        {PAGES.map(([name, Icon]) => (
          <button key={name} className={'nav' + (page === name ? ' on' : '')} onClick={() => setPage(name)}><Icon size={20} />{t(name)}</button>
        ))}
        <div className="foot">{queue.length ? queue.length + ' waiting to sync' : 'Everything is saved'}</div>
      </aside>
      <div className="main">
        <header className="top">
          <h1>{t(page)}<small>{ethDate()}</small></h1>
          <button className="pill" onClick={() => online ? sync() : setManual(false)} title="Send saved entries to the server">
            <RefreshCw size={15} /><span className="hide-s">{t('Sync')} </span>{queue.length > 0 && <span className="badge">{queue.length}</span>}
          </button>
          <button className={'pill ' + (online ? 'on' : 'off')} onClick={() => setManual(m => !m)} title="Switch between online and offline mode">
            <span className="dot" style={{ background: 'currentColor', margin: 0 }} />{manual ? t('Offline') : online ? t('Online') : 'No connection'}
          </button>
          <button className="pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Light or dark theme">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="pill" onClick={() => setLang(lang === 'am' ? 'en' : 'am')} aria-label="Language"><Languages size={15} />{lang === 'am' ? 'EN' : 'አማ'}</button>
        </header>
        <main className="page"><Page go={setPage} /></main>
      </div>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  )
}
