import PageLegale from "../../components/PageLegale";
import { mentionsLegales } from "../../lib/legal";
import { getLocaleServeur } from "../../lib/locale-server";

export const metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergement, propriété intellectuelle et droit applicable du site BOCARO.",
  alternates: { canonical: "/mentions-legales" },
  openGraph: { url: "/mentions-legales", title: "Mentions légales | BOCARO" },
};

export default async function MentionsLegalesPage() {
  const locale = await getLocaleServeur();
  return <PageLegale contenu={mentionsLegales(locale)} locale={locale} />;
}
