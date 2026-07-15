import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface PropertyRow {
  id: number;
  gallery_images: string | null;
}

interface MigrationSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  imagesInserted: number;
}

const BATCH_SIZE = 100;

async function fetchPropertiesBatch(
  supabase: ReturnType<typeof createServiceRoleClient>,
  offset: number,
): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, gallery_images")
    .not("gallery_images", "is", null)
    .neq("gallery_images", "")
    .neq("gallery_images", "[]")
    .order("id", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) throw new Error(`Failed to fetch properties: ${error.message}`);
  return (data ?? []) as PropertyRow[];
}

function parseGalleryImages(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number" && id > 0);
  } catch {
    return [];
  }
}

async function fetchAttachmentUrls(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ids: number[],
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("wp_posts")
    .select("ID, guid")
    .in("ID", ids)
    .eq("post_type", "attachment");

  if (error) throw new Error(`Failed to fetch wp_posts: ${error.message}`);

  const map = new Map<number, string>();
  for (const row of data ?? []) {
    if (row.guid) map.set(Number(row.ID), row.guid as string);
  }
  return map;
}

async function hasExistingImages(
  supabase: ReturnType<typeof createServiceRoleClient>,
  propertyId: number,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (error) throw new Error(`Failed to check existing images for property ${propertyId}: ${error.message}`);
  return (count ?? 0) > 0;
}

async function insertImages(
  supabase: ReturnType<typeof createServiceRoleClient>,
  propertyId: number,
  attachmentIds: number[],
  urlMap: Map<number, string>,
): Promise<number> {
  const rows = attachmentIds
    .map((attachmentId, index) => {
      const imageUrl = urlMap.get(attachmentId);
      if (!imageUrl) return null;
      return {
        property_id: propertyId,
        attachment_id: attachmentId,
        image_url: imageUrl,
        sort_order: index,
        is_primary: index === 0,
        image_type: "gallery",
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("property_images").insert(rows);
  if (error) throw new Error(`Failed to insert images for property ${propertyId}: ${error.message}`);

  return rows.length;
}

async function processProperty(
  supabase: ReturnType<typeof createServiceRoleClient>,
  property: PropertyRow,
  summary: MigrationSummary,
): Promise<void> {
  const attachmentIds = parseGalleryImages(property.gallery_images);

  if (attachmentIds.length === 0) {
    summary.skipped += 1;
    return;
  }

  const alreadyDone = await hasExistingImages(supabase, property.id);
  if (alreadyDone) {
    console.log(`  Property ${property.id}: skipped (already migrated)`);
    summary.skipped += 1;
    return;
  }

  const urlMap = await fetchAttachmentUrls(supabase, attachmentIds);
  const inserted = await insertImages(supabase, property.id, attachmentIds, urlMap);

  if (inserted === 0) {
    console.log(`  Property ${property.id}: skipped (no URLs found in wp_posts)`);
    summary.skipped += 1;
    return;
  }

  console.log(`  Property ${property.id}: inserted ${inserted} image(s)`);
  summary.success += 1;
  summary.imagesInserted += inserted;
}

function printSummary(summary: MigrationSummary): void {
  console.log("\n=========================");
  console.log("Image Migration Summary");
  console.log("=========================");
  console.log(`Properties processed : ${summary.total}`);
  console.log(`Migrated             : ${summary.success}`);
  console.log(`Skipped              : ${summary.skipped}`);
  console.log(`Failed               : ${summary.failed}`);
  console.log(`Images inserted      : ${summary.imagesInserted}`);
}

async function run(): Promise<void> {
  const supabase = createServiceRoleClient();
  const summary: MigrationSummary = { total: 0, success: 0, failed: 0, skipped: 0, imagesInserted: 0 };

  console.log("Starting image migration from gallery_images → property_images...\n");

  let offset = 0;

  while (true) {
    const batch = await fetchPropertiesBatch(supabase, offset);
    if (batch.length === 0) break;

    summary.total += batch.length;
    console.log(`Batch at offset ${offset}: ${batch.length} properties`);

    for (const property of batch) {
      try {
        await processProperty(supabase, property, summary);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  Property ${property.id}: FAILED — ${msg}`);
        summary.failed += 1;
      }
    }

    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  printSummary(summary);
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nMigration aborted: ${msg}`);
  process.exit(1);
});
