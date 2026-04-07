import { supabase } from "@/lib/supabase"
import { SettingsView } from "./SettingsView"

export const revalidate = 0

export default async function SettingsPage() {
  const { data } = await supabase
    .from("tab_audios")
    .select("tab_id, audio_url")

  const audios: Record<string, string | null> = {}
  const tabs = ["nucleo", "virais", "referencias", "headlines", "roteiro", "playbook"]
  for (const t of tabs) {
    audios[t] = data?.find((r) => r.tab_id === t)?.audio_url ?? null
  }

  const speakerImage = data?.find((r) => r.tab_id === "speaker_image")?.audio_url ?? null

  return <SettingsView initialAudios={audios} initialSpeakerImage={speakerImage} />
}
