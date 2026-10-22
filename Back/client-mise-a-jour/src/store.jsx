import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setToken } from './api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const EMPTY = { users: [], cases: [], messages: [], analysis: {} }

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('user')) } catch { return null } })
  const [d, setD] = useState(null)
  const [pro, setPro] = useState(EMPTY)
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const role = user?.role

  const logout = useCallback(() => { setToken(null); sessionStorage.removeItem('user'); setUser(null) }, [])
  const fail = useCallback((e) => { if (/expirée|indisponible/.test(e.message)) logout(); setError(e.message) }, [logout])
  const loadPublic = useCallback(async () => {
    const [publications, feedbacks, qos, thresholds] = await Promise.all(['/publications', '/feedbacks', '/qos', '/thresholds'].map((p) => api(p)))
    setD({ publications, feedbacks, qos, thresholds })
  }, [])
  const loadPro = useCallback(async () => {
    if (!role) return setPro(EMPTY)
    if (role === 'admin') return setPro({ ...EMPTY, users: await api('/users') })
    const [cases, messages, analysis] = await Promise.all([api('/cases'), api('/messages'), api('/ai/analysis')])
    setPro({ ...EMPTY, cases, messages, analysis })
  }, [role])
  const reload = useCallback(async () => { try { await Promise.all([loadPublic(), loadPro()]); setError('') } catch (e) { fail(e) } }, [loadPublic, loadPro, fail])
  const loadMessages = useCallback(async () => { const messages = await api('/messages'); setPro((p) => ({ ...p, messages })) }, [])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { // messagerie quasi temps réel : actualisation toutes les 8 s
    if (role !== 'artec' && role !== 'operator') return
    const t = setInterval(() => loadMessages().catch(() => {}), 8000); return () => clearInterval(t)
  }, [role, loadMessages])

  const run = (fn, after = reload) => async (...a) => { try { const r = await fn(...a); await after(); return r ?? { ok: true } } catch (e) { fail(e); return { ok: false, error: e.message } } }
  const login = async (email, password) => {
    try { const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } }); setToken(token); sessionStorage.setItem('user', JSON.stringify(user)); setUser(user); return { ok: true, user } }
    catch (e) { return { ok: false, error: e.message } }
  }
  const addFeedback = async (f) => { try { await api('/feedbacks', { method: 'POST', body: f }); await loadPublic(); return { ok: true } } catch (e) { return { ok: false, error: e.message } } }
  const addPublication = run((p) => api('/publications', { method: 'POST', body: { type: p.type, title: p.title, body: p.body } }), loadPublic)
  const removePublication = run((id) => api(`/publications/${id}`, { method: 'DELETE' }), loadPublic)
  const toggleUser = run((id) => api(`/users/${id}/toggle`, { method: 'PATCH' }), loadPro)
  const setThreshold = (key, value) => { setD((p) => ({ ...p, thresholds: p.thresholds.map((t) => (t.key === key ? { ...t, value } : t)) })); api(`/thresholds/${key}`, { method: 'PUT', body: { value } }).catch(fail) }
  const openCase = async (op, title) => { try { const c = await api('/cases', { method: 'POST', body: { op, title } }); await loadPro(); return c.id } catch (e) { fail(e) } }
  const sendMessage = run((m) => api('/messages', { method: 'POST', body: { op: m.op, kind: m.kind, text: m.text, caseId: m.caseId, deadline: m.deadline } }), loadMessages)
  const assistant = run((op, action) => api('/messages/assistant', { method: 'POST', body: { op, action } }), loadMessages)
  const markRead = (op, viewer) => {
    if (!pro.messages.some((m) => m.op === op && !m.readBy.includes(viewer))) return
    setPro((p) => ({ ...p, messages: p.messages.map((m) => (m.op === op && !m.readBy.includes(viewer) ? { ...m, readBy: [...m.readBy, viewer] } : m)) }))
    api('/messages/read', { method: 'POST', body: { op } }).catch(() => {})
  }
  const unread = (viewer, op) => pro.messages.filter((m) => m.from !== 'bot' && m.from !== viewer && !m.readBy.includes(viewer) && (!op || m.op === op)).length

  if (!d) return <p className="p-6" role={error ? 'alert' : 'status'}>{error ? <>{error} <button className="btn-ghost" onClick={reload}>Réessayer</button></> : 'Chargement…'}</p>
  const { publications, feedbacks, qos, thresholds } = d
  const analysis = pro.analysis
  const status = (op) => { const a = analysis[op]; if (!a || !a.enough) return 'Données insuffisantes'; const n = a.indicators.filter((i) => i.breached).length; return n >= 2 ? 'Vérification nécessaire' : n === 1 || a.level === 'Élevé' ? 'À surveiller' : 'Conforme' }
  const avgRating = (op) => { const l = feedbacks.filter((f) => f.operator === op); return l.length ? l.reduce((s, f) => s + f.rating, 0) / l.length : null }

  return (
    <Ctx.Provider value={{ user, login, logout, thresholds, publications, feedbacks, qos, users: pro.users, cases: pro.cases, messages: pro.messages, draft, setDraft, analysis, status, avgRating, addFeedback, addPublication, removePublication, toggleUser, setThreshold, openCase, sendMessage, assistant, markRead, unread }}>
      {error && <p role="alert" className="bg-red-100 text-red-800 font-semibold px-4 py-2 text-center">{error}</p>}
      {children}
    </Ctx.Provider>
  )
}
