import { Session, User } from "@supabase/supabase-js";

/* =========================================================
   User Role
========================================================= */

export type UserRole = "admin" | "user";

/* =========================================================
   Account Type
========================================================= */

export type AccountType = "agent" | "owner" | "user";

/* =========================================================
   Login
========================================================= */

export interface LoginData {
  email: string;
  password: string;
}

/* =========================================================
   Signup
========================================================= */

export interface SignupData {
  fullName: string;
  phone: string;
  accountType: AccountType;
  email: string;
  password: string;
}

/* =========================================================
   User Metadata
========================================================= */

export interface UserMetadata {
  full_name: string;
  username: string;
  phone: string;
  account_type: AccountType;
  role: UserRole;
}

/* =========================================================
   Success Response
========================================================= */

export interface AuthSuccessResponse {
  success: true;

  user: User | null;

  session?: Session | null;

  redirectTo?: string;

  message?: string;
}

/* =========================================================
   Error Response
========================================================= */

export interface AuthErrorResponse {
  success: false;
  error: string;
}

/* =========================================================
   Combined Response
========================================================= */

export type AuthResponse =
  | AuthSuccessResponse
  | AuthErrorResponse;