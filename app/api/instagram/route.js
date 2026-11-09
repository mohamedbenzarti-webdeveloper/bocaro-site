import { NextResponse } from "next/server";
import { lireDerniersPostsInstagram } from "../../../lib/instagram";

// Les 3 derniers posts Instagram (logique dans lib/instagram.js, partagée
// avec la page d'accueil qui l'appelle directement côté serveur).
export const dynamic = "force-dynamic";

export async function GET() {
  const resultat = await lireDerniersPostsInstagram();
  return NextResponse.json(resultat, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
