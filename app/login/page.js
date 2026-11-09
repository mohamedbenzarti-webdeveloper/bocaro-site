"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setChargement(false);
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

    // Un compte valide mais absent de la table "admins" n'a pas accès.
    const { data: admin } = await supabase.rpc("is_admin");
    setChargement(false);
    if (admin !== true) {
      await supabase.auth.signOut();
      setErreur("Ce compte n'a pas accès à l'espace direction.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bocaro-50 px-4">
      <div className="bg-surface rounded-2xl border border-bocaro-100 shadow-sm p-8 w-full max-w-sm">
        <h1 className="font-serif text-2xl font-bold text-bocaro-950 mb-1 text-center">
          Espace direction
        </h1>
        <p className="text-sm text-bocaro-500 text-center mb-6">
          Connexion réservée au directeur
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bocaro-900 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bocaro-900 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
            />
          </div>

          {erreur && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
