import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useApp } from '../store'
import { OPERATORS, opName } from '../data/seed'
import { Badge, Stat, STATUS_CLS, LEVEL_CLS, Demo } from '../components/ui'

export default function Artec() {
  const { analysis, status, avgRating, feedbacks, cases, unread } = useApp()
  const risk = OPERATORS.map((o) => ({ name: o.name.split(' ')[0], risque: Math.round(analysis[o.id].risk * 100), color: o.color }))
  const toCheck = OPERATORS.filter((o) => status(o.id) === 'Vérification nécessaire').length
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Tableau de bord de régulation</h1><Demo />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Dossiers à vérifier" value={toCheck} sub="Vérification humaine requise" />
        <Stat label="Dossiers ouverts" value={cases.length} />
        <Stat label="Avis visiteurs" value={feedbacks.length} sub="Subjectifs, distincts des mesures" />
        <Stat label="Messages non lus" value={unread('artec')} sub={<Link className="underline" to="/artec/messages">Ouvrir la messagerie</Link>} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">{OPERATORS.map((o) => { const a = analysis[o.id], st = status(o.id); return (
        <article key={o.id} className="card border-t-4" style={{ borderTopColor: o.color }}>
          <h2 className="font-extrabold text-lg">{o.name}</h2>
          <p className="mt-2 flex flex-wrap gap-2"><Badge cls={STATUS_CLS[st]}>{st}</Badge><Badge cls={LEVEL_CLS[a.level] || ''}>Risque {a.level.toLowerCase()}</Badge></p>
          <ul className="text-sm mt-3 space-y-1">{a.indicators.filter((i) => i.breached).map((i) => <li key={i.key}>Hors seuil : {i.label} ({i.current})</li>)}{!a.indicators.some((i) => i.breached) && <li>Aucun seuil dépassé actuellement.</li>}</ul>
          <p className="text-sm mt-2">Note visiteurs : {avgRating(o.id)?.toFixed(1) ?? '–'}/10</p></article>) })}</div>
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card"><h2 className="text-xl font-extrabold mb-2">Risque de non-conformité prévu (%)</h2>
          <div style={{ height: 220 }}><ResponsiveContainer><BarChart data={risk}><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="risque" radius={[6, 6, 0, 0]}>{risk.map((r) => <Cell key={r.name} fill={r.color} />)}</Bar></BarChart></ResponsiveContainer></div>
          <Link className="btn mt-3" to="/artec/ia">Voir les prévisions détaillées</Link></section>
        <section className="card overflow-x-auto"><h2 className="text-xl font-extrabold mb-2">Dossiers réglementaires</h2>
          <table className="w-full"><thead><tr><th>N°</th><th>Opérateur</th><th>Objet</th><th>État</th></tr></thead><tbody>{cases.map((c) => <tr key={c.id}><td>{c.id}</td><td>{opName(c.op)}</td><td>{c.title}</td><td><Badge>{c.status}</Badge></td></tr>)}</tbody></table>
          <p className="text-xs mt-3">Toute décision ou sanction relève d’un agent habilité.</p></section>
      </div>
    </div>
  )
}
