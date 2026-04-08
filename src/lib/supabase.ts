import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton: createClient is only called on first property access,
// which happens during request handling — never during build-time module evaluation.
function lazyClient(getUrl: () => string, getKey: () => string): SupabaseClient {
  let _client: SupabaseClient | null = null
  function instance() {
    if (!_client) {
      _client = createClient(getUrl(), getKey(), {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    }
    return _client
  }
  return new Proxy({} as SupabaseClient, {
    get(_, prop) {
      const val = (instance() as any)[prop]
      return typeof val === 'function' ? val.bind(instance()) : val
    },
  })
}

export const supabasePublic = lazyClient(
  () => process.env.NEXT_PUBLIC_SUPABASE_URL!,
  () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const supabaseAdmin = lazyClient(
  () => process.env.NEXT_PUBLIC_SUPABASE_URL!,
  () => process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
