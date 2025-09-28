export async function apiGet<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store' })

  if (!r.ok) throw new Error(await r.text())

  return r.json()
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!r.ok) throw new Error(await r.text())

  return r.json()
}

export async function apiPatch<T>(url: string, body?: any): Promise<T> {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!r.ok) throw new Error(await r.text())

  return r.json()
}
