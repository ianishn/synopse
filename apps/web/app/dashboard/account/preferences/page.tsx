/** Compte > Préférences : langue de l'interface + notifications Telegram. */
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { PreferencesPanel } from "./preferences-panel";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const lang = await getLang();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = createServiceClient();
  const { data: settings } = await db.from("user_settings")
    .select("telegram_chat_id").eq("user_id", user!.id).maybeSingle();

  return <PreferencesPanel lang={lang} telegramLinked={Boolean(settings?.telegram_chat_id)} />;
}
