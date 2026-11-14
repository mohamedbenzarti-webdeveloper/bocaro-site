// Textes légaux : complets dans les trois langues, et la durée de
// conservation annoncée correspond à celle appliquée par la base.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { confidentialite, mentionsLegales, mentionsManquantes, RETENTION_DEVIS_MOIS, MISE_A_JOUR } from "../legal";
import { locales } from "../translations";

const forme = (c) => c.sections.map((s) => [s.texte?.length ?? 0, s.liste?.length ?? 0, Boolean(s.lien)]);
const toutLeTexte = (c) => JSON.stringify(c);

describe("politique de confidentialité", () => {
  it.each(locales)("est complète en %s", (l) => {
    const c = confidentialite(l);
    expect(c.titre.length).toBeGreaterThan(5);
    expect(toutLeTexte(c)).not.toMatch(/undefined|null|\$\{/);
    expect(toutLeTexte(c)).toContain(String(RETENTION_DEVIS_MOIS));
    expect(toutLeTexte(c)).toContain("bocaro_tunisia@yahoo.com");
  });

  it("a la même structure dans les trois langues", () => {
    expect(forme(confidentialite("en"))).toEqual(forme(confidentialite("fr")));
    expect(forme(confidentialite("ar"))).toEqual(forme(confidentialite("fr")));
  });

  it("cite le cadre légal tunisien et l'autorité de contrôle", () => {
    const fr = toutLeTexte(confidentialite("fr"));
    expect(fr).toContain("2004-63");
    expect(fr).toContain("INPDP");
    expect(fr).toContain("RGPD");
  });

  it("décrit tous les cookies et stockages réellement utilisés par le code", () => {
    const fr = toutLeTexte(confidentialite("fr"));
    const code = ["context/LanguageContext.js", "components/ThemeToggle.js"]
      .map((f) => readFileSync(join(process.cwd(), f), "utf8"))
      .join("\n");
    for (const nom of new Set(code.match(/bocaro-[a-z]+/g))) expect(fr, nom).toContain(nom);
  });

  it("une langue inconnue retombe sur le français", () => {
    expect(confidentialite("de")).toBe(confidentialite("fr"));
  });
});

describe("mentions légales", () => {
  it.each(locales)("sont complètes en %s, sans champ vide affiché", (l) => {
    const c = mentionsLegales(l);
    expect(toutLeTexte(c)).not.toMatch(/undefined|null|\$\{/);
    expect(c.sections.some((s) => s.lien?.href === "/confidentialite")).toBe(true);
  });

  it("ont la même structure dans les trois langues", () => {
    expect(forme(mentionsLegales("en"))).toEqual(forme(mentionsLegales("fr")));
    expect(forme(mentionsLegales("ar"))).toEqual(forme(mentionsLegales("fr")));
  });

  it("écrivent les numéros de téléphone de gauche à droite, même en arabe", () => {
    const ligne = mentionsLegales("ar").sections[0].texte[2];
    expect(ligne).toContain("⁦+216 98 514 014⁩");
    expect(ligne).toContain("⁦+216 22 447 900⁩");
  });

  it("listent les informations de l'entreprise encore à compléter", () => {
    expect(mentionsManquantes()).toEqual(expect.arrayContaining(["matriculeFiscal", "hebergeur"]));
  });
});

describe("durée de conservation des demandes de devis", () => {
  const sql = readFileSync(join(process.cwd(), "sql", "migration_v9.sql"), "utf8");

  it("la base supprime les demandes après la durée annoncée aux visiteurs", () => {
    expect(sql).toContain(`interval '${RETENTION_DEVIS_MOIS} months'`);
  });

  it("la suppression est planifiée chaque nuit et non appelable par les visiteurs", () => {
    expect(sql).toMatch(/cron\.schedule\(\s*'purger-demandes-devis',\s*'0 3 \* \* \*'/);
    expect(sql).toMatch(/revoke all on function public\.purger_demandes_devis\(\) from public, anon, authenticated/);
    expect(sql).toMatch(/security definer\s+set search_path = public/);
  });

  it("la date de mise à jour est valide", () => {
    expect(new Date(MISE_A_JOUR).toString()).not.toBe("Invalid Date");
  });
});
