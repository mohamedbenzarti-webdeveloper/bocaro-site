// Garde-fou sur les scripts SQL (dossier sql/) : le bucket "produits" est
// public, ses images sont servies par URL sans politique. Toute politique de
// LECTURE (select) sur storage.objects doit donc être réservée aux
// administrateurs ; sinon n'importe quel visiteur peut lister le bucket avec
// la clé publique du site (faille corrigée par migration_v7.sql).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DOSSIER = join(process.cwd(), "sql");
const scripts = readdirSync(DOSSIER).filter((f) => f.endsWith(".sql"));

/** Instructions `create policy … ;` d'un script, commentaires retirés. */
function politiques(fichier) {
  const sql = readFileSync(join(DOSSIER, fichier), "utf8").replace(/--.*$/gm, "");
  return sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
}

describe("politiques de sécurité du stockage", () => {
  it("les scripts SQL sont bien lus", () => {
    expect(scripts).toContain("schema.sql");
    expect(scripts).toContain("migration_v7.sql");
  });

  it.each(scripts)("%s : aucune lecture du bucket ouverte aux visiteurs", (fichier) => {
    const fautives = politiques(fichier).filter((p) => {
      const surStockage = /on\s+storage\.objects/i.test(p);
      const lecture = /for\s+(select|all)\b/i.test(p);
      const reservee = /to\s+authenticated/i.test(p) && /is_admin\(\)/i.test(p);
      return surStockage && lecture && !reservee;
    });
    expect(fautives).toEqual([]);
  });

  it("schema.sql et migration_v2.sql suppriment l'ancienne politique publique", () => {
    for (const fichier of ["schema.sql", "migration_v2.sql", "migration_v7.sql"]) {
      const sql = readFileSync(join(DOSSIER, fichier), "utf8");
      expect(sql, fichier).toMatch(/drop policy if exists "Lecture publique des images" on storage\.objects/);
    }
  });

  it("migration_v7.sql réserve la lecture aux administrateurs et limite les fichiers", () => {
    const sql = readFileSync(join(DOSSIER, "migration_v7.sql"), "utf8");
    expect(sql).toMatch(/for select to authenticated\s+using \(bucket_id = 'produits' and public\.is_admin\(\)\)/);
    expect(sql).toMatch(/file_size_limit = 5242880/);
    expect(sql).toMatch(/allowed_mime_types = array\['image\/jpeg', 'image\/png', 'image\/webp'\]/);
  });
});
