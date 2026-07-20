import { createClient } from "@/lib/supabase/client";
import { getUserErrorMessage } from "@/lib/errors/user-message";

import { LoginData, SignupData, AuthResponse } from "@/types/auth.types";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export class AuthService {
  /**
   * Login
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      return {
        success: false,
        error: getUserErrorMessage(authError, "Unable to login."),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Unable to login.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    // Agents, owners and users land on the home page and reach their dashboard
    // via the profile menu. Admins go straight to the admin dashboard.
    const redirectTo =
      profile?.role === "admin" ? "/admin/dashboard" : "/";

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      redirectTo,
    };
  }

  /**
   * Admin Login
   *
   * Separate entry point for the /admin route. Authenticates, then requires the
   * account to actually have the `admin` role — otherwise it signs the session
   * back out so a non-admin can't hold an admin session.
   */
  static async adminLogin(data: LoginData): Promise<AuthResponse> {
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      return {
        success: false,
        error: getUserErrorMessage(authError, "Unable to login."),
      };
    }

    if (!authData.user) {
      return { success: false, error: "Unable to login." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "This account doesn't have admin access.",
      };
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      redirectTo: "/admin/dashboard",
    };
  }

  /**
   * Signup
   */

  /**
   * Signup
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const supabase = createClient();

    // Normalize email
    const email = data.email.trim().toLowerCase();

    // STEP 1 - Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        error: "Unable to validate email. Please try again.",
      };
    }

    if (existingUser) {
      return {
        success: false,
        error: "Account already exists. Please log in.",
      };
    }

    // STEP 2 - Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth`,
        data: {
          full_name: data.fullName,
          phone: data.phone,
          account_type: data.accountType,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: getUserErrorMessage(authError, "Unable to create account."),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Unable to create account.",
      };
    }

    // Supabase does NOT return an error when the email is already registered
    // (this prevents email enumeration). Instead it returns a user object with
    // an empty `identities` array. This is the authoritative signal that the
    // account already exists — the STEP 1 profiles check can miss it because
    // RLS blocks the anon client from reading other users' rows.
    if (authData.user.identities && authData.user.identities.length === 0) {
      return {
        success: false,
        error: "Account already exists. Please log in.",
      };
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      message:
        "We've sent a verification email. Please verify your email before logging in.",
    };
  }

  /**
   * Logout
   */
  static async logout() {
    const supabase = createClient();

    return await supabase.auth.signOut();
  }

  /**
   * Get Current User
   */
  static async getCurrentUser() {
    const supabase = createClient();

    return await supabase.auth.getUser();
  }

  /**
   * Get Current Session
   */
  static async getSession() {
    const supabase = createClient();

    return await supabase.auth.getSession();
  }

  /**
   * Forgot Password
   */
  static async forgotPassword(email: string, from?: string) {
    const supabase = createClient();

    // Carry the origin (e.g. "admin") through the email link so the reset page
    // can send the user back to the right login afterwards.
    const suffix = from ? `?from=${encodeURIComponent(from)}` : "";

    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/reset-password${suffix}`,
    });
  }

  /**
   * Resend Verification Email
   */
  static async resendVerificationEmail(email: string) {
    const supabase = createClient();

    return await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth`,
      },
    });
  }

  /**
   * Reset Password
   */
  static async resetPassword(password: string) {
    const supabase = createClient();

    return await supabase.auth.updateUser({
      password,
    });
  }
}
