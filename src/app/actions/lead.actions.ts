"use server";

import { leadApi } from "@/lib/api/lead.api";
import { CreateLeadInput } from "@/types/lead";

export interface SubmitLeadResult {
  success: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(input: CreateLeadInput): Promise<SubmitLeadResult> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";

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
      message: input.message?.trim() ?? "",
      propertyUrl: input.propertyUrl,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
