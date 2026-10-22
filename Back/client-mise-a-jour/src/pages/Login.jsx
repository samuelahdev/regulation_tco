import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { USERS } from '../data/seed'

const HOME = { operator: '/operateur', artec: '/artec', admin: '/admin' }
export default function Login() {
  const { login } = useApp(); const nav = useNavigate()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const submit = async (e) => { e.preventDefault(); const r = await login(email, pw); r.ok ? nav(HOME[r.user.role]) : setErr(r.error) }
  return (
    <div className="max-w-md mx-auto card mt-8">
      <h1 className="text-2xl font-extrabold mb-4">Espace professionnel</h1>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label" htmlFor="e">Adresse e-mail</label><input id="e" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="label" htmlFor="p">Mot de passe</label><input id="p" type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        {err && <p role="alert" className="text-red-700 font-semibold">{err}</p>}
        <button className="btn w-full">Se connecter</button>
      </form>
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Comptes de démonstration (mot de passe : demo123)</summary>
        <ul className="mt-2 space-y-1">{USERS.map((u) => <li key={u.id}><button type="button" className="underline" onClick={() => setEmail(u.email)}>{u.email}</button> ({u.role})</li>)}</ul></details>
    </div>
  )
}
