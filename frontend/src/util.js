export const br = n => 'Br ' + (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
export const num = n => (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
export const TYPES = { SHOP: 'Kiosk / shop', HOTEL: 'Restaurant / hotel', BAKERY: 'Bakery', HOME: 'Household' }
export const METHODS = [['CASH', 'Cash'], ['TELEBIRR', 'Telebirr'], ['CBE_BIRR', 'CBE Birr'], ['BANK', 'Bank']]
export const daysSince = d => (d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / 864e5)) : 0)
export const ethDate = () => { try { return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) } catch { return new Date().toDateString() } }

const NO_PLURAL = /^(kg|g|l|ml|lb|m|cm|pcs)$/i
export const plural = (w, n) => (+n === 1 || NO_PLURAL.test(w) ? w : /(x|s|ch|sh)$/i.test(w) ? w + 'es' : w + 's')
/** "2 trays + 5 eggs" for a product (works for any unit and pack name; one item per pack means no packs). */
export const qtyText = (n, p) => {
  n = Math.round((+n || 0) * 100) / 100
  const per = p?.ppt || p?.piecesPerTray || 1, unit = p?.unit || 'piece', pack = p?.packName || 'pack'
  if (per <= 1) return num(n) + ' ' + plural(unit, n)
  const packs = Math.floor(n / per), rem = Math.round((n - packs * per) * 100) / 100
  return `${num(packs)} ${plural(pack, packs)}${rem ? ' + ' + num(rem) + ' ' + plural(unit, rem) : ''}`
}
