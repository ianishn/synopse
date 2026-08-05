/** Compte > Profil. */
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { getLang } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.name as string) ?? "";
  const lang = await getLang();
  return <ProfileForm email={user?.email ?? ""} name={name} lang={lang} />;
}
