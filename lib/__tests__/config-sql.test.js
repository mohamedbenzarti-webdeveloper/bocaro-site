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

describe("migration_v13.sql (double authentification)", () => {
  const sql = lire("sql/migration_v13.sql");
  const corps = (fonction) => sql.slice(sql.indexOf(`function public.${fonction}()`), sql.indexOf("$$;", sql.indexOf(`function public.${fonction}()`)));

  it("is_admin() exige le code validé (aal2) : toutes les règles d'écriture en héritent", () => {
    expect(corps("is_admin")).toContain("coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'");
    expect(corps("is_admin")).toContain("from public.admins where user_id = auth.uid()");
  });

  it("est_admin() indique seulement l'appartenance, pour guider la connexion", () => {
    expect(corps("est_admin")).toContain("from public.admins where user_id = auth.uid()");
    expect(corps("est_admin")).not.toContain("aal");
  });

  it("les deux fonctions sont security definer avec search_path fixé", () => {
    for (const f of ["is_admin", "est_admin"]) expect(corps(f)).toMatch(/security definer\s+set search_path = public/);
  });

  it("les règles d'écriture (v5, v7) passent bien par is_admin()", () => {
    const v5 = lire("sql/migration_v5.sql");
    expect(v5.match(/create policy/g)).toHaveLength(6);
    expect(v5.match(/public\.is_admin\(\)/g).length).toBeGreaterThanOrEqual(6);
  });
});
