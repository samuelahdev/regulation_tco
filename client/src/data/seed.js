// DONNÉES SYNTHÉTIQUES de démonstration (12 mois). Seront remplacées par MongoDB au backend.
export const OPERATORS = [
  { id: 'orange', name: 'Orange Madagascar', color: '#E8710A' },
  { id: 'yas', name: 'Yas Madagascar', color: '#B8920A' },
  { id: 'airtel', name: 'Airtel Madagascar', color: '#D61F26' },
]
export const opName = (id) => OPERATORS.find((o) => o.id === id)?.name ?? id
export const opColor = (id) => OPERATORS.find((o) => o.id === id)?.color ?? '#13566B'
export const CATEGORIES = ['Appels téléphoniques', 'SMS', 'Internet mobile', 'Couverture réseau', 'Débit de téléchargement', 'Débit d’envoi', 'Latence', 'Stabilité de la connexion', 'Prix et facturation', 'Service client']
export const REGIONS = ['Analamanga', 'Atsinanana', 'Boeny', 'Diana', 'Haute Matsiatra', 'Atsimo-Andrefana', 'Autre']

export const THRESHOLDS = [ // seuils d'EXEMPLE à remplacer par les seuils officiels
  { key: 'down', label: 'Débit descendant (Mbit/s)', type: 'min', value: 5 },
  { key: 'latency', label: 'Latence (ms)', type: 'max', value: 80 },
  { key: 'availability', label: 'Disponibilité (%)', type: 'min', value: 99 },
  { key: 'callFail', label: 'Échec des appels (%)', type: 'max', value: 2 },
]
const MONTHS = Array.from({ length: 12 }, (_, i) => { const t = 2025 * 12 + 10 + i; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` })
const noise = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 3.1 + k) * 0.5
const AMP = { down: 0.25, latency: 2, availability: 0.06, callFail: 0.08 }
const PROFILE = {
  orange: { down: [8.4, 0.14], latency: [66, -0.7], availability: [99.3, 0.02], callFail: [1.8, -0.03] },
  yas: { down: [8.2, -0.2], latency: [68, 1.5], availability: [99.3, -0.06], callFail: [1.7, 0.08] },
  airtel: { down: [6.0, 0.05], latency: [73, -0.2], availability: [99.2, 0.01], callFail: [1.9, -0.02] },
}
export const QOS = OPERATORS.flatMap((o, oi) => MONTHS.map((month, i) => {
  const row = { operator: o.id, month }
  Object.keys(AMP).forEach((k, j) => {
    let v = PROFILE[o.id][k][0] + PROFILE[o.id][k][1] * i + noise(i, j + oi * 5) * AMP[k]
    if (o.id === 'airtel' && k === 'callFail' && i === 7) v += 1.4 // anomalie simulée
    row[k] = +Math.min(v, k === 'availability' ? 99.95 : 1e9).toFixed(2)
  }); return row
}))
export const PUBLICATIONS = [
  { id: 1, operator: 'orange', type: 'Offre', title: 'Forfait Internet 10 Go', body: '10 Go valables 30 jours. Comment évaluez-vous la qualité de notre connexion Internet mobile dans votre région ?', date: '2026-10-12' },
  { id: 2, operator: 'yas', type: 'Promotion', title: 'Bonus appels week-end', body: 'Appels vers tous les réseaux avec bonus de 50 % le samedi et le dimanche.', date: '2026-10-15' },
  { id: 3, operator: 'airtel', type: 'Offre', title: 'Pack SMS illimités', body: 'SMS illimités vers tous les réseaux pendant 7 jours.', date: '2026-10-18' },
]
export const FEEDBACKS = [
  { id: 1, operator: 'orange', category: 'Internet mobile', rating: 8, region: 'Analamanga', comment: 'Connexion stable en ville.', date: '2026-10-10', sentiment: 'positif' },
  { id: 2, operator: 'yas', category: 'Internet mobile', rating: 3, region: 'Atsinanana', comment: 'Très lent le soir.', date: '2026-10-14', sentiment: 'négatif' },
  { id: 3, operator: 'airtel', category: 'Prix et facturation', rating: 6, region: 'Boeny', comment: 'Tarifs corrects.', date: '2026-10-16', sentiment: 'neutre' },
  { id: 4, operator: 'yas', category: 'Appels téléphoniques', rating: 4, region: 'Analamanga', comment: 'Appels coupés fréquemment.', date: '2026-10-17', sentiment: 'négatif' },
  { id: 5, operator: 'orange', category: 'Service client', rating: 7, region: 'Diana', comment: 'Réponse rapide.', date: '2026-10-19', sentiment: 'positif' },
]
export const USERS = [
  { id: 1, email: 'admin@demo.mg', name: 'Admin technique', role: 'admin', active: true },
  { id: 2, email: 'agent@artec.demo', name: 'Agent ARTEC', role: 'artec', active: true },
  { id: 3, email: 'orange@demo.mg', name: 'Orange Madagascar', role: 'operator', operator: 'orange', active: true },
  { id: 4, email: 'yas@demo.mg', name: 'Yas Madagascar', role: 'operator', operator: 'yas', active: true },
  { id: 5, email: 'airtel@demo.mg', name: 'Airtel Madagascar', role: 'operator', operator: 'airtel', active: true },
]
export const CASES = [{ id: 'D-001', op: 'yas', title: 'Dégradation de la latence et de la disponibilité', status: 'Vérification nécessaire' }]
export const MESSAGES = [
  { id: 1, op: 'yas', from: 'artec', kind: 'Demande d’explication', caseId: 'D-001', deadline: '2026-11-05', at: '2026-10-20T09:10:00', readBy: ['artec'], text: 'Une hausse de la latence est observée depuis plusieurs mois. Merci d’expliquer les causes et de transmettre votre plan d’action.' },
  { id: 2, op: 'orange', from: 'artec', kind: 'Félicitations', caseId: null, deadline: null, at: '2026-10-19T14:00:00', readBy: ['artec'], text: 'Les indicateurs d’Orange Madagascar respectent les seuils et progressent. L’ARTEC prend note de ces bons résultats.' },
]
