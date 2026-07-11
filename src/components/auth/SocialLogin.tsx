"use client";

import { createClient } from "@/lib/supabase/client";

export default function SocialLogin() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full rounded-lg border py-3"
    >
      Continue with Google
    </button>
  );
}