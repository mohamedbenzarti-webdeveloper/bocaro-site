// @vitest-environment jsdom
// Recherche des carreaux (page Produits et étape Carrelage du simulateur).
import { describe, it, expect, vi } from "vitest";
import { act, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRechercheProduits, PanneauRecherche } from "../RechercheProduits";
import { rendreAvecLangue, produitsExemple } from "../../tests/utils";

const ids = (r) => r.current.resultats.map((p) => p.id);

function recherche(produits = produitsExemple(), locale = "fr", onChange) {
  return renderHook(() => useRechercheProduits(produits, locale, onChange)).result;
}

describe("useRechercheProduits — texte libre", () => {
  it("sans filtre, tous les produits dans l'ordre de la base", () => {
    const r = recherche();
    expect(ids(r)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(r.current.aDesFiltres).toBe(false);
  });

  it("ignore les accents et les majuscules", () => {
    const r = recherche();
    act(() => r.current.setRecherche("ETOILE"));
    expect(ids(r)).toEqual(["p1"]);
    act(() => r.current.setRecherche("faience"));
    expect(ids(r)).toEqual(["p4"]);
  });

  it("cherche dans les noms traduits, la description, le type et les couleurs traduites", () => {
    const r = recherche();
    act(() => r.current.setRecherche("star"));
    expect(ids(r)).toEqual(["p1"]);
    act(() => r.current.setRecherche("نجمة"));
    expect(ids(r)).toEqual(["p1"]);
    act(() => r.current.setRecherche("ocre"));
    expect(ids(r)).toEqual(["p2"]);
    act(() => r.current.setRecherche("terracotta"));
    expect(ids(r)).toEqual(["p3"]);
    act(() => r.current.setRecherche("turquoise"));
    expect(ids(r)).toEqual(["p4"]);
  });

  it("chaque mot tapé doit être présent", () => {
    const r = recherche();
    act(() => r.current.setRecherche("bleu ciment"));
    expect(ids(r)).toEqual(["p1"]);
    act(() => r.current.setRecherche("bleu introuvable"));
    expect(ids(r)).toEqual([]);
  });

  it("« 20x20 » trouve « 20 x 20 cm »", () => {
    const r = recherche();
    act(() => r.current.setRecherche("20x20"));
    expect(ids(r)).toEqual(["p1", "p3"]);
  });
});

describe("useRechercheProduits — filtres à choix multiples", () => {
  it("dans un groupe : au moins un choix (OU)", () => {
    const r = recherche();
    act(() => r.current.basculerCouleur("Jaune ocre"));
    act(() => r.current.basculerCouleur("Turquoise"));
    expect(ids(r)).toEqual(["p2", "p4"]);
  });

  it("entre les groupes : tous les groupes (ET)", () => {
    const r = recherche();
    act(() => r.current.basculerCouleur("Bleu Méditerranée"));
    act(() => r.current.basculerDimension("20 x 20 cm"));
    expect(ids(r)).toEqual(["p1"]);
    act(() => r.current.basculerType("Faïence"));
    expect(ids(r)).toEqual([]);
  });

  it("un second clic retire le choix", () => {
    const r = recherche();
    act(() => r.current.basculerType("Terre cuite"));
    expect(ids(r)).toEqual(["p3"]);
    act(() => r.current.basculerType("Terre cuite"));
    expect(ids(r)).toHaveLength(4);
  });

  it("compte ce que donnerait chaque choix, en tenant compte des autres groupes", () => {
    const r = recherche();
    expect(r.current.groupes.dim.valeurs).toEqual(["10 x 10 cm", "15 x 15 cm", "20 x 20 cm"]);
    expect(r.current.groupes.dim.comptes.get("10 x 10 cm")).toBe(2);
    act(() => r.current.basculerType("Carreau ciment"));
    expect(r.current.groupes.dim.comptes.get("10 x 10 cm")).toBe(1);
    expect(r.current.groupes.dim.comptes.get("15 x 15 cm")).toBe(1);
    // Le groupe Type compte sans tenir compte de son propre choix.
    expect(r.current.groupes.type.comptes.get("Faïence")).toBe(1);
  });

  it("liste les filtres actifs traduits et permet de les retirer", () => {
    const r = recherche(produitsExemple(), "en");
    act(() => r.current.basculerType("Faïence"));
    act(() => r.current.basculerCouleur("Blanc"));
    act(() => r.current.basculerDimension("10 x 10 cm"));
    expect(r.current.actifs.map((a) => a.label)).toEqual(["Earthenware", "10 x 10 cm", "White"]);
    act(() => r.current.actifs[0].retirer());
    expect(r.current.types).toEqual([]);
  });

  it("réinitialiser efface texte et filtres", () => {
    const r = recherche();
    act(() => {
      r.current.setRecherche("bleu");
      r.current.basculerType("Faïence");
    });
    expect(r.current.aDesFiltres).toBe(true);
    act(() => r.current.reinitialiser());
    expect(r.current.recherche).toBe("");
    expect(r.current.aDesFiltres).toBe(false);
    expect(ids(r)).toHaveLength(4);
  });

  it("prévient à chaque changement (retour à la page 1)", () => {
    const onChange = vi.fn();
    const r = recherche(produitsExemple(), "fr", onChange);
    act(() => r.current.setRecherche("a"));
    act(() => r.current.basculerCouleur("Blanc"));
    act(() => r.current.setTri("nom"));
    act(() => r.current.reinitialiser());
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});

describe("useRechercheProduits — tri", () => {
  it("par prix croissant et décroissant", () => {
    const r = recherche();
    act(() => r.current.setTri("prix-asc"));
    expect(ids(r)).toEqual(["p3", "p2", "p1", "p4"]);
    act(() => r.current.setTri("prix-desc"));
    expect(ids(r)).toEqual(["p4", "p1", "p2", "p3"]);
  });

  it("par nom, dans la langue affichée", () => {
    const fr = recherche(produitsExemple(), "fr");
    act(() => fr.current.setTri("nom"));
    expect(fr.current.resultats.map((p) => p.nom)).toEqual(["Avoine", "Brique", "Étoile", "Lagon"]);
    const en = recherche(produitsExemple(), "en");
    act(() => en.current.setTri("nom"));
    // « Star » (nom anglais d'Étoile) se range après « Lagon ».
    expect(en.current.resultats.map((p) => p.id)).toEqual(["p2", "p3", "p4", "p1"]);
  });
});

describe("PanneauRecherche (interface)", () => {
  function Panneau() {
    const r = useRechercheProduits(produitsExemple(), "fr");
    return (
      <>
        <PanneauRecherche r={r} />
        <ul aria-label="résultats">
          {r.resultats.map((p) => (
            <li key={p.id}>{p.nom}</li>
          ))}
        </ul>
      </>
    );
  }
  const resultats = () => within(screen.getByRole("list", { name: "résultats" })).queryAllByRole("listitem").map((li) => li.textContent);

  it("filtre en tapant et en cochant, affiche le nombre de résultats", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<Panneau />);
    expect(screen.getByText("4 produit(s) trouvé(s)")).toBeInTheDocument();

    await u.type(screen.getByRole("searchbox"), "bleu");
    expect(resultats()).toEqual(["Étoile", "Lagon"]);

    const puce = screen.getByRole("button", { name: /Faïence/ });
    await u.click(puce);
    expect(puce).toHaveAttribute("aria-pressed", "true");
    expect(resultats()).toEqual(["Lagon"]);
    expect(screen.getByText("1 produit(s) trouvé(s)")).toBeInTheDocument();
  });

  it("désactive un choix qui ne donnerait aucun résultat", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<Panneau />);
    await u.click(screen.getByRole("button", { name: /Terre cuite/ }));
    expect(screen.getByRole("button", { name: /15 x 15 cm/ })).toBeDisabled();
  });

  it("retire un filtre actif et réinitialise tout", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<Panneau />);
    await u.click(screen.getByRole("button", { name: /^Jaune ocre/ }));
    expect(resultats()).toEqual(["Avoine"]);
    await u.click(screen.getByRole("button", { name: "Retirer le filtre : Jaune ocre" }));
    expect(resultats()).toHaveLength(4);

    await u.click(screen.getByRole("button", { name: /^Turquoise/ }));
    await u.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(resultats()).toHaveLength(4);
  });

  it("trie depuis la liste déroulante", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<Panneau />);
    await u.selectOptions(screen.getByRole("combobox"), "prix-asc");
    expect(resultats()).toEqual(["Brique", "Avoine", "Étoile", "Lagon"]);
  });

  it("écrit les dimensions de gauche à droite, même en arabe", () => {
    function PanneauAr() {
      const r = useRechercheProduits(produitsExemple(), "ar");
      return <PanneauRecherche r={r} />;
    }
    rendreAvecLangue(<PanneauAr />, { locale: "ar" });
    const libelle = screen.getByText("20 x 20 cm");
    expect(libelle).toHaveAttribute("dir", "ltr");
  });
});
