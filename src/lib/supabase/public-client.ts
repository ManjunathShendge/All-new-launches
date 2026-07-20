import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free Supabase client (anon role) for PUBLIC, cacheable reads.
 *
 * Unlike {@link import("./server").createClient}, this never calls
 * `next/headers` `cookies()`, so a page/route that reads only through this
 * client is NOT opted into dynamic rendering and can be statically generated /
 * ISR-cached. It returns exactly what an anonymous visitor is allowed to see
 * (RLS evaluated as the `anon` role) — which is precisely the public audience
 * of pages like the home page.
 *
 * Do NOT use this for anything that must be scoped to the logged-in user; use
 * the request-scoped server client for that.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
