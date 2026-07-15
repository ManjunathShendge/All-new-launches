import { createClient } from "@/lib/supabase/client";

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
        error: authError.message,
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
      .select("role, account_type")
      .eq("id", authData.user.id)
      .single();

    let redirectTo = "/";

    if (profile?.role === "admin") {
      redirectTo = "/admin";
    } else {
      switch (profile?.account_type) {
        case "agent":
          redirectTo = "/agent";
          break;

        case "owner":
          redirectTo = "/owner";
          break;

        default:
          redirectTo = "/profile";
      }
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      redirectTo,
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
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Unable to create account.",
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
  static async forgotPassword(email: string) {
    const supabase = createClient();

    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/reset-password`,
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
