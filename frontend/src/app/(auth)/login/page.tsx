"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { GraduationCap, Lock, LogIn, Mail, ShieldAlert, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || "Failed to sign in. Please verify your credentials.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for testing environments
  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-6 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Pocket Consultancy
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
              Education V2
            </span>
          </div>
        </Link>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          Sign In to Your Workspace
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600">
          Role-aware portal for Students, Counselors, Officers, and Admins.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          {error && (
            <Alert variant="destructive" title="Authentication Error">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@pocketconsultancy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quick Test Credentials (Local Seed)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials("admin@pocketconsultancy.com", "AdminSecurePassword123!")}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <div className="font-semibold text-slate-900">Administrator</div>
                <div className="text-[10px] text-slate-500">System Admin</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("counselor@pocketconsultancy.com", "CounselorPass123!")}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <div className="font-semibold text-slate-900">Counselor</div>
                <div className="text-[10px] text-slate-500">Sarah Jenkins</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("officer@pocketconsultancy.com", "OfficerPass123!")}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <div className="font-semibold text-slate-900">Documentation</div>
                <div className="text-[10px] text-slate-500">Marcus Vance</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("student@example.com", "StudentPass123!")}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-left hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <div className="font-semibold text-slate-900">Student Account</div>
                <div className="text-[10px] text-slate-500">Requires Approval</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-slate-500">
            <span>New student? </span>
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">
            ← Back to Pocket Consultancy Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
