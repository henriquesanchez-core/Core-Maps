export interface InstagramProfile {
  username: string
  fullName: string | null
  profilePicUrl: string | null
}

const APIFY_BASE = 'https://api.apify.com/v2'

function combineSignals(a: AbortSignal, b?: AbortSignal): AbortSignal {
  if (!b) return a
  const controller = new AbortController()
  const abort = (reason?: unknown) => controller.abort(reason)
  a.addEventListener('abort', () => abort(a.reason), { once: true })
  b.addEventListener('abort', () => abort(b.reason), { once: true })
  if (a.aborted) controller.abort(a.reason)
  if (b.aborted) controller.abort(b.reason)
  return controller.signal
}

async function runActorSync(usernames: string[], signal?: AbortSignal): Promise<any[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN não definido')

  const url = `${APIFY_BASE}/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items`
  const combined = combineSignals(AbortSignal.timeout(30_000), signal)

  console.log('[Apify] Chamando API para:', usernames)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ usernames, resultsLimit: usernames.length }),
    signal: combined,
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[Apify] Erro HTTP:', res.status, text)
    throw new Error(`Apify HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const items = await res.json()
  if (!Array.isArray(items)) {
    throw new Error(`Apify retornou formato inesperado: ${JSON.stringify(items).slice(0, 200)}`)
  }
  console.log('[Apify] Retornados:', items.length, 'items')
  return items
}

function cleanUsername(u: string): string {
  return u
    .replace('@', '')
    .replace(/https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '')
    .trim()
}

function mapItem(item: any, fallbackUsername: string): InstagramProfile {
  return {
    username: item.username ?? fallbackUsername,
    fullName: item.fullName ?? null,
    profilePicUrl: item.profilePicUrlHD ?? item.profilePicUrl ?? null,
  }
}

export async function fetchInstagramProfile(username: string, signal?: AbortSignal): Promise<InstagramProfile> {
  const clean = cleanUsername(username)
  if (!clean) return { username: clean, fullName: null, profilePicUrl: null }

  const items = await runActorSync([clean], signal)
  const item = items[0]
  if (!item) {
    console.warn('[Apify] Sem resultado para:', clean)
    return { username: clean, fullName: null, profilePicUrl: null }
  }

  const result = mapItem(item, clean)
  console.log('[Apify] Perfil:', result.username, '- foto:', result.profilePicUrl ? 'OK' : 'VAZIO')
  return result
}

export async function fetchInstagramProfiles(usernames: string[], signal?: AbortSignal): Promise<InstagramProfile[]> {
  const clean = usernames.map(cleanUsername).filter(Boolean)
  if (clean.length === 0) return []
  const items = await runActorSync(clean, signal)
  return items.map((item: any) => mapItem(item, ''))
}
