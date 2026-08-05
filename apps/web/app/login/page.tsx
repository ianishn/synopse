/** Page de connexion : lit la langue (cookie posé par la landing) et rend le formulaire. */
import { getLang } from "@/lib/lang-server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const lang = await getLang();
  return <LoginForm lang={lang} />;
}
