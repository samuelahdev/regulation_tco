// Moteur d'analyse prédictive (statistique, explicable). Réutilisable côté serveur Node à l'étape backend.
export const MIN_POINTS = 6
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const cdf = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const p = 0.3989423 * Math.exp(-z * z / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p }

export function fit(ys) { // régression linéaire simple
  const n = ys.length, mx = (n - 1) / 2, my = mean(ys); let sxy = 0, sxx = 0
  ys.forEach((y, i) => { sxy += (i - mx) * (y - my); sxx += (i - mx) ** 2 })
  const slope = sxy / sxx, b = my - slope * mx, res = ys.map((y, i) => y - (b + slope * i))
  return { n, mx, sxx, slope, b, res, s: Math.sqrt(res.reduce((a, r) => a + r * r, 0) / (n - 2)) || 1e-9 }
}
export function forecast(ys, h = 3) { // prévision + intervalle ≈ 95 %
  const m = fit(ys)
  return Array.from({ length: h }, (_, k) => { const x = m.n + k, yhat = m.b + m.slope * x, se = m.s * Math.sqrt(1 + 1 / m.n + (x - m.mx) ** 2 / m.sxx); return { yhat, se, lo: yhat - 2 * se, hi: yhat + 2 * se } })
}
export const addMonths = (ym, k) => { const [y, m] = ym.split('-').map(Number), t = y * 12 + m - 1 + k; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` }

export function analyzeOperator(rows, thresholds, h = 3) {
  if (rows.length < MIN_POINTS) return { enough: false, indicators: [], risk: 0, level: 'Données insuffisantes', anomalies: [] }
  const indicators = thresholds.map((t) => {
    const ys = rows.map((r) => r[t.key]), m = fit(ys), f = forecast(ys, h), cur = ys[ys.length - 1]
    const probs = f.map((p) => (t.type === 'max' ? 1 - cdf((t.value - p.yhat) / p.se) : cdf((t.value - p.yhat) / p.se)))
    const anomalies = m.res.map((r, i) => (Math.abs(r / m.s) > 2 ? { month: rows[i].month, value: ys[i], key: t.key, label: t.label } : null)).filter(Boolean)
    return { ...t, current: cur, slope: m.slope, forecast: f, prob: Math.max(...probs), anomalies, breached: t.type === 'max' ? cur > t.value : cur < t.value }
  })
  const risk = Math.max(...indicators.map((i) => i.prob))
  return { enough: true, indicators, risk, level: risk < 0.2 ? 'Faible' : risk < 0.5 ? 'Modéré' : 'Élevé', anomalies: indicators.flatMap((i) => i.anomalies) }
}
export const explain = (i) => `${i.label} : valeur actuelle ${i.current}, tendance ${i.slope > 0 ? '+' : ''}${i.slope.toFixed(2)}/mois, projection à 3 mois ${i.forecast[2].yhat.toFixed(2)} (intervalle 95 % : ${i.forecast[2].lo.toFixed(2)} à ${i.forecast[2].hi.toFixed(2)}), seuil ${i.type === 'min' ? '≥' : '≤'} ${i.value}, probabilité de dépassement ${Math.round(i.prob * 100)} %.`

// Brouillon destiné à l'agent : il le relit et décide de l'envoyer. Aucun envoi automatique.
export function draftMessage(name, a) {
  if (!a.enough) return { type: 'Observation', text: `Données insuffisantes pour ${name} : merci de transmettre l’historique mensuel des indicateurs de qualité de service.` }
  const risky = a.indicators.filter((i) => i.breached || i.prob >= 0.2)
  if (!risky.length) return { type: 'Félicitations', text: `Les indicateurs de ${name} respectent les seuils configurés et leur tendance reste favorable. L’ARTEC prend note de ces bons résultats.` }
  return { type: 'Demande d’explication', text: `Dans le cadre du suivi de la qualité de service, une analyse statistique indicative relève pour ${name} :\n${risky.map((i) => '- ' + explain(i)).join('\n')}\nCette analyse n’est pas une preuve d’infraction. Merci de transmettre vos explications et justificatifs éventuels.` }
}
