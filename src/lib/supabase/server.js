import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function asSessionCookie(options) {
  if (!options || typeof options !== "object") return options;
  const next = { ...options };
  delete next.maxAge;
  delete next.expires;
  return next;
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, asSessionCookie(options));
          });
        } catch {
          /* chamado de RSC sem mutação de cookie */
        }
      },
    },
  });
}
