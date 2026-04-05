export interface InstagramProfile {
  username: string
  fullName: string | null
  profilePicUrl: string | null
}

const APIFY_BASE = 'https://api.apify.com/v2'

async function runActorSync(usernames: string[]): Promise<any[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    throw new Error('APIFY_API_TOKEN não definido')
  }

  const url = `${APIFY_BASE}/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`

  console.log('[Apify] Chamando API para:', usernames)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernames,
      resultsLimit: usernames.length,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[Apify] Erro HTTP:', res.status, text)
    throw new Error(`Apify HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const items = await res.json()
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

async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (err) {
    console.warn('[Apify] Falha ao baixar imagem:', err)
    return null
  }
}

async function mapItem(item: any, fallbackUsername: string): Promise<InstagramProfile> {
  const cdnUrl = item.profilePicUrlHD ?? item.profilePicUrl ?? null
  const profilePicUrl = cdnUrl ? await downloadImageAsBase64(cdnUrl) : null

  return {
    username: item.username ?? fallbackUsername,
    fullName: item.fullName ?? null,
    profilePicUrl,
  }
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
  const clean = cleanUsername(username)
  if (!clean) {
    return { username: clean, fullName: null, profilePicUrl: null }
  }

  const items = await runActorSync([clean])
  const item = items[0]

  if (!item) {
    console.warn('[Apify] Sem resultado para:', clean)
    return { username: clean, fullName: null, profilePicUrl: null }
  }

  const result = await mapItem(item, clean)
  console.log('[Apify] Perfil:', result.username, '- foto:', result.profilePicUrl ? 'OK' : 'VAZIO')
  return result
}

export async function fetchInstagramProfiles(usernames: string[]): Promise<InstagramProfile[]> {
  const clean = usernames.map(cleanUsername).filter(Boolean)
  if (clean.length === 0) return []

  const items = await runActorSync(clean)
  return Promise.all(items.map((item: any) => mapItem(item, '')))
}
