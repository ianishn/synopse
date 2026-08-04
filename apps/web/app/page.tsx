import { Landing } from "./landing/landing";

/** Visiter la landing FR remet la langue de l'app en français. */
export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `document.cookie="lang=fr;path=/;max-age=31536000;samesite=lax"` }} />
      <Landing lang="fr" />
    </>
  );
}
