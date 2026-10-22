import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useApp } from '../store'
import { opName, opColor } from '../data/seed'
import { Badge, Stat, STATUS_CLS } from '../components/ui'

export default function Operator() {
  const { user, publications, feedbacks, thresholds, status, avgRating, addPublication, removePublication, messages, unread, qos } = useApp()
  const op = user.operator; const [key, setKey] = useState('down'); const [p, setP] = useState({ type: 'Offre', title: '', body: '' }); const [msg, setMsg] = useState('')
  const fbs = feedbacks.filter((f) => f.operator === op); const t = thresholds.find((x) => x.key === key); const st = status(op)
  const thread = messages.filter((m) => m.op === op)
  const pending = thread.filter((m, i) => m.from === 'artec' && m.deadline && !thread.slice(i + 1).some((x) => x.from === 'operator'))
  const csv = () => {
    const rows = [['date', 'service', 'note', 'région', 'commentaire'], ...fbs.map((f) => [f.date, f.category, f.rating, f.region, `"${f.comment.replace(/"/g, '""')}"`])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv' })); a.download = `avis-${op}.csv`; a.click()
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold" style={{ color: opColor(op) }}>{opName(op)}</h1>
      {pending.length > 0 && <div role="alert" className="card border-l-4 border-soleil"><p className="font-bold">{pending.length} demande(s) de l’ARTEC en attente de réponse</p><p className="text-sm">Prochaine échéance : {pending.map((m) => m.deadline).sort()[0]}. <Link className="underline font-bold" to="/operateur/messages">Répondre</Link></p></div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Note moyenne" value={`${avgRating(op)?.toFixed(1) ?? '–'}/10`} /><Stat label="Avis reçus" value={fbs.length} />
        <div className="card"><p className="text-sm font-semibold text-lagon-700">Situation (indicative)</p><p className="mt-2"><Badge cls={STATUS_CLS[st]}>{st}</Badge></p></div>
        <Stat label="Messages ARTEC non lus" value={unread('operator', op)} />
      </div>
      <section className="card"><div className="flex flex-wrap items-center gap-3 mb-2"><h2 className="text-xl font-extrabold mr-auto">Qualité de service</h2>
        <label className="sr-only" htmlFor="ik">Indicateur</label><select id="ik" className="input !w-auto" value={key} onChange={(e) => setKey(e.target.value)}>{thresholds.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></div>
        <div style={{ height: 240 }}><ResponsiveContainer><LineChart data={qos.filter((q) => q.operator === op)}><XAxis dataKey="month" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Line dataKey={key} stroke={opColor(op)} strokeWidth={3} dot={false} /><ReferenceLine y={t.value} stroke="#B91C1C" strokeDasharray="4 4" label="Seuil" /></LineChart></ResponsiveContainer></div></section>
      <form onSubmit={(e) => { e.preventDefault(); addPublication({ ...p, operator: op }); setP({ type: 'Offre', title: '', body: '' }); setMsg('Publication ajoutée.') }} className="card space-y-3"><h2 className="text-xl font-extrabold">Nouvelle publication</h2>
        <div className="grid sm:grid-cols-3 gap-3"><div><label className="label" htmlFor="pt">Type</label><select id="pt" className="input" value={p.type} onChange={(e) => setP({ ...p, type: e.target.value })}><option>Offre</option><option>Promotion</option></select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="pi">Titre</label><input id="pi" required className="input" value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} /></div></div>
        <div><label className="label" htmlFor="pb">Description</label><textarea id="pb" required rows="3" className="input" value={p.body} onChange={(e) => setP({ ...p, body: e.target.value })} /></div>
        {msg && <p role="status" className="font-semibold">{msg}</p>}<button className="btn">Publier</button>
        <table className="w-full"><tbody>{publications.filter((x) => x.operator === op).map((x) => <tr key={x.id}><td>{x.type}</td><td>{x.title}</td><td>{x.date}</td><td><button type="button" className="btn-ghost" onClick={() => removePublication(x.id)}>Supprimer</button></td></tr>)}</tbody></table></form>
      <section className="card overflow-x-auto"><div className="flex items-center mb-2"><h2 className="text-xl font-extrabold">Avis des visiteurs</h2><button className="btn ml-auto" onClick={csv}>Exporter en CSV</button></div>
        <table className="w-full"><thead><tr><th>Date</th><th>Service</th><th>Note</th><th>Sentiment</th><th>Commentaire</th></tr></thead><tbody>{fbs.map((f) => <tr key={f.id}><td>{f.date}</td><td>{f.category}</td><td>{f.rating}</td><td>{f.sentiment}</td><td>{f.comment}</td></tr>)}</tbody></table></section>
    </div>
  )
}
