import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import mongoose from 'mongoose'
import routes from './routes.js'
import { errors } from './middleware.js'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  console.error('JWT_SECRET manquant ou trop court (24 caractères minimum). Copiez .env.example en .env et modifiez-le.')
  process.exit(1)
}
const app = express()
app.set('trust proxy', process.env.TRUST_PROXY === '1')
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50kb' }))
app.get('/api/health', (q, s) => s.json({ ok: true }))
app.use('/api', routes)
app.use((q, s) => s.status(404).json({ error: 'Route introuvable.' }))
app.use(errors)

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artec', { serverSelectionTimeoutMS: 5000 })
} catch (e) {
  console.error('Connexion MongoDB impossible :', e.message, '\nVérifiez que MongoDB est démarré ou que MONGODB_URI est correct.')
  process.exit(1)
}
const port = process.env.PORT || 5000
app.listen(port, () => console.log(`API ARTEC prête sur http://localhost:${port}/api`))
