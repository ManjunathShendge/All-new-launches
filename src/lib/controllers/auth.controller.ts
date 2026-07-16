import { AuthService } from "@/lib/services/auth.service";
import { AuthValidator } from "@/lib/validators/auth.validator";

import { AuthResponse, LoginData, SignupData } from "@/types/auth.types";

export class AuthController {
  /**
   * Login
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    const validation = AuthValidator.validateLogin(data);

    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.message,
      };
    }

    return await AuthService.login(data);
  }

  /**
   * Admin Login
   */
  static async adminLogin(data: LoginData): Promise<AuthResponse> {
    const validation = AuthValidator.validateLogin(data);

    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.message,
      };
    }

    return await AuthService.adminLogin(data);
  }

  /**
   * Signup
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const validation = AuthValidator.validateSignup(data);

    if (!validation.valid) {
      return {
        success: false as const,
        error: validation.message,
      };
    }

    return await AuthService.signup(data);
  }

  /**
   * Logout
   */
  static async logout() {
    return await AuthService.logout();
  }

  /**
   * Forgot Password
   */
  static async forgotPassword(email: string, from?: string) {
    return await AuthService.forgotPassword(email, from);
  }

  /**
   * Resend Verification Email
   */
  static async resendVerificationEmail(email: string) {
    return await AuthService.resendVerificationEmail(email);
  }

  /**
   * Reset Password
   */
  static async resetPassword(password: string) {
    return await AuthService.resetPassword(password);
  }

  /**
   * Current User
   */
  static async getCurrentUser() {
    return await AuthService.getCurrentUser();
  }

  /**
   * Current Session
   */
  static async getSession() {
    return await AuthService.getSession();
  }
}
