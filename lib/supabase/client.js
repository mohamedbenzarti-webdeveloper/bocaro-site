"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase utilisable dans les composants "use client"
// (formulaire de connexion, etc.)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
