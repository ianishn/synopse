/**
 * Langue de l'app (hors landing). Mémorisée dans un cookie `lang`, posé automatiquement
 * quand l'utilisateur visite /en, et changeable depuis l'app (bouton FR/EN).
 */
import { cookies } from "next/headers";

export type Lang = "fr" | "en";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "en" ? "en" : "fr";
}

/** Libellés de l'app (dashboard, admin, compte). */
export const UI = {
  fr: {
    rules: "Règles", journal: "Journal", account: "Compte", admin: "Admin", signout: "Se déconnecter",
    dashboard: "Tableau de bord", backToDashboard: "← Tableau de bord",
    allGood: "Tout va bien. Tes agents sont surveillés.",
    pendingOne: "action attend ta validation.", pendingMany: "actions attendent ta validation.",
    frozen: "Incident, tes agents sont gelés.", silent: "Attention, un agent ne répond plus.",
    capReached: "Plafond de dépense atteint.",
    myAgents: "Mes agents", connectAgent: "+ Connecter un agent",
    noAgent: "Aucun agent connecté.", connectFirst: "Connecte ton premier agent",
    activeRules: "Règles actives", fullLibrary: "Bibliothèque complète",
    spend: "Dépenses API & plafond", killSwitch: "Arrêt d'urgence",
    subscription: "Compte & abonnement", seeAll: "Tout voir",
    pilot: "Pilotage", users: "Utilisateurs", revenue: "MRR estimé", arr: "ARR estimé",
    paidSubs: "Abonnés payants", conversion: "Conversion", byPlan: "Répartition par forfait",
    evolution: "Évolution dans le temps", email: "Email", signedUp: "Inscrit le", plan: "Forfait",
  },
  en: {
    rules: "Rules", journal: "Log", account: "Account", admin: "Admin", signout: "Sign out",
    dashboard: "Dashboard", backToDashboard: "← Dashboard",
    allGood: "All clear. Your agents are being watched.",
    pendingOne: "action awaits your approval.", pendingMany: "actions await your approval.",
    frozen: "Incident: your agents are frozen.", silent: "Heads up: an agent stopped responding.",
    capReached: "Spending cap reached.",
    myAgents: "My agents", connectAgent: "+ Connect an agent",
    noAgent: "No agent connected.", connectFirst: "Connect your first agent",
    activeRules: "Active rules", fullLibrary: "Full library",
    spend: "API spend & cap", killSwitch: "Emergency stop",
    subscription: "Account & subscription", seeAll: "See all",
    pilot: "Control", users: "Users", revenue: "Est. MRR", arr: "Est. ARR",
    paidSubs: "Paying subscribers", conversion: "Conversion", byPlan: "Breakdown by plan",
    evolution: "Over time", email: "Email", signedUp: "Signed up", plan: "Plan",
  },
} as const;
