import PageLegale from "../../components/PageLegale";
import { confidentialite } from "../../lib/legal";
import { getLocaleServeur } from "../../lib/locale-server";

export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Données personnelles recueillies par le site BOCARO, finalités, durée de conservation, cookies, services tiers et exercice de vos droits (loi organique n° 2004-63).",
  alternates: { canonical: "/confidentialite" },
  openGraph: { url: "/confidentialite", title: "Politique de confidentialité | BOCARO" },
};

export default async function ConfidentialitePage() {
  const locale = await getLocaleServeur();
  return <PageLegale contenu={confidentialite(locale)} locale={locale} />;
}
