import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { profileRepository } from "@/lib/supabase/profile.repository";

// Next.js 16 renamed `middleware` to `proxy`. This file MUST be named
// `proxy.ts` and export a `proxy` function for the auth guard to run.
export async function proxy(request: NextRequest) {
  // Keep a mutable response so Supabase can write refreshed session
  // cookies onto it. Without this bridge the access token never refreshes
  // and users get silently logged out.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Redirect while carrying over any refreshed auth cookies, so a token
  // refresh that happens on this request isn't lost on the redirect.
  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  };

  const pathname = request.nextUrl.pathname;

  // `/admin` is the PUBLIC admin login page. Everything under `/admin/...`
  // (e.g. the dashboard) is protected and admin-only.
  const isAdminLogin = pathname === "/admin";
  const isAdminArea = pathname.startsWith("/admin/");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -----------------------------
  // Not logged in
  // -----------------------------
  if (!user) {
    // Protected admin routes send you to the admin login, everyone else to /auth.
    if (isAdminArea) return redirectTo("/admin");
    if (
      pathname.startsWith("/agent") ||
      pathname.startsWith("/owner") ||
      pathname.startsWith("/profile")
    ) {
      return redirectTo("/auth");
    }
    // Public pages (including /auth and /admin login).
    return response;
  }

  // -----------------------------
  // Logged in — resolve role via the service-role repository so authorization
  // doesn't depend on a `profiles` self-read RLS policy being configured.
  // -----------------------------
  const profile = await profileRepository.getSessionProfile(user.id);

  if (!profile) {
    // Can't resolve the profile. Don't loop on the login pages; else send home.
    if (pathname === "/auth" || isAdminLogin) return response;
    return redirectTo("/");
  }

  const isAdmin = profile.role === "admin";
  const { accountType } = profile;

  // Already authenticated users shouldn't sit on a login page.
  // Admins go to their dashboard; everyone else goes home.
  if (pathname === "/auth" || isAdminLogin) {
    return redirectTo(isAdmin ? "/admin/dashboard" : "/");
  }

  // Admin area — admin role only.
  if (isAdminArea && !isAdmin) {
    return redirectTo("/");
  }

  // Agent
  if (pathname.startsWith("/agent") && accountType !== "agent") {
    return redirectTo("/");
  }

  // Owner
  if (pathname.startsWith("/owner") && accountType !== "owner") {
    return redirectTo("/");
  }

  // User Profile — regular users (and admins) only, not agents/owners.
  if (
    pathname.startsWith("/profile") &&
    (accountType === "agent" || accountType === "owner")
  ) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: [
    "/auth",
    "/admin",
    "/admin/:path*",
    "/agent/:path*",
    "/owner/:path*",
    "/profile/:path*",
  ],
};
