"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { notifyAdmins } from "@/lib/notify";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CreatePropertyInput,
  validateCreateInput,
  buildPropertyRow,
  buildGalleryRows,
  buildFloorPlanRows,
  slugify,
  makeSku,
} from "./property-create.logic";

export interface CreatePropertyResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

async function nextId(db: SupabaseClient, table: string): Promise<number> {
  const { data } = await db
    .from(table)
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.id as number | null) ?? 0) + 1;
}

// Postgres error codes we branch on.
const NOT_NULL_VIOLATION = "23502"; // id column has no sequence default (yet)
const UNIQUE_VIOLATION = "23505"; // another insert grabbed the same id first

/**
 * Allocate a WordPress-compatible user id for a brand-new lister.
 * Prefers the atomic DB sequence (via the next_wp_user_id RPC); if that isn't
 * installed yet, falls back to a max()+1 read.
 */
async function allocWpUserId(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("next_wp_user_id");
  if (!error && data != null) return Number(data);
  const { data: maxRow } = await db
    .from("profiles")
    .select("old_wp_user_id")
    .order("old_wp_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((maxRow?.old_wp_user_id as number | null) ?? 100000) + 1;
}

/**
 * Insert a property row and return its id. Preferred path lets the DB sequence
 * assign the id (fully concurrency-safe). If the sequence migration hasn't been
 * applied, the id column rejects a missing value (23502); we then fall back to
 * allocating max(id)+1 and retry on any concurrent collision (23505).
 */
async function insertProperty(
  db: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ id?: number; error?: string }> {
  const seq = await db.from("properties").insert(row).select("id").single();
  if (!seq.error && seq.data) return { id: seq.data.id as number };
  if (seq.error?.code !== NOT_NULL_VIOLATION) {
    return { error: seq.error?.message ?? "Could not create property." };
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = await nextId(db, "properties");
    const r = await db
      .from("properties")
      .insert({ ...row, id })
      .select("id")
      .single();
    if (!r.error && r.data) return { id: r.data.id as number };
    if (r.error?.code !== UNIQUE_VIOLATION) {
      return { error: r.error?.message ?? "Could not create property." };
    }
  }
  return { error: "Could not allocate a property id, please retry." };
}

/**
 * Insert media rows (gallery images or floor plans) with the same
 * sequence-preferred / max()+1-fallback id strategy as insertProperty().
 * Media failures are non-fatal to the listing, but unexpected errors are logged
 * (previously they were silently swallowed, which hid missing NOT NULL columns).
 */
async function insertMediaRows(
  db: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  const seq = await db.from(table).insert(rows);
  if (!seq.error) return;
  // Only a missing-id-sequence error means "retry with an explicit id". Any
  // other error (missing column, FK, etc.) is real — log it so it's not hidden.
  if (seq.error.code !== NOT_NULL_VIOLATION) {
    console.error(`[${table}] insert failed:`, seq.error.code, seq.error.message);
    return;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const startId = await nextId(db, table);
    const withIds = rows.map((r, i) => ({ ...r, id: startId + i }));
    const r = await db.from(table).insert(withIds);
    if (!r.error) return;
    if (r.error.code !== UNIQUE_VIOLATION) {
      console.error(`[${table}] insert (with id) failed:`, r.error.code, r.error.message);
      return;
    }
  }
}

export async function createProperty(
  input: CreatePropertyInput
): Promise<CreatePropertyResult> {
  // --- auth: agent / owner / admin ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to list a property." };

  const profile = await profileRepository.getSessionProfile(user.id);
  const allowed =
    profile?.accountType === "agent" ||
    profile?.accountType === "owner" ||
    profile?.role === "admin";
  if (!allowed) return { ok: false, error: "Not allowed." };

  // --- basic validation ---
  const invalid = validateCreateInput(input);
  if (invalid) return { ok: false, error: invalid };

  const db = createServiceRoleClient();

  try {
    // Link to the agent by their WP user id; lazily allocate one for new agents.
    let wpUserId = profile?.oldWpUserId ?? null;
    if (wpUserId == null) {
      wpUserId = await allocWpUserId(db);
      await db.from("profiles").update({ old_wp_user_id: wpUserId }).eq("id", user.id);
    }

    const now = new Date().toISOString();
    const slug = slugify(input.title);
    const row = buildPropertyRow(input, {
      userId: wpUserId,
      now,
      slug,
      sku: makeSku(),
    });

    // Insert the property. Prefers the DB sequence (concurrency-safe); falls
    // back to a retrying max(id)+1 allocation if the sequence migration isn't
    // applied yet — see insertProperty().
    const res = await insertProperty(db, row);
    if (res.error || res.id == null) {
      return {
        ok: false,
        error: getUserErrorMessage(res.error, "Could not create property."),
      };
    }
    const propertyId = res.id;

    // Gallery images -> property_images (image_type is NOT NULL). First image
    // is primary. Floor plans go to their OWN table (property_floor_plans) so
    // they surface in the Floor Plans tab, not the main gallery.
    if (input.galleryUrls.length > 0) {
      await insertMediaRows(
        db,
        "property_images",
        buildGalleryRows(propertyId, input.galleryUrls, now)
      );
    }
    if (input.floorPlanUrls && input.floorPlanUrls.length > 0) {
      await insertMediaRows(
        db,
        "property_floor_plans",
        buildFloorPlanRows(propertyId, input.floorPlanUrls, now)
      );
    }

    await notifyAdmins({
      type: "property_submitted",
      title: "New property pending review",
      body: `"${input.title.trim()}" was submitted and needs approval.`,
      link: "/admin/dashboard",
    });

    revalidatePath("/properties");
    return { ok: true, slug };
  } catch (e) {
    return {
      ok: false,
      error: getUserErrorMessage(e, "Could not create property."),
    };
  }
}
