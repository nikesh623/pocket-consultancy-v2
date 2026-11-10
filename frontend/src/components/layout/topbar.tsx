"use client";

import React, { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api/notifications";
import { NotificationItem } from "@/types/api";
import { Bell, Check, ExternalLink, Menu } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function DashboardTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res.unread_count);
      } catch {
        // Ignore unauthenticated or network errors
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const handleOpenDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      try {
        const res = await notificationsApi.listNotifications({ limit: 5 });
        setNotifications(res.items);
      } catch {
        // Ignore
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xs px-4 sm:px-6 lg:px-8">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
          Workstation Environment
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenDropdown}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl p-4 z-50 animate-scale-up space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs space-y-1 transition-colors ${
                        n.is_read
                          ? "bg-slate-50/60 border-slate-100 text-slate-500"
                          : "bg-indigo-50/50 border-indigo-100 text-slate-900 font-medium"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(n.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
