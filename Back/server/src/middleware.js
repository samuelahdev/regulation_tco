import jwt from 'jsonwebtoken'
import { ZodError } from 'zod'
import { User, AuditLog } from './models.js'

export const h = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// Vérifie le jeton ET que le compte existe toujours et n'est pas suspendu
export const auth = h(async (req, res, next) => {
  const t = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!t) return res.status(401).json({ error: 'Authentification requise.' })
  let p
  try { p = jwt.verify(t, process.env.JWT_SECRET) } catch { return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' }) }
  const u = await User.findById(p.sub)
  if (!u || !u.active) return res.status(401).json({ error: 'Compte indisponible.' })
  req.user = { id: String(u._id), role: u.role, operator: u.operator, email: u.email }
  next()
})

export const role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Accès refusé pour votre rôle.' })

export async function audit(req, action, target = '', actor = req.user) {
  try { await AuditLog.create({ actor: actor?.email, role: actor?.role, action, target, ip: req.ip }) } catch (e) { console.error('audit', e.message) }
}

export const errors = (err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: `Champ invalide : ${err.issues[0].path.join('.') || 'requête'}.` })
  console.error(err)
  res.status(500).json({ error: 'Erreur interne du serveur.' })
}
