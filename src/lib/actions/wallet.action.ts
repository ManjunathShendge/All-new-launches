"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { walletRepository } from "@/lib/supabase/wallet.repository";
import { notifyUser } from "@/lib/notify";

const RZP_KEY = process.env.RAZORPAY_KEY_ID;
const RZP_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RZP_PUBLIC = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? RZP_KEY;

const MIN_TOPUP = 1; // ₹
const MAX_TOPUP = 100000; // ₹

/** Any signed-in user may fund their wallet — the marketplace is open to all. */
async function requireUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export interface TopupOrder {
  ok: boolean;
  error?: string;
  orderId?: string;
  amount?: number; // paise
  currency?: string;
  keyId?: string;
}

/** Create a Razorpay order for a wallet top-up. */
export async function createTopupOrder(amount: number): Promise<TopupOrder> {
  const id = await requireUserId();
  if (!id) return { ok: false, error: "Sign in to continue." };
  if (!RZP_KEY || !RZP_SECRET) {
    return { ok: false, error: "Payments are not configured yet." };
  }
  const rupees = Math.floor(Number(amount));
  if (Number.isNaN(rupees) || rupees < MIN_TOPUP || rupees > MAX_TOPUP) {
    return { ok: false, error: `Enter an amount between ₹${MIN_TOPUP} and ₹${MAX_TOPUP}.` };
  }

  const auth = Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: rupees * 100,
      currency: "INR",
      receipt: `wallet_${id.slice(0, 8)}_${Date.now()}`,
      notes: { profile_id: id },
    }),
  });
  if (!res.ok) return { ok: false, error: "Could not start payment." };
  const order = (await res.json()) as { id: string; amount: number };

  return {
    ok: true,
    orderId: order.id,
    amount: order.amount,
    currency: "INR",
    keyId: RZP_PUBLIC,
  };
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
  balance?: number;
}

/**
 * Verify a completed Razorpay payment and credit the wallet.
 * Security: HMAC signature check + confirm the paid amount from Razorpay's API
 * (never trust the client amount) + idempotency on the payment id.
 */
export async function verifyTopup(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<VerifyResult> {
  const id = await requireUserId();
  if (!id) return { ok: false, error: "Unauthorized." };
  if (!RZP_KEY || !RZP_SECRET) {
    return { ok: false, error: "Payments are not configured." };
  }

  const expected = crypto
    .createHmac("sha256", RZP_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (expected !== signature) {
    return { ok: false, error: "Payment verification failed." };
  }

  // Idempotency — don't double-credit if this payment was already applied.
  if (await walletRepository.transactionExists(paymentId)) {
    return { ok: true, balance: await walletRepository.getBalance(id) };
  }

  // Confirm the actual paid amount from Razorpay.
  const auth = Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) return { ok: false, error: "Could not confirm payment." };
  const order = (await res.json()) as {
    status: string;
    amount: number;
    amount_paid: number;
    notes?: { profile_id?: string };
  };
  if (order.status !== "paid") {
    return { ok: false, error: "Payment not completed." };
  }
  // The order was created for this agent.
  if (order.notes?.profile_id && order.notes.profile_id !== id) {
    return { ok: false, error: "Payment mismatch." };
  }

  const rupees = Number(order.amount_paid ?? order.amount) / 100;
  const balance = await walletRepository.credit(id, rupees, "topup", paymentId);
  await notifyUser(id, {
    type: "topup",
    title: "Wallet top-up successful",
    body: `₹${rupees.toLocaleString("en-IN")} was added. New balance ₹${Math.round(balance).toLocaleString("en-IN")}.`,
    link: "/leads-marketplace",
  });
  revalidatePath("/leads-marketplace");
  return { ok: true, balance };
}
