export type PasswordStrength = {
  score: number;
  label: "Weak" | "Medium" | "Strong";
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
};

export function checkPasswordStrength(
  password: string
): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) {
    return {
      score,
      label: "Weak",
      color: "bg-red-500",
      checks,
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Medium",
      color: "bg-yellow-500",
      checks,
    };
  }

  return {
    score,
    label: "Strong",
    color: "bg-green-500",
    checks,
  };
}