/** Gestion des règles (F2), catalogue FR groupé par profil, activation en un clic. */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { RULES_CATALOG } from "@synopse/shared";
import { maxRules, planForUser } from "@/lib/plan";
import { RulesManager } from "./rules-manager";
import { CustomRules, type CustomRule } from "./custom-rules";
import { getLang } from "@/lib/lang-server";
import { UI } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lang = await getLang();
  const ui = UI[lang];
  const db = createServiceClient();
  const { data: rules } = await db.from("rules")
    .select("id, template_id, enabled, severity, params_json").eq("user_id", user.id);
  const enabled = new Set((rules ?? []).filter((r) => r.enabled && r.template_id).map((r) => r.template_id));
  const customRules: CustomRule[] = (rules ?? [])
    .filter((r) => !r.template_id)
    .map((r) => ({
      id: r.id, enabled: r.enabled, severity: r.severity,
      label: String((r.params_json as { label_fr?: string })?.label_fr ?? "Règle personnalisée"),
    }));
  const plan = await planForUser(db, user.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight">
            synopse<span className="text-mint-500">.</span>
          </a>
          <a className="text-sm text-ink-500 hover:text-ink-900" href="/dashboard">← Tableau de bord</a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold">{ui.myRules}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {ui.rulesSub}
          </p>
        </div>
        <CustomRules rules={customRules} plan={plan} lang={lang} />
        <RulesManager
          catalog={RULES_CATALOG.map((t) => ({
            id: t.id, label: (lang === "en" ? t.label_en : t.label_fr) ?? t.label_fr, description: (lang === "en" ? t.description_en : t.description_fr) ?? t.description_fr,
            severity: t.default_severity, profiles: t.profiles,
          }))}
          enabledIds={[...enabled]}
          limit={maxRules(plan)}
          plan={plan}
          lang={lang}
        />
      </main>
    </div>
  );
}
