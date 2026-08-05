export const metadata = { title: "CGV, Synopse" };
export default function Page() {
  return (
    <>
      <h1>Conditions générales de vente</h1>
      <h2>1. Objet</h2>
      <p>Synopse fournit un service de supervision d&apos;agents IA : validation d&apos;actions sensibles, plafonds de dépense, arrêt d&apos;urgence, journal et rapports. Le service est un <b>filet de sécurité</b> : il réduit les risques sans garantir une protection absolue.</p>
      <h2>2. Abonnements et prix</h2>
      <p>Plans : Gratuit (0 €), Protégé (9,99 € TTC/mois ou 99 € TTC/an), Studio (19,99 € TTC/mois ou 199 € TTC/an). Paiement mensuel par carte via Stripe, TVA collectée selon le pays de résidence. Résiliation à tout moment depuis le portail client ; l&apos;accès reste actif jusqu&apos;à la fin de la période payée.</p>
      <h2>3. Droit de rétractation</h2>
      <p>Conformément à l&apos;article L221-28 du Code de la consommation, le service numérique étant fourni immédiatement, le client renonce à son droit de rétractation au moment de la souscription.</p>
      <h2>4. Responsabilité</h2>
      <p>Synopse ne peut être tenu responsable des actions exécutées par l&apos;agent du client, y compris en cas de contournement du dispositif par une attaque. L&apos;architecture est conçue « fail-safe » : en cas d&apos;indisponibilité du service, les règles bloquantes s&apos;appliquent localement par défaut.</p>
      <h2>5. Droit applicable</h2>
      <p>Droit français. Litiges : tentative de résolution amiable préalable, puis tribunaux compétents français.</p>
    </>
  );
}
