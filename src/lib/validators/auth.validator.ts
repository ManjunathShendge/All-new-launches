import { LoginData, SignupData } from "@/types/auth.types";

export class AuthValidator {
  /**
   * Login Validation
   */
  static validateLogin(data: LoginData) {
    if (!data.email.trim()) {
      return {
        valid: false,
        message: "Email is required.",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(data.email)) {
      return {
        valid: false,
        message: "Please enter a valid email address.",
      };
    }

    if (!data.password.trim()) {
      return {
        valid: false,
        message: "Password is required.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  /**
   * Signup Validation
   */
  static validateSignup(data: SignupData) {
    if (!data.fullName.trim()) {
      return {
        valid: false,
        message: "Full name is required.",
      };
    }

    

    if (!data.phone.trim()) {
      return {
        valid: false,
        message: "Phone number is required.",
      };
    }

    if (!/^[0-9]{10}$/.test(data.phone)) {
      return {
        valid: false,
        message: "Phone number must be exactly 10 digits.",
      };
    }

    if (!data.email.trim()) {
      return {
        valid: false,
        message: "Email is required.",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(data.email)) {
      return {
        valid: false,
        message: "Please enter a valid email address.",
      };
    }

    if (!data.password.trim()) {
      return {
        valid: false,
        message: "Password is required.",
      };
    }

    if (data.password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  /**
   * Forgot Password Validation
   */
  static validateForgotPassword(email: string) {
    if (!email.trim()) {
      return {
        valid: false,
        message: "Email is required.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  /**
   * Reset Password Validation
   */
  static validateResetPassword(password: string) {
    if (!password.trim()) {
      return {
        valid: false,
        message: "Password is required.",
      };
    }

    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }
}