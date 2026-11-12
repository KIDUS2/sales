export const br = n => 'Br ' + (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
export const num = n => (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
export const TYPES = { SHOP: 'Kiosk / shop', HOTEL: 'Restaurant / hotel', BAKERY: 'Bakery', HOME: 'Household' }
export const METHODS = [['CASH', 'Cash'], ['TELEBIRR', 'Telebirr'], ['CBE_BIRR', 'CBE Birr'], ['BANK', 'Bank']]
export const daysSince = d => (d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5)) : 0)
export const ethDate = () => { try { return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) } catch { return new Date().toDateString() } }
