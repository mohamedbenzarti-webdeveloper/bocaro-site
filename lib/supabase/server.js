import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase utilisable dans les Server Components, Route Handlers
// et Server Actions. Il lit/écrit la session via les cookies Next.js.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignoré : setAll peut être appelé depuis un Server Component,
            // où l'écriture de cookies n'est pas permise. Le middleware
            // s'occupe déjà de rafraîchir la session dans ce cas.
          }
        },
      },
    }
  );
}
