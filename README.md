# BOCARO — Site web et dashboard

Site de BOCARO (CAROANTIKA), fabricant tunisien de carreaux céramiques et
de faïence faits main : vitrine trilingue, catalogue avec recherche
multi-filtres, simulateur de pose sol / murs et dashboard d'administration.

**Versions** : Next.js 16.4.5 · React 19.3.1 · supabase-js 2.119 · sharp
0.35.5 ou plus (requis par l'avis de sécurité GHSA-2464-fhr4-w9xw).

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
| `npm test` | Tests unitaires et de composants (Vitest, ~270 tests, ~15 s) |
| `npm run test:couverture` | Même chose + rapport de couverture (`coverage/index.html`) |
| `npm run test:e2e` | Tests de bout en bout dans Chrome (serveur lancé) |
| `npm audit --omit=dev` | Vulnérabilités des dépendances du site en ligne |

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
3. `migration_v4.sql` — table `demandes_devis`
4. `migration_v5.sql` — écriture réservée aux administrateurs (table `admins`, fonction `is_admin`)
5. `migration_v6.sql` — anti-spam des demandes de devis (quota)
6. `migration_v7.sql` — stockage verrouillé : plus de listage public du bucket,
   JPEG / PNG / WebP de 5 Mo maximum
7. `migration_v8.sql` — demandes de devis mises en pause (envoi fermé ; la
   table et les demandes reçues sont conservées)

> Les demandes de devis sont **désactivées** pour le moment (formulaire et
> section du dashboard retirés). Pour les réactiver : réexécuter
> `migration_v6.sql` et restaurer le code depuis l'historique Git (commit
> « Version initiale du site BOCARO »).

Puis :

- **Créer le compte administrateur** : Authentication → Users → *Add user*,
  puis dans `migration_v5.sql` remplacer `REMPLACER@exemple.com` par son
  e-mail et ré-exécuter le bloc `insert into public.admins …`.
- **Désactiver l'inscription publique** : Authentication → Sign In / Providers
  → décocher *Allow new users to sign up*. Seuls les comptes listés dans
  `admins` peuvent modifier le catalogue et ses photos.

---

## Structure

```
app/
  page.js                 Accueil (hero, galerie, produits, projets, témoignages, Instagram)
  a-propos/  contact/      Pages vitrine
  produits/page.js         Catalogue (recherche, filtres multiples, tri, 9 par page)
  produits/[id]/page.js    Fiche produit (galerie, flèches, glissement)
                           (/catalogue redirige vers /produits : next.config.js)
  simulateur/page.js       Simulateur en 4 étapes
  login/                   Connexion administrateur
  dashboard/               Gestion des produits et nettoyage du stockage (admins)
  actions/produits.js      Actions serveur (produits, photos du stockage)
  api/instagram/route.js   Fil Instagram (token côté serveur, cache 6 h)
  sitemap.js  robots.js    Référencement
components/                Navbar, Footer, Pagination, GalerieSlider, ProductDetail…
components/RechercheProduits.js  Recherche partagée (page Produits + simulateur)
components/simulateur/     Étapes, comparateur avant/après, canvas
lib/
  translations.js          Tous les textes FR / EN / AR
  rooms.js                 Pièces du simulateur (photos, contours, perspectives)
  simulateur/              Moteur de rendu (WebGL + repli Canvas 2D), homographie
  supabase/                Clients Supabase (navigateur, serveur, public, contrôle admin)
  supabase/stockage.js     Chemin d'une photo dans le bucket, suppression
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

### Recherche des carreaux
Un seul module, `components/RechercheProduits.js`, sert la page Produits et
l'étape « Carrelage » du simulateur :
- recherche par mots dans les noms, descriptions (3 langues), type, couleurs
  (traduites) et dimensions ; accents ignorés, « 20x20 » trouve « 20 x 20 cm » ;
- filtres à choix multiples (type, dimension, couleur) : « OU » dans un
  groupe, « ET » entre les groupes, avec le nombre de résultats par choix ;
- tri : plus récents, prix croissant ou décroissant, nom.

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
- **Stockage sans fichiers oubliés** : supprimer un produit supprime ses
  photos ; retirer une photo la supprime à l'enregistrement ; un
  enregistrement qui échoue supprime les photos qu'il venait d'envoyer.
  Une photo encore utilisée par un produit n'est jamais supprimée.
- L'encadré « Nettoyer le stockage » du dashboard supprime les fichiers
  qu'aucun produit n'utilise (déposés depuis plus d'une heure).
- Nécessite `migration_v7.sql` : la suppression exige que l'administrateur
  puisse lire le bucket.

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

## Tests

Trois niveaux, du plus rapide au plus réaliste :

| Niveau | Où | Ce qui est vérifié |
|---|---|---|
| Logique et serveur (Node) | `lib/**/__tests__`, `app/actions/__tests__`, `app/__tests__/proxy-seo.test.js` | Actions du dashboard (droits, création, modification, suppression, nettoyage du stockage), protection du dashboard (`proxy.js`), lecture des produits, Instagram, langue, sitemap, robots, traductions (mêmes clés dans les 3 langues, aucune clé en double), pièces du simulateur, messages WhatsApp, calcul des formats, homographie |
| Composants (navigateur simulé, jsdom) | `components/__tests__`, `app/**/__tests__` | Recherche et filtres, pagination, catalogue, fiche produit, contact, carte, galerie, navigation, langue, thème, pages serveur (contenu, référencement, données structurées), connexion, dashboard, parcours complet du simulateur |
| Bout en bout (vrai Chrome) | `tests/e2e/parcours.mjs` | Le site réel : pages sans erreur, 404, redirection du dashboard, filtres, présélection fiche → simulateur, rendu du sol réellement dessiné, WhatsApp, arabe, aucun débordement de 320 à 1920 px, menu mobile |

- `tests/setup.js` remplace `next/link`, `next/image` et `next/navigation`
  par des versions de test ; `tests/fauxSupabase.js` est une base Supabase
  en mémoire (aucun accès à la vraie base pendant les tests).
- Le rendu WebGL / Canvas du simulateur n'est pas exécutable dans jsdom :
  il est couvert par le test de bout en bout, qui vérifie dans Chrome que
  le sol contient bien des carreaux.
- `npm run test:e2e` : lancer d'abord `npm run dev` (ou définir `E2E_URL`).
  Par défaut, les photos Supabase y sont remplacées par un carreau local
  pour ne pas dépendre du réseau (`E2E_PHOTOS_RESEAU=1` pour les vraies).
  Chrome est cherché à l'emplacement standard (`CHROME_PATH` sinon).
- Nouveau test : fichier `__tests__/<nom>.test.js` à côté du code ; ajouter
  `// @vitest-environment jsdom` en première ligne pour un composant.

---

## Git

Le projet est versionné avec Git (branche `main`). Le `.gitignore` exclut
`.env.local`, `node_modules/`, `.next/`, les archives `.zip` et les scripts
`test-rls.*` (qui lisent des identifiants de test).

```bash
git add .
git commit -m "Ce qui a changé"
git push
```

Dépôt GitHub : à créer en **privé**, vide (sans README ni .gitignore), puis
`git remote add origin <adresse>` et `git push -u origin main`. Si GitHub
répond « Repository not found », vérifier que le compte connecté dans le
gestionnaire d'identifiants Windows est bien celui qui possède le dépôt
(`git credential-manager github list`).

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
- [ ] `npm test`, `npm run test:e2e` et `npm run build` sans erreur
- [ ] Inscription publique Supabase désactivée, compte admin créé
- [ ] Migrations `v7` et `v8` exécutées (stockage verrouillé, devis fermés)
- [ ] Code envoyé sur le dépôt GitHub privé
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
