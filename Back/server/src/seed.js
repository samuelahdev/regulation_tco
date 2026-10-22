import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User, Publication, Feedback, QoS, Threshold, Case, Message, OPERATORS } from './models.js'

if (process.env.NODE_ENV === 'production') { console.error('Seed interdit en production.'); process.exit(1) }
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artec')
await Promise.all([User, Publication, Feedback, QoS, Threshold, Case, Message].map((m) => m.deleteMany({})))

const passwordHash = await bcrypt.hash('demo123', 10)
await User.insertMany([
  { email: 'admin@demo.mg', name: 'Admin technique', role: 'admin' }, { email: 'agent@artec.demo', name: 'Agent ARTEC', role: 'artec' },
  { email: 'orange@demo.mg', name: 'Orange Madagascar', role: 'operator', operator: 'orange' },
  { email: 'yas@demo.mg', name: 'Yas Madagascar', role: 'operator', operator: 'yas' },
  { email: 'airtel@demo.mg', name: 'Airtel Madagascar', role: 'operator', operator: 'airtel' },
].map((u) => ({ ...u, passwordHash })))

await Publication.insertMany([
  { operator: 'orange', type: 'Offre', title: 'Forfait Internet 10 Go', body: '10 Go valables 30 jours. Comment évaluez-vous la qualité de notre connexion Internet mobile dans votre région ?', date: '2026-10-12' },
  { operator: 'yas', type: 'Promotion', title: 'Bonus appels week-end', body: 'Appels vers tous les réseaux avec bonus de 50 % le samedi et le dimanche.', date: '2026-10-15' },
  { operator: 'airtel', type: 'Offre', title: 'Pack SMS illimités', body: 'SMS illimités vers tous les réseaux pendant 7 jours.', date: '2026-10-18' },
])
await Feedback.insertMany([
  { operator: 'orange', category: 'Internet mobile', rating: 8, region: 'Analamanga', comment: 'Connexion stable en ville.', date: '2026-10-10', sentiment: 'positif' },
  { operator: 'yas', category: 'Internet mobile', rating: 3, region: 'Atsinanana', comment: 'Très lent le soir.', date: '2026-10-14', sentiment: 'négatif' },
  { operator: 'airtel', category: 'Prix et facturation', rating: 6, region: 'Boeny', comment: 'Tarifs corrects.', date: '2026-10-16', sentiment: 'neutre' },
  { operator: 'yas', category: 'Appels téléphoniques', rating: 4, region: 'Analamanga', comment: 'Appels coupés fréquemment.', date: '2026-10-17', sentiment: 'négatif' },
  { operator: 'orange', category: 'Service client', rating: 7, region: 'Diana', comment: 'Réponse rapide.', date: '2026-10-19', sentiment: 'positif' },
])

// 12 mois de mesures SYNTHÉTIQUES (même générateur que le frontend)
const MONTHS = Array.from({ length: 12 }, (_, i) => { const t = 2025 * 12 + 10 + i; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` })
const noise = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 3.1 + k) * 0.5
const AMP = { down: 0.25, latency: 2, availability: 0.06, callFail: 0.08 }
const PROFILE = {
  orange: { down: [8.4, 0.14], latency: [66, -0.7], availability: [99.3, 0.02], callFail: [1.8, -0.03] },
  yas: { down: [8.2, -0.2], latency: [68, 1.5], availability: [99.3, -0.06], callFail: [1.7, 0.08] },
  airtel: { down: [6.0, 0.05], latency: [73, -0.2], availability: [99.2, 0.01], callFail: [1.9, -0.02] },
}
await QoS.insertMany(OPERATORS.flatMap((op, oi) => MONTHS.map((month, i) => {
  const row = { operator: op, month }
  Object.keys(AMP).forEach((k, j) => {
    let v = PROFILE[op][k][0] + PROFILE[op][k][1] * i + noise(i, j + oi * 5) * AMP[k]
    if (op === 'airtel' && k === 'callFail' && i === 7) v += 1.4 // anomalie simulée
    row[k] = +Math.min(v, k === 'availability' ? 99.95 : 1e9).toFixed(2)
  })
  return row
})))
// Seuils d'EXEMPLE à remplacer par les seuils officiels
await Threshold.insertMany([
  { key: 'down', order: 1, label: 'Débit descendant (Mbit/s)', type: 'min', value: 5 },
  { key: 'latency', order: 2, label: 'Latence (ms)', type: 'max', value: 80 },
  { key: 'availability', order: 3, label: 'Disponibilité (%)', type: 'min', value: 99 },
  { key: 'callFail', order: 4, label: 'Échec des appels (%)', type: 'max', value: 2 },
])
await Case.create({ code: 'D-001', op: 'yas', title: 'Dégradation de la latence et de la disponibilité' })
await Message.insertMany([
  { op: 'yas', from: 'artec', kind: 'Demande d’explication', caseId: 'D-001', deadline: '2026-11-05', readBy: ['artec'], createdAt: new Date('2026-10-20T09:10:00'), text: 'Une hausse de la latence est observée depuis plusieurs mois. Merci d’expliquer les causes et de transmettre votre plan d’action.' },
  { op: 'orange', from: 'artec', kind: 'Félicitations', readBy: ['artec'], createdAt: new Date('2026-10-19T14:00:00'), text: 'Les indicateurs d’Orange Madagascar respectent les seuils et progressent. L’ARTEC prend note de ces bons résultats.' },
])
console.log('Base initialisée (données synthétiques). Comptes : admin@demo.mg, agent@artec.demo, orange@demo.mg, yas@demo.mg, airtel@demo.mg — mot de passe : demo123')
await mongoose.disconnect()
