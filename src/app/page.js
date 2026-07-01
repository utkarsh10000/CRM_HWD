"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
};

const EMPLOYEE_ID_PREFIX = "HD/EMP/";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [employeeIdNumber, setEmployeeIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === ROLES.ADMIN;
  const employeeId = employeeIdNumber
    ? `${EMPLOYEE_ID_PREFIX}${employeeIdNumber.padStart(3, "0")}`
    : "";

  function handleRoleChange(nextRole) {
    setRole(nextRole);
    setError("");
  }

  function handleEmployeeIdChange(e) {
    // Only allow digits, max 3 characters, e.g. "019"
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 3);
    setEmployeeIdNumber(digitsOnly);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isAdmin && employeeIdNumber.trim() === "") {
      setError("Enter your employee ID.");
      return;
    }
    if (password.trim() === "") {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isAdmin ? { role, password } : { role, employeeId, password }
        ),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Company logo"
            className="mb-4 h-11 w-11 object-contain"
          />
          <h1 className="text-lg font-semibold text-slate-900">CRM Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {/* Role switch */}
          <div
            role="tablist"
            aria-label="Sign in as"
            className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isAdmin}
              onClick={() => handleRoleChange(ROLES.EMPLOYEE)}
              className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                !isAdmin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Employee
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isAdmin}
              onClick={() => handleRoleChange(ROLES.ADMIN)}
              className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                isAdmin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isAdmin && (
              <div>
                <label
                  htmlFor="employeeId"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Employee ID
                </label>
                <div className="flex items-stretch overflow-hidden rounded-md border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                  <span className="flex items-center bg-slate-50 px-3 text-sm font-medium text-slate-500 select-none">
                    {EMPLOYEE_ID_PREFIX}
                  </span>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{3}"
                    maxLength={3}
                    autoComplete="username"
                    value={employeeIdNumber}
                    onChange={handleEmployeeIdChange}
                    placeholder="019"
                    className="w-full border-0 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Format: {EMPLOYEE_ID_PREFIX}000 — enter just the number, e.g. 19
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {isAdmin && (
              <p className="text-xs text-slate-500">
                Admin sign-in only requires the admin password.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : isAdmin ? "Sign in as admin" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Having trouble signing in? Contact your system administrator.
        </p>
      </div>
    </main>
  );
}