import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useApp } from '../store'
import { OPERATORS, QOS, opName, opColor } from '../data/seed'
import { addMonths, explain, draftMessage, MIN_POINTS } from '../lib/ai'
import { Badge, LEVEL_CLS, Demo } from '../components/ui'

export default function AiPage() {
  const { analysis, thresholds, setDraft } = useApp(); const nav = useNavigate()
  const [op, setOp] = useState('yas'); const [key, setKey] = useState('latency')
  const a = analysis[op]; const rows = QOS.filter((q) => q.operator === op).sort((x, y) => x.month.localeCompare(y.month))
  const ind = a.enough && a.indicators.find((i) => i.key === key)
  const data = ind ? [...rows.map((r, i) => ({ month: r.month, value: r[key], yhat: i === rows.length - 1 ? r[key] : undefined })), ...ind.forecast.map((f, k) => ({ month: addMonths(rows[rows.length - 1].month, k + 1), yhat: +f.yhat.toFixed(2), band: [+f.lo.toFixed(2), +f.hi.toFixed(2)] }))] : []
  const prepare = () => { const d = draftMessage(opName(op), a); setDraft({ op, ...d }); nav('/artec/messages') }
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Prévisions et alertes IA</h1><Demo />
      <div className="flex flex-wrap gap-3">
        <div><label className="label" htmlFor="o">Opérateur</label><select id="o" className="input" value={op} onChange={(e) => setOp(e.target.value)}>{OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div><label className="label" htmlFor="k">Indicateur</label><select id="k" className="input" value={key} onChange={(e) => setKey(e.target.value)}>{thresholds.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
      </div>
      {!a.enough ? <p className="card">Données insuffisantes : au moins {MIN_POINTS} mois d’historique sont nécessaires. Aucune prévision n’est affichée.</p> : <>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card"><p className="text-sm font-semibold text-lagon-700">Risque de non-conformité (3 mois)</p><p className="mt-2"><Badge cls={LEVEL_CLS[a.level]}>{a.level}</Badge> <span className="text-3xl font-display font-extrabold ml-2">{Math.round(a.risk * 100)} %</span></p></div>
          <div className="card"><p className="text-sm font-semibold text-lagon-700">Anomalies détectées</p><p className="text-3xl font-display font-extrabold mt-1">{a.anomalies.length}</p><p className="text-xs">Écart supérieur à 2 écarts-types de la tendance.</p></div>
          <div className="card flex flex-col justify-between"><p className="text-sm font-semibold text-lagon-700">Action suggérée</p><button className="btn-soleil mt-2" onClick={prepare}>Préparer un message à l’opérateur</button></div>
        </div>
        <section className="card"><h2 className="text-xl font-extrabold mb-1">{ind.label} : historique et projection</h2>
          <p className="text-sm mb-3">Ligne pleine : mesures. Pointillés : projection. Zone : intervalle de confiance ≈ 95 %. Ligne horizontale : seuil.</p>
          <div style={{ height: 320 }}><ResponsiveContainer><ComposedChart data={data}><XAxis dataKey="month" /><YAxis domain={['auto', 'auto']} /><Tooltip />
            <Area dataKey="band" fill={opColor(op)} fillOpacity={0.18} stroke="none" /><Line dataKey="value" stroke={opColor(op)} strokeWidth={3} dot={false} connectNulls />
            <Line dataKey="yhat" stroke={opColor(op)} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls /><ReferenceLine y={ind.value} stroke="#B91C1C" strokeDasharray="3 3" label="Seuil" /></ComposedChart></ResponsiveContainer></div></section>
        <section className="card"><h2 className="text-xl font-extrabold mb-3">Indicateurs contributeurs</h2>
          <ul className="space-y-3">{[...a.indicators].sort((x, y) => y.prob - x.prob).map((i) => (
            <li key={i.key}><div className="flex justify-between text-sm font-bold"><span>{i.label}</span><span>{Math.round(i.prob * 100)} %</span></div>
              <div className="h-2 rounded bg-lagon-100"><div className="h-2 rounded" style={{ width: `${Math.round(i.prob * 100)}%`, background: i.prob >= 0.5 ? '#B91C1C' : i.prob >= 0.2 ? '#D97706' : '#059669' }} /></div>
              <p className="text-sm mt-1">{explain(i)}</p></li>))}</ul>
          {a.anomalies.length > 0 && <p className="text-sm mt-4"><strong>Valeurs inhabituelles :</strong> {a.anomalies.map((x) => `${x.label} en ${x.month} (${x.value})`).join(' ; ')}.</p>}
        </section></>}
      <p className="text-sm">Méthode : régression linéaire sur l’historique mensuel, intervalle de prévision, détection des écarts à la tendance. Cette estimation oriente une vérification humaine et ne peut fonder seule une sanction.</p>
    </div>
  )
}
