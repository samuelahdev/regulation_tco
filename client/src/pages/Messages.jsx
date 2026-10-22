import { useState } from 'react'
import { useApp } from '../store'
import { OPERATORS } from '../data/seed'
import ChatPanel from '../components/ChatPanel'

export default function Messages() {
  const { user, unread } = useApp(); const [op, setOp] = useState('yas')
  if (user.role === 'operator') return <div className="space-y-4"><h1 className="text-3xl font-extrabold">Messagerie ARTEC</h1><ChatPanel op={user.operator} viewer="operator" /></div>
  return (
    <div className="space-y-4"><h1 className="text-3xl font-extrabold">Messagerie opérateurs</h1>
      <div className="flex gap-2 flex-wrap" role="tablist">{OPERATORS.map((o) => <button key={o.id} role="tab" aria-selected={op === o.id} onClick={() => setOp(o.id)} className={`btn-ghost ${op === o.id ? '!bg-lagon-900 !text-white' : ''}`}>{o.name}{unread('artec', o.id) > 0 && <span className="ml-2 rounded-full bg-soleil text-lagon-900 text-xs px-2">{unread('artec', o.id)}</span>}</button>)}</div>
      <ChatPanel op={op} viewer="artec" /></div>
  )
}
