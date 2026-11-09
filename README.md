# BOCARO — Site web et dashboard

Site de BOCARO (CAROANTIKA), fabricant tunisien de carreaux céramiques et
de faïence faits main : vitrine trilingue, catalogue, simulateur de pose
sol / murs, demandes de devis et dashboard d'administration.

**Technologies** : Next.js 16 (App Router, JavaScript) · React 19 ·
Tailwind CSS 3 · Supabase (base de données, authentification, stockage) ·
Vitest.

> Cette version de Next.js diffère de versions plus anciennes (ex. `proxy.js`
> au lieu de `middleware.js`, `preload` au lieu de `priority` sur `<Image>`).
> La documentation de référence est dans `node_modules/next/dist/docs/`.

---

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # ou créer le fichier, voir ci-dessous
npm run dev                  # http://localhost:3000
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement (rechargement automatique) |
| `npm run build` puis `npm run start` | Production |
| `npm test` | Tests unitaires (Vitest) |

⚠️ **Ne jamais lancer `npm run build` pendant que `npm run dev` tourne** :
les deux écrivent dans `.next/` ; le serveur de développement renvoie alors
des erreurs 500 et plus rien n'est cliquable. Arrêter `npm run dev`
d'abord (en cas de souci : arrêter le serveur, supprimer `.next/`,
relancer).

---

## Variables d'environnement (`.env.local`)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | oui | Clé publique « anon » Supabase |
| `NEXT_PUBLIC_SITE_URL` | **oui en production** | Adresse publique du site (ex. `https://www.bocaro.tn`), utilisée par le sitemap, `robots.txt`, les URL canoniques et les aperçus de partage. Sans elle, ces liens pointent vers `localhost`. |
| `INSTAGRAM_ACCESS_TOKEN` | non | Fil Instagram de l'accueil (voir plus bas) |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | non | Idem |

Les variables `NEXT_PUBLIC_*` sont visibles par le navigateur : n'y mettre
aucune clé secrète (jamais la clé `service_role` de Supabase).

---

## Mise en place de Supabase (projet neuf)

Dans Supabase → **SQL Editor**, exécuter dans cet ordre les fichiers du
dossier `sql/` :

1. `schema.sql` — table `produits` et stockage d'images `produits` (inclut la v2)
2. `migration_v3.sql` — traductions des produits (EN / AR)
3. `migration_v4.sql` — table `demandes_devis` (simulateur, contact)
4. `migration_v5.sql` — écriture réservée aux administrateurs (table `admins`, fonction `is_admin`)
5. `migration_v6.sql` — anti-spam des demandes de devis (quota)

Puis :

- **Créer le compte administrateur** : Authentication → Users → *Add user*,
  puis dans `migration_v5.sql` remplacer `REMPLACER@exemple.com` par son
  e-mail et ré-exécuter le bloc `insert into public.admins …`.
- **Désactiver l'inscription publique** : Authentication → Sign In / Providers
  → décocher *Allow new users to sign up*. Seuls les comptes listés dans
  `admins` peuvent modifier le catalogue ou lire les devis.

---

## Structure

```
app/
  page.js                 Accueil (hero, galerie, produits, projets, témoignages, Instagram)
  a-propos/  contact/      Pages vitrine
  catalogue/page.js        Catalogue (filtres, 9 produits par page)
  catalogue/[id]/page.js   Fiche produit (galerie, flèches, glissement)
  simulateur/page.js       Simulateur en 4 étapes
  login/                   Connexion administrateur
  dashboard/               Gestion des produits et des demandes de devis (admins)
  actions/                 Actions serveur (produits, devis)
  api/instagram/route.js   Fil Instagram (token côté serveur, cache 6 h)
  sitemap.js  robots.js    Référencement
components/                Navbar, Footer, Pagination, GalerieSlider, ProductDetail…
components/simulateur/     Étapes, comparateur avant/après, canvas, formulaire de devis
lib/
  translations.js          Tous les textes FR / EN / AR
  rooms.js                 Pièces du simulateur (photos, contours, perspectives)
  simulateur/              Moteur de rendu (WebGL + repli Canvas 2D), homographie
  supabase/                Clients Supabase (navigateur, serveur, public, contrôle admin)
  site.js                  Coordonnées de l'entreprise, SITE_URL
context/LanguageContext.js Langue active (cookie bocaro-locale)
proxy.js                   Session Supabase + protection de /dashboard
sql/                       Schéma et migrations Supabase
public/images/             Carreaux de la marque, logo, photos du simulateur
```

---

## Fonctionnement des parties principales

### Langues (FR / EN / AR)
- Textes centralisés dans `lib/translations.js`, mêmes clés pour les 3 langues.
  **Ne pas mettre de texte de secours en dur** dans les composants
  (`?? "Tous"`) : il masque les traductions manquantes.
- Langue mémorisée dans le cookie `bocaro-locale`, lu aussi par le serveur
  (pages rendues directement dans la bonne langue).
- Arabe : police Tajawal, `dir="rtl"`, flèches et alignements inversés.
- Produits : champs `nom_en`, `nom_ar`, `description_en`… dans la base.

### Thème
Mode jour / nuit (`components/ThemeToggle.js`), couleurs définies comme
variables CSS dans `app/globals.css` et palettes `bocaro` (bleu ardoise) et
`brand` (terre cuite) dans `tailwind.config.js`.

### Dashboard
- Accès réservé aux comptes de la table `admins` (vérifié par `proxy.js`
  et par les règles de la base).
- À l'envoi, chaque photo est **redimensionnée (1 600 px max) et convertie
  en WebP** dans le navigateur (≈ 200 Ko au lieu de 2-3 Mo), et son nom est
  nettoyé (accents, espaces) : Supabase refuse les noms accentués et les
  photos lourdes dépassent le délai de 7 s de l'optimiseur d'images.

### Simulateur
- Pièces décrites dans `lib/rooms.js` : photo, contour du sol
  (`floorPolygon`), plan en perspective (`floorQuad`), murs, calques
  d'avant-plan (meubles redessinés par-dessus le carrelage).
- Les contours suivent le **pied des plinthes** et le bord réel des meubles ;
  après toute modification, vérifier sur le rendu agrandi.
- Rendu : WebGL en priorité (`lib/simulateur/renderGL.js`), repli Canvas 2D
  (`renderFloor.js`). Le découpage par polygone se fait sur un calque
  (`destination-in`) et non par `clip()` : sur certains GPU mobiles
  (Adreno / Chrome Android), `clip()` + `multiply` n'affichait pas le sol.

### Fil Instagram
Affiche les 3 derniers posts de
[@caroantika_officiel](https://www.instagram.com/caroantika_officiel/) ;
la section est masquée tant que les identifiants ne sont pas configurés.

1. Compte Instagram en mode **Professionnel**, relié à une **Page Facebook**.
2. Créer une app sur [developers.facebook.com](https://developers.facebook.com/)
   avec le produit **Instagram Graph API**.
3. Dans le [Graph API Explorer](https://developers.facebook.com/tools/explorer/),
   générer un token (`instagram_basic`, `pages_show_list`) et l'échanger
   contre un **token longue durée** (`oauth/access_token?grant_type=fb_exchange_token`).
4. Récupérer l'ID `instagram_business_account` via `/me/accounts`.
5. Renseigner `INSTAGRAM_ACCESS_TOKEN` et `INSTAGRAM_BUSINESS_ACCOUNT_ID`.

Le token expire au bout d'environ 60 jours : le renouveler (étape 3).

---

## Tester sur téléphone (même Wi-Fi)

1. Trouver l'adresse du PC : `ipconfig` → « Adresse IPv4 » (ex. `192.168.100.77`).
2. Lancer `npm run dev` et ouvrir `http://<adresse>:3000` sur le téléphone.
3. `next.config.js` contient `allowedDevOrigins: ["192.168.*.*"]` : sans
   cette ligne, Next.js bloque le JavaScript de développement depuis une
   autre adresse que `localhost` (page affichée mais rien de cliquable).
4. Autoriser Node.js dans le pare-feu Windows (réseaux privés) si demandé.

Pour un bug d'affichage propre au mobile, tester sur l'appareil réel : les
émulateurs du PC n'utilisent pas le vrai processeur graphique.

---

## Avant la mise en ligne

- [ ] `NEXT_PUBLIC_SITE_URL` défini chez l'hébergeur
- [ ] `npm audit --omit=dev` sans vulnérabilité
- [ ] `npm test` et `npm run build` sans erreur
- [ ] Inscription publique Supabase désactivée, compte admin créé
- [ ] Sitemap (`/sitemap.xml`) déclaré dans Google Search Console

---

## Informations société

- **Nom** : BOCARO (extension de CAROANTIKA, fondée en 2006 ; BOCARO depuis 2016)
- **Adresse** : Rue Ras Jedir, Soukra, Tunis, Tunisie
- **E-mail** : bocaro_tunisia@yahoo.com
- **WhatsApp** : +216 98 514 014 (principal) / +216 22 447 900
- **Horaires** : lundi-vendredi 8 h-17 h, samedi 8 h-14 h

Ces coordonnées sont centralisées dans `lib/site.js` (référencement) et
affichées dans `components/Footer.js` et la page Contact.
