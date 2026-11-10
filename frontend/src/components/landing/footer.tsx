"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900">Pocket Consultancy V2</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Modern role-based Education Consultancy Management System connecting prospective students with
              counselors and verified universities worldwide.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>FastAPI & Async MongoDB Powered</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="#features" className="hover:text-indigo-600 transition-colors">
                  Rule-Based Course Matching
                </Link>
              </li>
              <li>
                <Link href="#process" className="hover:text-indigo-600 transition-colors">
                  Counselor Appointments
                </Link>
              </li>
              <li>
                <Link href="#destinations" className="hover:text-indigo-600 transition-colors">
                  Global Universities
                </Link>
              </li>
              <li>
                <Link href="#trust" className="hover:text-indigo-600 transition-colors">
                  Document Verification
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Workspaces
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Counselor Workspace
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Documentation Officer Queue
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Administrator Console
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Security & Verification
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Argon2 password hashing, JWT session security, strict server-side RBAC, and client & magic-byte
              file validation.
            </p>
            <div className="text-[11px] text-slate-400">
              API Base: <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">/api/v1</code>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Pocket Consultancy V2. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Independent Next.js Frontend for Vercel Deployment</p>
        </div>
      </div>
    </footer>
  );
}
