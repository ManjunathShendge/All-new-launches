"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { getUserErrorMessage } from "@/lib/errors/user-message";

type AccountType = "agent" | "owner" | "user";
function toAccountType(v: unknown): AccountType {
  return v === "agent" || v === "owner" ? v : "user";
}

export interface CurrentUserProfile {
  fullName: string | null;
  accountType: "agent" | "owner" | "user";
  role: "admin" | "user";
}

/**
 * Returns the signed-in user's profile for UI display (name, role, account
 * type). Resolves the profile with the service-role client server-side, so it
 * bypasses `profiles` RLS and never exposes the service key to the browser.
 */
export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await profileRepository.getSessionProfile(user.id);
  if (!profile) return null;

  return {
    fullName: profile.fullName,
    accountType: profile.accountType,
    role: profile.role === "admin" ? "admin" : "user",
  };
}

/* --------------------------- editable profile --------------------------- */

export interface EditableProfile {
  fullName: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  accountType: AccountType;
  createdAt: string | null;
}

/** The signed-in user's full, editable profile (own row, service-role read). */
export async function getMyProfile(): Promise<EditableProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createServiceRoleClient();
  // Prefer the enriched columns; fall back to the base set if the profile-fields
  // migration (bio / avatar_url) hasn't been applied yet.
  let { data } = await db
    .from("profiles")
    .select("full_name, username, phone, email, bio, avatar_url, account_type, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) {
    ({ data } = await db
      .from("profiles")
      .select("full_name, username, phone, email, account_type, created_at")
      .eq("id", user.id)
      .maybeSingle());
  }

  if (!data) return null;

  return {
    fullName: (data.full_name as string | null) ?? "",
    username: (data.username as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    email: (data.email as string | null) ?? user.email ?? null,
    bio: (data.bio as string | null) ?? null,
    avatarUrl: (data.avatar_url as string | null) ?? null,
    accountType: toAccountType(data.account_type),
    createdAt: (data.created_at as string | null) ?? null,
  };
}

export interface UpdateProfileInput {
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
}

/**
 * Update the signed-in user's own profile. Service-role write scoped by
 * `.eq("id", user.id)` so a user can only ever change their own row.
 */
export async function updateMyProfile(
  input: UpdateProfileInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Please enter your name." };
  if (input.bio.length > 1500)
    return { ok: false, error: "Bio is too long (1500 characters max)." };
  if (input.phone.trim().length > 20)
    return { ok: false, error: "Phone number looks too long." };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("profiles")
    .update({
      full_name: fullName,
      phone: input.phone.trim() || null,
      bio: input.bio.trim() || null,
      avatar_url: input.avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error)
    return { ok: false, error: getUserErrorMessage(error, "Could not save your profile.") };

  revalidatePath("/agent/dashboard");
  revalidatePath("/owner/dashboard");
  return { ok: true };
}

/** Change the signed-in user's password via Supabase Auth. */
export async function changeMyPassword(
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error)
    return { ok: false, error: getUserErrorMessage(error, "Could not change your password.") };
  return { ok: true };
}
