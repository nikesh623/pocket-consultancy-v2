"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, Clock, GraduationCap, Lock, Mail, Phone, ShieldAlert, User, UserCheck } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber || null,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to complete registration.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
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
          Create Student Account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600">
          Register to explore courses, book counseling, and track your applications.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Notice about backend approval rule */}
          {!isSuccess && (
            <Alert variant="warning" title="Administrator Approval Notice">
              To maintain academic integrity, all newly registered student accounts start in{" "}
              <strong>Pending</strong> status. An administrator must approve your account before you can
              sign in.
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" title="Registration Error">
              {error}
            </Alert>
          )}

          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Registration Received!</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Your student account for <strong className="text-slate-800">{email}</strong> has been
                  created in <span className="text-amber-600 font-semibold">Pending Approval</span> state.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-left text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Next Steps:</span>
                </div>
                <p>1. Our consultancy administrative team will review your registration.</p>
                <p>2. Once verified and approved, you can log in with your email and password.</p>
                <p>3. If you have immediate questions, contact your consultancy coordinator.</p>
              </div>

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                placeholder="alex.johnson@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Must be at least 8 characters long."
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1-555-0199"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                icon={<UserCheck className="w-4 h-4" />}
              >
                Register Student Account
              </Button>
            </form>
          )}

          {!isSuccess && (
            <div className="text-center pt-2 text-xs text-slate-500">
              <span>Already registered? </span>
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign in to your account
              </Link>
            </div>
          )}
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
