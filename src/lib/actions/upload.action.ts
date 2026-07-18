"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import {
  getR2Client,
  isR2Configured,
  R2_BUCKET,
  R2_PUBLIC_URL,
} from "@/lib/r2/config";

export interface UploadUrlResult {
  ok: boolean;
  error?: string;
  uploadUrl?: string;
  publicUrl?: string;
}

async function isAgentOrAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const p = await profileRepository.getSessionProfile(user.id);
  return (
    p?.accountType === "agent" ||
    p?.accountType === "owner" ||
    p?.role === "admin"
  );
}

function safeExt(name: string): string {
  const m = name.toLowerCase().match(/\.[a-z0-9]{1,5}$/);
  return m ? m[0] : "";
}

const IMAGE_RE = /^image\/(jpeg|png|webp|gif)$/;
const VIDEO_RE = /^video\/(mp4|webm|ogg)$/;

/**
 * Mint a one-time presigned PUT URL for R2 so the browser can upload directly
 * to Cloudflare (the API keys never leave the server). Agent/owner/admin only.
 */
export async function getR2UploadUrl(
  filename: string,
  contentType: string
): Promise<UploadUrlResult> {
  if (!(await isAgentOrAdmin())) return { ok: false, error: "Unauthorized." };
  if (!isR2Configured()) {
    return { ok: false, error: "Media storage is not configured yet." };
  }
  if (!IMAGE_RE.test(contentType) && !VIDEO_RE.test(contentType)) {
    return { ok: false, error: "Unsupported file type." };
  }

  const key = `properties/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${safeExt(filename)}`;

  try {
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );
    return { ok: true, uploadUrl, publicUrl: `${R2_PUBLIC_URL}/${key}` };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create upload URL.",
    };
  }
}
