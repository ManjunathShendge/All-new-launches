"use server";

import { headers } from "next/headers";
import { leadApi } from "@/lib/api/lead.api";
import { CreateLeadInput } from "@/types/lead";
import { rateLimit } from "@/lib/security/rate-limit";

export interface SubmitLeadResult {
  success: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Upper bounds to reject oversized/abusive payloads before they hit the DB.
const MAX = { name: 100, email: 150, phone: 20, message: 2000 };

export async function submitLead(input: CreateLeadInput): Promise<SubmitLeadResult> {
  // --- Rate limit per client IP (blunt form-spam / abuse) ---
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000); // 5 per 10 min
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many requests. Please try again in ${rl.retryAfter}s.`,
    };
  }

  const name = (input.name?.trim() ?? "").slice(0, MAX.name);
  const email = (input.email?.trim() ?? "").slice(0, MAX.email);
  const phone = (input.phone?.trim() ?? "").slice(0, MAX.phone);
  const message = (input.message?.trim() ?? "").slice(0, MAX.message);

  if (!input.propertyId || Number.isNaN(Number(input.propertyId))) {
    return { success: false, error: "Invalid property." };
  }
  if (name.length < 2) {
    return { success: false, error: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "Please enter a valid email." };
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return { success: false, error: "Please enter a valid phone number." };
  }

  try {
    await leadApi.createLead({
      propertyId: Number(input.propertyId),
      name,
      email,
      phone,
      message,
      propertyUrl: input.propertyUrl,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
