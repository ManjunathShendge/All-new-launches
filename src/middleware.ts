import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // -----------------------------
  // User not logged in
  // -----------------------------
  if (!user) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/agent") ||
      pathname.startsWith("/owner") ||
      pathname.startsWith("/profile")
    ) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    return response;
  }

  // -----------------------------
  // Read role from profiles table
  // -----------------------------
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -----------------------------
  // Admin
  // -----------------------------
  if (
    pathname.startsWith("/admin") &&
    profile.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -----------------------------
  // Agent
  // -----------------------------
  if (
    pathname.startsWith("/agent") &&
    profile.account_type !== "agent"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -----------------------------
  // Owner
  // -----------------------------
  if (
    pathname.startsWith("/owner") &&
    profile.account_type !== "owner"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -----------------------------
  // User Profile
  // -----------------------------
  if (
    pathname.startsWith("/profile") &&
    (profile.account_type === "agent" || profile.account_type === "owner")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/owner/:path*",
    "/profile/:path*",
  ],
};