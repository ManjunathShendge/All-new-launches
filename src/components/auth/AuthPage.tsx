"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Building,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthController } from "@/lib/controllers/auth.controller";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CheckCircle2, XCircle } from "lucide-react";
import { checkPasswordStrength } from "@/lib/utils/password-strength";

export default function AuthPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [userType, setUserType] = useState<"agent" | "owner" | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [resendingEmail, setResendingEmail] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    accountType: "user" as "agent" | "owner" | "user",
    email: "",
    password: "",
    rememberMe: false,
  });

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // LOGIN
        // LOGIN
        const response = await AuthController.login({
          email: formData.email,
          password: formData.password,
        });

        if (!response.success) {
          setError(response.error);
          return;
        }

        // Send the user to their role-based destination (admin/agent/owner/
        // profile) that AuthService.login resolved, not a hardcoded home page.
        router.replace(response.redirectTo ?? "/");
        router.refresh();
      } else {
        // SIGNUP
        const response = await AuthController.signup({
          fullName: formData.fullName,
          phone: formData.phone,
          accountType: formData.accountType,
          email: formData.email,
          password: formData.password,
        });

        if (!response.success) {
          setError(response.error);
          return;
        }

        // After signup switch back to Login
        setIsLogin(true);

        setUserType(null);

        setFormData({
          fullName: "",
          username: "",
          phone: "",
          accountType: "user",
          email: "",
          password: "",
          rememberMe: false,
        });

        // Show success message instead of alert
        setError("");
        setSuccess(
          response.message ??
            "We've sent a verification email. Please verify your email before logging in.",
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address first.");
      return;
    }

    setError("");
    setSuccess("");
    setResendingEmail(true);

    const { error } = await AuthController.resendVerificationEmail(
      formData.email,
    );

    setResendingEmail(false);

    if (error) {
      setError(getUserErrorMessage(error, "Could not send the verification email."));
      return;
    }

    setSuccess("Verification email has been sent successfully.");
    setCountdown(60);
    setCanResend(false);
  };

  useEffect(() => {
    if (!success || isLogin) return;

    setCountdown(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [success, isLogin]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-187.5">
        {/* LEFT COLUMN - FORM AREA */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          {/* Custom Toggle Switch */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-10 w-fit mx-auto md:mx-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsLogin(true)}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-500 hover:text-slate-900"
              } ${
                loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              Log In
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setIsLogin(false)}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-500 hover:text-slate-900"
              } ${
                loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {isLogin
                ? "Please enter your details to access your dashboard."
                : "Register to list your properties and connect with buyers."}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* SIGN UP EXCLUSIVE FIELDS */}
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Property Agent */}

                    <button
                      type="button"
                      onClick={() => {
                        if (userType === "agent") {
                          setUserType(null);

                          setFormData((prev) => ({
                            ...prev,
                            accountType: "user",
                          }));
                        } else {
                          setUserType("agent");

                          setFormData((prev) => ({
                            ...prev,
                            accountType: "agent",
                          }));
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-3 border rounded-xl transition-all ${
                        userType === "agent"
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      Property Agent
                    </button>

                    {/* Property Owner */}

                    <button
                      type="button"
                      onClick={() => {
                        if (userType === "owner") {
                          setUserType(null);

                          setFormData((prev) => ({
                            ...prev,
                            accountType: "user",
                          }));
                        } else {
                          setUserType("owner");

                          setFormData((prev) => ({
                            ...prev,
                            accountType: "owner",
                          }));
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-3 border rounded-xl transition-all ${
                        userType === "owner"
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      Property Owner
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* COMMON FIELDS (Email & Password) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {isLogin ? "Email or Username" : "Email"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                  placeholder="name@agency.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {!isLogin && formData.password && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Password Strength
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      passwordStrength.label === "Strong"
                        ? "bg-green-100 text-green-700"
                        : passwordStrength.label === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      passwordStrength.label === "Strong"
                        ? "bg-green-500"
                        : passwordStrength.label === "Medium"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                    }}
                  />
                </div>

                {/* Checklist */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Requirement
                    ok={passwordStrength.checks.length}
                    text="8+ Characters"
                  />

                  <Requirement
                    ok={passwordStrength.checks.uppercase}
                    text="Uppercase Letter"
                  />

                  <Requirement
                    ok={passwordStrength.checks.lowercase}
                    text="Lowercase Letter"
                  />

                  <Requirement
                    ok={passwordStrength.checks.number}
                    text="One Number"
                  />

                  <Requirement
                    ok={passwordStrength.checks.special}
                    text="Special Character"
                  />
                </div>
              </div>
            )}

            {/* LOGIN EXCLUSIVE - Remember Me & Forgot Password */}
            {isLogin && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </a>
              </div>
            )}

            {/* error message */}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success message */}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {!isLogin && success && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                {!canResend ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Didn't receive the verification email?
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      You can resend it in
                      <span className="text-blue-600"> {countdown}s</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-3">
                      Didn't receive the verification email?
                    </p>

                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                      className="font-semibold text-blue-600 transition hover:text-blue-700 disabled:opacity-50"
                    >
                      {resendingEmail
                        ? "Sending..."
                        : "Resend Verification Email"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111827] py-4 font-semibold text-white transition-all duration-300 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && <ArrowPathIcon className="h-5 w-5 animate-spin" />}

              {loading
                ? isLogin
                  ? "Signing In..."
                  : "Creating Account..."
                : isLogin
                  ? "Log In"
                  : "Create Account"}

              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          {/* Bottom Links & Security */}
          <div className="mt-8 text-center space-y-6">
            <p className="text-sm text-gray-600">
              {isLogin ? "New to the platform? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isLogin
                  ? "Apply to become an agent \u2192"
                  : "Log in here \u2192"}
              </button>
            </p>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Secured by 256-bit SSL Encryption</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - IMAGE & BRANDING */}
        <div className="hidden md:block w-1/2 relative bg-slate-900 overflow-hidden">
          {/* Background Image - Using a premium real estate image from Unsplash */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80")',
            }}
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

          {/* Content inside the image */}
          <div className="absolute bottom-0 left-0 p-12 text-white">
            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase mb-4 border border-white/20">
              Premium Listings
            </div>
            <h3 className="text-4xl font-bold mb-4 leading-tight text-white">
              Elevate your <br /> real estate portfolio.
            </h3>
            <p className="text-slate-200 text-sm leading-relaxed max-w-md">
              Join our exclusive network of property agents and owners. Access
              high-end clientele, advanced analytics, and seamless property
              management tools all in one place.
            </p>

            {/* Optional: Add a subtle stat or trust badge */}
            <div className="flex gap-6 mt-8 pt-6 border-t border-white/20">
              <div>
                <div className="text-2xl font-bold">10k+</div>
                <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">
                  Active Listings
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">$2B+</div>
                <div className="text-xs text-slate-300 uppercase tracking-wider mt-1">
                  Property Value
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  function Requirement({ ok, text }: { ok: boolean; text: string }) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
          ok ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
        }`}
      >
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
        )}

        <span
          className={`text-sm ${
            ok ? "font-medium text-green-700" : "text-slate-600"
          }`}
        >
          {text}
        </span>
      </div>
    );
  }
}
