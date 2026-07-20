"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthController } from "@/lib/controllers/auth.controller";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAdmin = searchParams.get("from") === "admin";
  const loginPath = isAdmin ? "/admin" : "/auth";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const response = await AuthController.forgotPassword(
      email,
      isAdmin ? "admin" : undefined
    );

    setLoading(false);

    if (response.error) {
      setError(getUserErrorMessage(response.error, "Could not send the reset link."));
      return;
    }

    setSuccess(
      "Password reset link has been sent to your email address."
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="mb-2 text-3xl font-bold">
          Forgot Password
        </h1>

        <p className="mb-8 text-slate-500">
          Enter your registered email address and we'll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
            required
          />

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

        </form>

        <button
          onClick={() => router.push(loginPath)}
          className="mt-6 w-full text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}