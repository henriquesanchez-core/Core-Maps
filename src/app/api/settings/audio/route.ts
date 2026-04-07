import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VALID_TABS = ['nucleo', 'virais', 'referencias', 'headlines', 'roteiro', 'playbook']

// GET — return all tab audios
export async function GET() {
  const { data, error } = await supabase
    .from('tab_audios')
    .select('tab_id, audio_url')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const audios: Record<string, string | null> = {}
  for (const tab of VALID_TABS) {
    audios[tab] = data?.find((r) => r.tab_id === tab)?.audio_url ?? null
  }

  return NextResponse.json(audios)
}

// POST — upload audio file for a tab
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const tabId = formData.get('tab_id') as string
  const file = formData.get('file') as File | null

  if (!tabId || !VALID_TABS.includes(tabId)) {
    return NextResponse.json({ error: 'tab_id inválido' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'mp3'
  const path = `${tabId}/${Date.now()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('audios')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('audios').getPublicUrl(path)
  const audioUrl = urlData.publicUrl

  // Upsert into tab_audios table
  const { error: dbError } = await supabase
    .from('tab_audios')
    .upsert({ tab_id: tabId, audio_url: audioUrl, updated_at: new Date().toISOString() })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ tab_id: tabId, audio_url: audioUrl })
}

// DELETE — remove audio for a tab
export async function DELETE(req: NextRequest) {
  const { tab_id: tabId } = await req.json()

  if (!tabId || !VALID_TABS.includes(tabId)) {
    return NextResponse.json({ error: 'tab_id inválido' }, { status: 400 })
  }

  // Get current audio URL to delete from storage
  const { data: row } = await supabase
    .from('tab_audios')
    .select('audio_url')
    .eq('tab_id', tabId)
    .single()

  if (row?.audio_url) {
    // Extract storage path from URL
    const url = new URL(row.audio_url)
    const storagePath = url.pathname.split('/storage/v1/object/public/audios/')[1]
    if (storagePath) {
      await supabase.storage.from('audios').remove([decodeURIComponent(storagePath)])
    }
  }

  await supabase.from('tab_audios').delete().eq('tab_id', tabId)

  return NextResponse.json({ success: true })
}
