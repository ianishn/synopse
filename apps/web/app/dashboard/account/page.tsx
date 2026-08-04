/** Compte > Profil. */
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.name as string) ?? "";
  return <ProfileForm email={user?.email ?? ""} name={name} />;
}
