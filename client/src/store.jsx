import { createContext, useContext, useMemo, useState } from 'react'
import { THRESHOLDS, PUBLICATIONS, FEEDBACKS, USERS, CASES, MESSAGES, QOS, OPERATORS } from './data/seed'
import { analyzeOperator } from './lib/ai'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const today = () => new Date().toISOString().slice(0, 10)
let seq = 100

// Tout passe par ce store : au backend, chaque action deviendra un appel /api/...
export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [thresholds, setThresholds] = useState(THRESHOLDS)
  const [publications, setPublications] = useState(PUBLICATIONS)
  const [feedbacks, setFeedbacks] = useState(FEEDBACKS)
  const [users, setUsers] = useState(USERS)
  const [cases, setCases] = useState(CASES)
  const [messages, setMessages] = useState(MESSAGES)
  const [draft, setDraft] = useState(null)

  const analysis = useMemo(() => Object.fromEntries(OPERATORS.map((o) => [o.id, analyzeOperator(QOS.filter((q) => q.operator === o.id).sort((a, b) => a.month.localeCompare(b.month)), thresholds)])), [thresholds])
  const status = (op) => { const a = analysis[op]; if (!a.enough) return 'Données insuffisantes'; const n = a.indicators.filter((i) => i.breached).length; return n >= 2 ? 'Vérification nécessaire' : n === 1 || a.level === 'Élevé' ? 'À surveiller' : 'Conforme' }
  const avgRating = (op) => { const l = feedbacks.filter((f) => f.operator === op); return l.length ? l.reduce((s, f) => s + f.rating, 0) / l.length : null }

  const login = (email, pw) => { const u = users.find((x) => x.email === email.trim().toLowerCase()); if (!u || pw !== 'demo123') return { ok: false, error: 'Identifiant ou mot de passe incorrect.' }; if (!u.active) return { ok: false, error: 'Ce compte est suspendu. Contactez l’administrateur.' }; setUser(u); return { ok: true, user: u } }
  const addFeedback = (f) => setFeedbacks((l) => [{ ...f, id: ++seq, date: today(), sentiment: f.rating >= 7 ? 'positif' : f.rating >= 5 ? 'neutre' : 'négatif' }, ...l])
  const addPublication = (p) => setPublications((l) => [{ ...p, id: ++seq, date: today() }, ...l])
  const removePublication = (id) => setPublications((l) => l.filter((p) => p.id !== id))
  const toggleUser = (id) => setUsers((l) => l.map((u) => (u.id === id ? { ...u, active: !u.active } : u)))
  const setThreshold = (key, value) => setThresholds((l) => l.map((t) => (t.key === key ? { ...t, value } : t)))
  const openCase = (op, title) => { const id = `D-${String(cases.length + 1).padStart(3, '0')}`; setCases((l) => [...l, { id, op, title, status: 'Dossier en cours d’examen' }]); return id }
  const sendMessage = (m) => setMessages((l) => {
    const msg = { id: ++seq, at: new Date().toISOString(), caseId: null, deadline: null, readBy: m.from === 'bot' ? ['artec', 'operator'] : [m.from], ...m }
    const ack = m.from === 'operator' ? [{ id: ++seq, op: m.op, from: 'bot', kind: 'Assistant', at: new Date().toISOString(), readBy: ['artec', 'operator'], caseId: m.caseId || null, deadline: null, text: 'Accusé de réception automatique : votre réponse est transmise à l’agent ARTEC. Ce message provient d’un assistant automatisé, pas d’une personne.' }] : []
    return [...l, msg, ...ack]
  })
  const markRead = (op, viewer) => setMessages((l) => (l.some((m) => m.op === op && !m.readBy.includes(viewer)) ? l.map((m) => (m.op === op && !m.readBy.includes(viewer) ? { ...m, readBy: [...m.readBy, viewer] } : m)) : l))
  const unread = (viewer, op) => messages.filter((m) => m.from !== 'bot' && m.from !== viewer && !m.readBy.includes(viewer) && (!op || m.op === op)).length

  return <Ctx.Provider value={{ user, login, logout: () => setUser(null), thresholds, publications, feedbacks, users, cases, messages, draft, setDraft, analysis, status, avgRating, addFeedback, addPublication, removePublication, toggleUser, setThreshold, openCase, sendMessage, markRead, unread }}>{children}</Ctx.Provider>
}
