import { createClient } from "@/lib/supabase/server";

export class AuthMiddleware {
  /**
   * Get Current Session
   */
  static async getSession() {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    return {
      session,
      error,
    };
  }

  /**
   * Get Current User
   */
  static async getUser() {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return {
      user,
      error,
    };
  }

  /**
   * Check Authentication
   */
  static async isAuthenticated() {
    const { session } = await this.getSession();

    return !!session;
  }
}