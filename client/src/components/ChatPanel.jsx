import { useState, useEffect, useRef } from 'react'
import { useApp } from '../store'
import { opName } from '../data/seed'
import { draftMessage } from '../lib/ai'
import { Badge } from './ui'

const TYPES = ['Demande d’explication', 'Demande de rapport ou justificatif', 'Notification d’anomalie', 'Demande de correction', 'Observation', 'Félicitations']
const NEED_DEADLINE = ['Demande d’explication', 'Demande de rapport ou justificatif', 'Demande de correction']
const fmt = (iso) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

export default function ChatPanel({ op, viewer }) {
  const { messages, cases, sendMessage, markRead, analysis, draft, setDraft, openCase } = useApp()
  const thread = messages.filter((m) => m.op === op), opCases = cases.filter((c) => c.op === op)
  const [text, setText] = useState(''); const [type, setType] = useState(TYPES[0]); const [caseId, setCaseId] = useState(''); const [deadline, setDeadline] = useState('')
  const box = useRef(null)
  useEffect(() => { markRead(op, viewer) }, [op, viewer, thread.length])
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [thread.length, op])
  useEffect(() => { if (draft && draft.op === op && viewer === 'artec') { setText(draft.text); setType(draft.type); setDraft(null) } }, [draft, op])

  const need = viewer === 'artec' && NEED_DEADLINE.includes(type)
  const send = (e) => {
    e.preventDefault(); if (!text.trim()) return
    sendMessage({ op, from: viewer, kind: viewer === 'artec' ? type : 'Réponse', text: text.trim(), caseId: caseId || null, deadline: need ? deadline : null })
    setText(''); setDeadline('')
  }
  const openRequests = thread.filter((m, i) => m.from === 'artec' && m.deadline && !thread.slice(i + 1).some((x) => x.from === 'operator'))
  const bot = (text) => sendMessage({ op, from: 'bot', kind: 'Assistant', text })
  const ask = {
    'Mes échéances': () => bot(openRequests.length ? 'Réponses attendues :\n' + openRequests.map((m) => `- ${m.kind}${m.caseId ? ' (' + m.caseId + ')' : ''} avant le ${m.deadline}`).join('\n') : 'Aucune réponse en attente.'),
    'Statut des dossiers': () => bot(opCases.length ? opCases.map((c) => `${c.id} : ${c.title} — ${c.status}`).join('\n') : 'Aucun dossier ouvert.'),
    'Résumer la conversation': () => { const a = thread.filter((m) => m.from === 'artec').length, o = thread.filter((m) => m.from === 'operator').length; const last = [...thread].reverse().find((m) => m.from === 'operator'); bot(`Résumé automatique : ${thread.length} messages (${a} de l’ARTEC, ${o} de l’opérateur). Demandes sans réponse : ${openRequests.length}. Dernière réponse de l’opérateur : ${last ? fmt(last.at) : 'aucune'}.`) },
  }
  const suggest = () => { const d = draftMessage(opName(op), analysis[op]); setText(d.text); setType(d.type) }

  return (
    <section className="card flex flex-col" aria-label={`Conversation avec ${opName(op)}`} style={{ minHeight: 520 }}>
      <header className="flex flex-wrap items-center gap-2 pb-3 border-b border-lagon-100">
        <h2 className="text-lg font-extrabold mr-auto">{viewer === 'artec' ? opName(op) : 'Conversation avec l’ARTEC'}</h2>
        {Object.keys(ask).map((k) => <button key={k} className="btn-ghost text-sm" onClick={ask[k]}>{k}</button>)}
      </header>
      <div ref={box} className="flex-1 overflow-y-auto py-4 space-y-3" style={{ maxHeight: 380 }} aria-live="polite">
        {thread.length === 0 && <p className="text-sm text-lagon-700">Aucun message pour le moment.</p>}
        {thread.map((m) => (
          <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.from === 'bot' ? 'mx-auto bg-lagon-50 border border-dashed border-lagon-700/40' : m.from === viewer ? 'ml-auto bg-lagon-900 text-white' : 'bg-lagon-100'}`}>
            <p className="text-xs font-bold mb-1 flex flex-wrap gap-2 items-center">
              <span>{m.from === 'bot' ? 'Assistant automatisé' : m.from === 'artec' ? 'Agent ARTEC' : opName(op)}</span>
              {m.from !== 'bot' && <Badge cls={m.from === viewer ? 'bg-white/20 text-white' : 'bg-white text-lagon-900'}>{m.kind}</Badge>}
              {m.caseId && <Badge cls="bg-soleil text-lagon-900">{m.caseId}</Badge>}
            </p>
            <p className="whitespace-pre-line">{m.text}</p>
            <p className="text-xs opacity-70 mt-1">{fmt(m.at)}{m.deadline && ` · réponse avant le ${m.deadline}`}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="border-t border-lagon-100 pt-3 space-y-2">
        <div className="grid sm:grid-cols-3 gap-2">
          {viewer === 'artec' && <div><label className="label" htmlFor="ct">Type de message</label><select id="ct" className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>}
          <div><label className="label" htmlFor="cc">Dossier associé</label><select id="cc" className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Aucun</option>{opCases.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.title}</option>)}</select></div>
          {need && <div><label className="label" htmlFor="cd">Échéance de réponse</label><input id="cd" type="date" required className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>}
        </div>
        <label className="sr-only" htmlFor="cm">Message</label>
        <textarea id="cm" rows="3" className="input" placeholder={viewer === 'artec' ? 'Votre message à l’opérateur…' : 'Votre réponse ou vos justificatifs…'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn">Envoyer</button>
          {viewer === 'artec' && <><button type="button" className="btn-soleil" onClick={suggest}>Suggérer un brouillon (IA)</button>
            <button type="button" className="btn-ghost" onClick={() => { const id = openCase(op, prompt('Intitulé du dossier ?') || 'Nouveau dossier'); setCaseId(id) }}>Ouvrir un dossier</button></>}
        </div>
        <p className="text-xs text-lagon-700">Le brouillon IA est relu et envoyé par l’agent. Les avertissements officiels et sanctions relèvent uniquement d’un agent habilité, après procédure contradictoire.</p>
      </form>
    </section>
  )
}
