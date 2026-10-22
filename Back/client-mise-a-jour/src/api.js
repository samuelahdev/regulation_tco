let token = sessionStorage.getItem('token')
export const setToken = (t) => { token = t; t ? sessionStorage.setItem('token', t) : sessionStorage.removeItem('token') }
export async function api(path, { method = 'GET', body } = {}) {
  let res
  try { res = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined }) }
  catch { throw new Error('Serveur injoignable. Vérifiez que l’API est démarrée.') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erreur serveur.')
  return data
}
