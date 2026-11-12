import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import './styles.css'
import { StoreProvider } from './store.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<StoreProvider><App /></StoreProvider>)
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js')
