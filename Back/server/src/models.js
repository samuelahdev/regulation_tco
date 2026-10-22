import mongoose from 'mongoose'
const { Schema, model } = mongoose

export const OPERATORS = ['orange', 'yas', 'airtel']
export const CATEGORIES = ['Appels téléphoniques','SMS','Internet mobile','Couverture réseau','Débit de téléchargement','Débit d’envoi','Latence','Stabilité de la connexion','Prix et facturation','Service client']
export const REGIONS = ['Analamanga','Atsinanana','Boeny','Diana','Haute Matsiatra','Atsimo-Andrefana','Autre']

// Sortie JSON : _id -> id, champs sensibles supprimés
const opts = { toJSON: { versionKey: false, transform: (_, r) => { r.id = String(r._id); delete r._id; delete r.passwordHash; delete r.ipHash; delete r.updatedAt } }, timestamps: true }

export const User = model('User', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'artec', 'operator'], required: true },
  operator: { type: String, enum: OPERATORS },
  active: { type: Boolean, default: true },
  passwordHash: { type: String, required: true, select: false },
}, opts))

export const Publication = model('Publication', new Schema({
  operator: { type: String, enum: OPERATORS, required: true, index: true },
  type: { type: String, enum: ['Offre', 'Promotion'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 1000 },
  date: { type: String, required: true },
}, opts))

export const Feedback = model('Feedback', new Schema({
  operator: { type: String, enum: OPERATORS, required: true, index: true },
  category: { type: String, enum: CATEGORIES, required: true },
  rating: { type: Number, min: 0, max: 10, required: true },
  region: { type: String, default: '' },
  comment: { type: String, default: '', maxlength: 500 },
  date: { type: String, required: true },
  sentiment: { type: String, enum: ['positif', 'neutre', 'négatif'], required: true },
  ipHash: { type: String, select: false, index: true }, // empreinte salée, jamais l'IP brute
}, opts))

export const QoS = model('QoS', (() => {
  const s = new Schema({ month: String, operator: { type: String, enum: OPERATORS }, down: Number, up: Number, latency: Number, availability: Number, callFail: Number }, opts)
  s.index({ operator: 1, month: 1 }, { unique: true }); return s
})())

export const Threshold = model('Threshold', new Schema({
  key: { type: String, required: true, unique: true }, order: Number, label: String, type: { type: String, enum: ['min', 'max'] }, value: { type: Number, required: true },
}, opts))

export const AuditLog = model('AuditLog', new Schema({
  actor: String, role: String, action: { type: String, index: true }, target: String, ip: String,
}, { timestamps: true }))

// ---------- Dossiers réglementaires et messagerie ARTEC <-> opérateur ----------
export const Case = model('Case', new Schema({
  code: { type: String, required: true, unique: true }, op: { type: String, enum: OPERATORS, required: true, index: true },
  title: { type: String, required: true, maxlength: 150 }, status: { type: String, default: 'Dossier en cours d’examen' },
}, { timestamps: true, toJSON: { versionKey: false, transform: (_, r) => ({ id: r.code, op: r.op, title: r.title, status: r.status }) } }))

export const Message = model('Message', new Schema({
  op: { type: String, enum: OPERATORS, required: true, index: true },
  from: { type: String, enum: ['artec', 'operator', 'bot'], required: true },
  kind: { type: String, required: true }, text: { type: String, required: true, maxlength: 2000 },
  caseId: { type: String, default: null }, deadline: { type: String, default: null }, readBy: { type: [String], default: [] },
}, { timestamps: true, toJSON: { versionKey: false, transform: (_, r) => ({ id: String(r._id), op: r.op, from: r.from, kind: r.kind, text: r.text, caseId: r.caseId, deadline: r.deadline, readBy: r.readBy, at: r.createdAt }) } }))
