import { supabasePublic } from "@/lib/supabase"
import { MAP_TAB_IDS, TAB_IDS } from "@/lib/constants"
import { SettingsView } from "./SettingsView"

export const revalidate = 0

export default async function SettingsPage() {
  const { data } = await supabasePublic
    .from("tab_audios")
    .select("tab_id, audio_url")

  const audios: Record<string, string | null> = {}
  for (const t of MAP_TAB_IDS) {
    audios[t] = data?.find((r) => r.tab_id === t)?.audio_url ?? null
  }

  const speakerImage = data?.find((r) => r.tab_id === TAB_IDS.speaker_image)?.audio_url ?? null

  return <SettingsView initialAudios={audios} initialSpeakerImage={speakerImage} />
}
