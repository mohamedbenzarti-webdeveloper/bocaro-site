"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { estMembreAdmin, niveauSession } from "../../lib/supabase/admin";

const REFUS = "Ce compte n'a pas accès à l'espace direction.";
const NOM_FACTEUR = "Dashboard BOCARO";

const classeChamp =
  "w-full px-4 py-2.5 rounded border border-bocaro-300 bg-surface text-bocaro-950 focus:outline-none focus:ring-2 focus:ring-bocaro-500";

// Connexion en deux étapes :
// 1. « identifiants » : e-mail et mot de passe ;
// 2. « code » : code à 6 chiffres de l'application d'authentification ;
//    ou « configuration » la première fois : QR code à scanner, puis code.
// Le dashboard n'est accessible qu'après l'étape 2 (session "aal2").
export default function FormulaireConnexion({ etapeInitiale = "identifiants", erreurInitiale = "" }) {
  const router = useRouter();
  const [etape, setEtape] = useState(etapeInitiale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // Application en cours de configuration : { id, qr, secret }.
  const [nouveau, setNouveau] = useState(null);
  const [erreur, setErreur] = useState(erreurInitiale);
  const [chargement, setChargement] = useState(false);

  const entrerDansLeDashboard = () => {
    router.push("/dashboard");
    router.refresh();
  };

  async function connexion(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setChargement(false);
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

    // Un compte valide mais absent de la table "admins" n'a pas accès.
    if (!(await estMembreAdmin(supabase))) {
      await supabase.auth.signOut();
      setChargement(false);
      setErreur(REFUS);
      return;
    }

    const { actuel, suivant } = await niveauSession(supabase);
    setChargement(false);
    setPassword("");
    if (actuel === "aal2") return entrerDansLeDashboard();
    setEtape(suivant === "aal2" ? "code" : "configuration");
  }

  // Première fois : crée l'application (QR code). Une configuration
  // commencée puis abandonnée est d'abord retirée (sinon Supabase refuse
  // d'en créer une autre du même nom).
  async function commencerConfiguration() {
    setErreur("");
    setChargement(true);
    const supabase = createClient();
    const { data: facteurs } = await supabase.auth.mfa.listFactors();
    for (const f of facteurs?.all ?? []) {
      if (f.factor_type === "totp" && f.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: NOM_FACTEUR });
    setChargement(false);
    if (error) {
      setErreur(`Configuration impossible : ${error.message}`);
      return;
    }
    setNouveau({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function validerCode(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    const supabase = createClient();
    let factorId = nouveau?.id;
    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      factorId = data?.totp?.find((f) => f.status === "verified")?.id;
    }
    if (!factorId) {
      setChargement(false);
      setEtape("configuration");
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setChargement(false);
    if (error) {
      setCode("");
      setErreur("Code incorrect ou expiré. Saisissez le code affiché en ce moment dans l'application.");
      return;
    }
    entrerDansLeDashboard();
  }

  async function annuler() {
    await createClient().auth.signOut();
    setEtape("identifiants");
    setNouveau(null);
    setCode("");
    setErreur("");
    router.refresh();
  }

  const champCode = (
    <div>
      <label htmlFor="login-code" className="block text-sm font-medium text-bocaro-900 mb-1">
        Code à 6 chiffres
      </label>
      <input
        id="login-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className={`${classeChamp} tracking-[0.4em] text-center text-lg`}
      />
    </div>
  );

  const message = erreur && (
    <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
      {erreur}
    </p>
  );

  const boutonAnnuler = (
    <button type="button" onClick={annuler} className="w-full text-sm text-bocaro-600 hover:text-bocaro-900 underline underline-offset-2">
      Annuler et se déconnecter
    </button>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bocaro-50 px-4">
      <div className="bg-surface rounded border border-bocaro-200 p-8 sm:p-10 w-full max-w-sm">
        <h1 className="font-serif text-3xl text-bocaro-950 mb-2 text-center">Espace direction</h1>

        {etape === "identifiants" && (
          <>
            <p className="text-sm text-bocaro-500 text-center mb-6">Connexion réservée au directeur</p>
            <form onSubmit={connexion} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-bocaro-900 mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={classeChamp}
                />
              </div>
              <div>
                <label htmlFor="login-mot-de-passe" className="block text-sm font-medium text-bocaro-900 mb-1">
                  Mot de passe
                </label>
                <input
                  id="login-mot-de-passe"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={classeChamp}
                />
              </div>
              {message}
              <button type="submit" disabled={chargement} className="btn-primary w-full justify-center disabled:opacity-60">
                {chargement ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </>
        )}

        {etape === "code" && (
          <>
            <p className="text-sm text-bocaro-500 text-center mb-6">
              Ouvrez votre application d&apos;authentification et saisissez le code affiché pour « {NOM_FACTEUR} ».
            </p>
            <form onSubmit={validerCode} className="space-y-4">
              {champCode}
              {message}
              <button type="submit" disabled={chargement} className="btn-primary w-full justify-center disabled:opacity-60">
                {chargement ? "Vérification..." : "Valider"}
              </button>
              {boutonAnnuler}
            </form>
          </>
        )}

        {etape === "configuration" && (
          <div className="space-y-4">
            <p className="text-sm text-bocaro-600">
              Double authentification obligatoire : en plus du mot de passe, un code à 6 chiffres
              sera demandé à chaque connexion. Installez une application d&apos;authentification
              (Google Authenticator, Microsoft Authenticator…) sur votre téléphone.
            </p>
            {!nouveau ? (
              <>
                {message}
                <button type="button" onClick={commencerConfiguration} disabled={chargement} className="btn-primary w-full justify-center disabled:opacity-60">
                  {chargement ? "Préparation..." : "Configurer l'application"}
                </button>
                {boutonAnnuler}
              </>
            ) : (
              <form onSubmit={validerCode} className="space-y-4">
                <p className="text-sm text-bocaro-900 font-medium">1. Scannez ce QR code avec l&apos;application :</p>
                {/* QR code fourni par Supabase (image SVG en data:) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nouveau.qr} alt="QR code à scanner avec l'application d'authentification" className="mx-auto w-48 h-48 bg-white p-2 rounded" />
                <p className="text-xs text-bocaro-600 break-all">
                  Ou saisissez cette clé à la main : <code className="font-mono text-bocaro-950">{nouveau.secret}</code>
                </p>
                <p className="text-sm text-bocaro-900 font-medium">2. Saisissez le code affiché par l&apos;application :</p>
                {champCode}
                {message}
                <button type="submit" disabled={chargement} className="btn-primary w-full justify-center disabled:opacity-60">
                  {chargement ? "Vérification..." : "Activer et entrer"}
                </button>
                {boutonAnnuler}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
