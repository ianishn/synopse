/** Lecture de la langue côté serveur (cookie posé par la landing / le bouton FR-EN). */
import { cookies } from "next/headers";
import type { Lang } from "./lang";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "en" ? "en" : "fr";
}
