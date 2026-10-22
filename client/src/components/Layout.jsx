import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../store'

const MENU = {
  operator: [['/operateur', 'Vue d’ensemble'], ['/operateur/messages', 'Messagerie ARTEC']],
  artec: [['/artec', 'Régulation'], ['/artec/ia', 'Prévisions IA'], ['/artec/messages', 'Messagerie opérateurs']],
  admin: [['/admin', 'Administration']],
}
export default function Layout() {
  const { user, logout, unread } = useApp(); const nav = useNavigate()
  const items = user ? [['/', 'Site public'], ...MENU[user.role]] : []
  const badge = (to) => (to.endsWith('/messages') ? unread(user.role === 'artec' ? 'artec' : 'operator', user.role === 'operator' ? user.operator : undefined) : 0)
  const link = ({ isActive }) => `flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-semibold whitespace-nowrap ${isActive ? 'bg-white text-lagon-900' : 'text-white/90 hover:bg-white/10'}`
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-gradient-to-b from-lagon-900 to-lagon-800 text-white md:w-60 md:min-h-screen md:sticky md:top-0 md:self-start p-4 flex md:flex-col gap-3 items-center md:items-stretch flex-wrap">
        <NavLink to="/" className="font-display font-extrabold text-lg leading-tight md:mb-4">Observatoire<br className="hidden md:block" /> télécoms MG</NavLink>
        <nav className="flex md:flex-col gap-1 overflow-x-auto flex-1" aria-label="Navigation">
          {items.map(([to, l]) => <NavLink key={to} to={to} end className={link}>{l}{badge(to) > 0 && <span className="rounded-full bg-soleil text-lagon-900 text-xs font-bold px-2" aria-label={`${badge(to)} non lus`}>{badge(to)}</span>}</NavLink>)}
        </nav>
        {user ? <div className="text-sm"><p className="font-bold">{user.name}</p><button className="underline" onClick={() => { logout(); nav('/') }}>Se déconnecter</button></div>
          : <NavLink to="/connexion" className="btn-soleil">Espace professionnel</NavLink>}
      </aside>
      <div className="flex-1 min-w-0"><main className="max-w-6xl mx-auto p-4 md:p-8"><Outlet /></main></div>
    </div>
  )
}
