import { useId } from 'react'

/** Laba mark: a golden egg with a feather on a green tile. Same drawing as public/icon.svg. */
export default function Logo({ size = 36, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Laba logo" style={{ flex: 'none' }}>
      <defs>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1b6b3a" /><stop offset="1" stopColor="#0b2417" /></linearGradient>
        <linearGradient id={id + 'e'} x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#ffdc70" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}b)`} />
      <path d="M32 8c10.5 0 17.5 15.5 17.5 28a17.5 17.5 0 0 1-35 0C14.5 23.5 21.5 8 32 8z" fill={`url(#${id}e)`} />
      <ellipse cx="25" cy="22" rx="3.6" ry="7" transform="rotate(18 25 22)" fill="#fff" opacity=".38" />
      <path d="M24 48C25 36 32 26 42 21c1 12-5 23-18 27z" fill="#14532d" />
      <path d="M24 48C29 38 34 29 42 21" stroke="#ffdc70" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M24 48l-4.5 6" stroke="#ffdc70" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
