"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Compass, GraduationCap, Menu, UserCheck, X } from "lucide-react";

export function LandingNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/dashboard/student";
    switch (user.role) {
      case "admin":
        return "/dashboard/admin";
      case "counselor":
        return "/dashboard/counselor";
      case "documentation_officer":
        return "/dashboard/documentation";
      case "student":
      default:
        return "/dashboard/student";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Pocket Consultancy
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
              Education V2
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Capabilities
          </Link>
          <Link
            href="#process"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#destinations"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Destinations
          </Link>
          <Link
            href="#trust"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Trust & Security
          </Link>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href={getDashboardLink()}>
                <Button variant="primary" size="sm" icon={<Compass className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserCheck className="w-4 h-4" />}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Capabilities
          </Link>
          <Link
            href="#process"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </Link>
          <Link
            href="#destinations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Destinations
          </Link>
          <Link
            href="#trust"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Trust & Security
          </Link>
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <>
                <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Go to Workspace
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Create Student Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
