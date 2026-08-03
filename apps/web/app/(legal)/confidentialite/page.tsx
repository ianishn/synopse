export const metadata = { title: "Politique de confidentialité — Synopse" };
export default function Page() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <h2>Ce que nous collectons</h2>
      <p>Compte : email. Fonctionnement : métadonnées des actions sensibles de ton agent (résumé, horodatage), compteurs de consommation, identifiant de chat Telegram si tu relies ton compte. Le contenu détaillé des actions en attente de validation est chiffré et supprimé au plus tard après 90 jours.</p>
      <h2>Ce que nous ne collectons pas</h2>
      <p>Les règles sont évaluées localement chez ton agent : les actions non sensibles ne quittent jamais ta machine. Nous ne vendons aucune donnée.</p>
      <h2>Où et combien de temps</h2>
      <p>Données hébergées dans l&apos;Union européenne (Supabase, Francfort). Journal : 90 jours maximum. Compte supprimé = données supprimées (cascade complète).</p>
      <h2>Tes droits (RGPD)</h2>
      <p>Accès, rectification, effacement, portabilité : écris à pro.ianis.hein@gmail.com. Tu peux aussi introduire une réclamation auprès de la CNIL.</p>
      <h2>Sous-traitants</h2>
      <p>Supabase (données, UE), Vercel (hébergement applicatif), Stripe (paiement), Telegram (notifications que tu choisis d&apos;activer), PostHog UE (mesure d&apos;audience anonyme).</p>
    </>
  );
}
