"use server";

import { headers } from "next/headers";
import { enquiryRepository } from "@/lib/supabase/enquiry.repository";
import { notifyAdmins } from "@/lib/notify";
import { rateLimit } from "@/lib/security/rate-limit";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export interface EnquiryInput {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  interest?: string;
  source?: "blog" | "newsletter" | "contact";
  pageUrl?: string;
}

export interface EnquiryResult {
  success: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 100, email: 150, phone: 20, message: 1000, interest: 60 };

/** Capture a general (non-property) lead: blog expert form, newsletter, etc. */
export async function submitEnquiry(
  input: EnquiryInput
): Promise<EnquiryResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`enquiry:${ip}`, 6, 10 * 60 * 1000); // 6 per 10 min
  if (!rl.ok) {
    return {
      success: false,
      error: `Too many requests. Please try again in ${rl.retryAfter}s.`,
    };
  }

  const name = (input.name ?? "").trim().slice(0, MAX.name);
  const email = (input.email ?? "").trim().slice(0, MAX.email);
  const phone = (input.phone ?? "").trim().slice(0, MAX.phone);
  const message = (input.message ?? "").trim().slice(0, MAX.message);
  const interest = (input.interest ?? "").trim().slice(0, MAX.interest);
  const source = input.source ?? "blog";

  // Newsletter needs only a valid email; the lead form needs name + phone.
  if (source === "newsletter") {
    if (!EMAIL_RE.test(email)) {
      return { success: false, error: "Please enter a valid email." };
    }
  } else {
    if (name.length < 2) {
      return { success: false, error: "Please enter your name." };
    }
    const validPhone = phone.replace(/\D/g, "").length >= 7;
    const validEmail = EMAIL_RE.test(email);
    if (email && !validEmail) {
      return { success: false, error: "Please enter a valid email." };
    }
    // At least one way to reach the person.
    if (!validPhone && !validEmail) {
      return {
        success: false,
        error: "Please add a phone number or email so we can reach you.",
      };
    }
  }

  try {
    await enquiryRepository.create({
      name,
      email,
      phone,
      message,
      interest,
      source,
      pageUrl: input.pageUrl,
    });

    // Best-effort admin notification — never fails the submission.
    try {
      await notifyAdmins({
        type: "new_lead",
        title: source === "newsletter" ? "New newsletter signup" : "New enquiry",
        body:
          source === "newsletter"
            ? `${email} subscribed from the blog.`
            : `${name || "Someone"} (${phone}) requested a callback.`,
        link: "/admin/dashboard",
      });
    } catch {
      /* ignore */
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Something went wrong."),
    };
  }
}
