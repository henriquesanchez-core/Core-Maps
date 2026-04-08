import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabasePublic } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const VALID_TABS = ['nucleo', 'virais', 'referencias', 'headlines', 'roteiro', 'playbook', 'speaker_image']
const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/audios/'

function getStoragePathFromPublicUrl(audioUrl: string): string | null {
  try {
    const url = new URL(audioUrl)
    const index = url.pathname.indexOf(STORAGE_PUBLIC_PREFIX)
    if (index === -1) return null
    return decodeURIComponent(url.pathname.slice(index + STORAGE_PUBLIC_PREFIX.length))
  } catch {
    return null
  }
}

// GET — return all tab audios
export async function GET() {
  const { data, error } = await supabasePublic
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
  try {
    await requireAdmin(req)
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: 'Failed to validate authentication.' }, { status: 500 })
  }

  const formData = await req.formData()
  const tabId = formData.get('tab_id') as string
  const file = formData.get('file') as File | null

  if (!tabId || !VALID_TABS.includes(tabId)) {
    return NextResponse.json({ error: 'tab_id inválido' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
  }

  const { data: existingAudio, error: existingAudioError } = await supabaseAdmin
    .from('tab_audios')
    .select('audio_url')
    .eq('tab_id', tabId)
    .maybeSingle()

  if (existingAudioError && existingAudioError.code !== 'PGRST116') {
    return NextResponse.json({ error: existingAudioError.message }, { status: 500 })
  }

  const previousStoragePath = existingAudio?.audio_url
    ? getStoragePathFromPublicUrl(existingAudio.audio_url)
    : null
  const ext = file.name.split('.').pop() || 'mp3'
  const path = `${tabId}/${Date.now()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('audios')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('audios').getPublicUrl(path)
  const audioUrl = urlData.publicUrl

  // Upsert into tab_audios table
  const { error: dbError } = await supabaseAdmin
    .from('tab_audios')
    .upsert({ tab_id: tabId, audio_url: audioUrl, updated_at: new Date().toISOString() })

  if (dbError) {
    const { error: cleanupError } = await supabaseAdmin.storage.from('audios').remove([path])

    if (cleanupError) {
      console.error('[audio][POST] Upload rollback failed after DB upsert error', {
        tabId,
        uploadedPath: path,
        dbError: dbError.message,
        cleanupError: cleanupError.message,
      })
      return NextResponse.json(
        {
          error: dbError.message,
          detail: `Upload rollback failed: ${cleanupError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: dbError.message,
        detail: 'Upload reverted after database failure.',
      },
      { status: 500 }
    )
  }

  if (previousStoragePath && previousStoragePath !== path) {
    const { error: oldFileDeleteError } = await supabaseAdmin.storage
      .from('audios')
      .remove([previousStoragePath])

    if (oldFileDeleteError) {
      console.error('[audio][POST] DB updated but failed to delete old file', {
        tabId,
        oldPath: previousStoragePath,
        oldFileDeleteError: oldFileDeleteError.message,
      })
      return NextResponse.json(
        {
          error: oldFileDeleteError.message,
          detail: 'Database updated but failed to delete old file.',
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ tab_id: tabId, audio_url: audioUrl })
}

// DELETE — remove audio for a tab
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req)
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: 'Failed to validate authentication.' }, { status: 500 })
  }

  const { tab_id: tabId } = await req.json()

  if (!tabId || !VALID_TABS.includes(tabId)) {
    return NextResponse.json({ error: 'tab_id inválido' }, { status: 400 })
  }

  // Get current audio URL to delete from storage
  const { data: row, error: selectError } = await supabaseAdmin
    .from('tab_audios')
    .select('audio_url')
    .eq('tab_id', tabId)
    .maybeSingle()

  if (selectError && selectError.code !== 'PGRST116') {
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  let removedStoragePath: string | null = null
  if (row?.audio_url) {
    const storagePath = getStoragePathFromPublicUrl(row.audio_url)
    if (storagePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('audios')
        .remove([storagePath])

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message, detail: 'Failed to remove file from storage.' },
          { status: 500 }
        )
      }

      removedStoragePath = storagePath
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('tab_audios')
    .delete()
    .eq('tab_id', tabId)

  if (deleteError) {
    if (removedStoragePath) {
      console.error('[audio][DELETE] Storage removed but database delete failed', {
        tabId,
        orphanedPath: removedStoragePath,
        deleteError: deleteError.message,
      })
    }

    return NextResponse.json(
      {
        error: deleteError.message,
        detail: removedStoragePath
          ? `Storage file removed but DB delete failed. Orphaned path logged: ${removedStoragePath}`
          : 'Failed to delete audio row from database.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
