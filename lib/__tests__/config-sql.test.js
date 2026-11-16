// Réglages d'hébergement et scripts SQL : vérifications statiques.
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const lire = (f) => readFileSync(join(process.cwd(), f), "utf8");

describe("optimiseur d'images", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete require.cache[require.resolve("../../next.config.js")];
  });

  it("n'accepte que les photos du projet Supabase du site", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://monprojet.supabase.co");
    const { images } = require("../../next.config.js");
    const supabase = images.remotePatterns.filter((r) => r.hostname.includes("supabase"));
    expect(supabase).toEqual([
      { protocol: "https", hostname: "monprojet.supabase.co", pathname: "/storage/v1/object/public/produits/**" },
    ]);
    expect(images.remotePatterns.some((r) => r.hostname === "*.supabase.co")).toBe(false);
  });
});

describe("schema.sql", () => {
  const sql = lire("sql/schema.sql");

  it("peut être réexécuté : chaque règle est supprimée avant d'être recréée", () => {
    const crees = [...sql.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(crees.length).toBeGreaterThan(0);
    for (const nom of crees) expect(sql).toContain(`drop policy if exists "${nom}"`);
  });

  it("ne rouvre jamais l'écriture à tout compte connecté sur une base déjà passée en v5", () => {
    const bloc = sql.slice(sql.indexOf("if to_regclass('public.admins') is null then"), sql.indexOf("end if;"));
    for (const nom of ["Ajout reserve aux connectes", "Modification reservee aux connectes", "Suppression reservee aux connectes", "Upload reserve aux connectes", "Suppression images reservee aux connectes"]) {
      expect(bloc).toContain(`create policy "${nom}"`);
    }
    expect(sql.split("auth.role() = 'authenticated'").length - 1).toBe(5);
  });
});

describe("migration_v12.sql", () => {
  it("tient la date de modification par un déclencheur", () => {
    const sql = lire("sql/migration_v12.sql");
    expect(sql).toContain("add column if not exists updated_at timestamptz");
    expect(sql).toMatch(/before update on public\.produits\s+for each row execute function public\.produits_date_modification\(\)/);
  });
});
