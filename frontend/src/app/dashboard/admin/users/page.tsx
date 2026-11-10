"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { usersApi } from "@/lib/api/users";
import { studentsApi } from "@/lib/api/students";
import { AccountStatus, User, UserRole } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Filter,
  Loader2,
  Lock,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal: Create Staff User
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("counselor");
  const [newPhone, setNewPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal: Assign Counselor
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.listUsers({
        role: roleFilter ? (roleFilter as UserRole) : undefined,
        account_status: statusFilter ? (statusFilter as AccountStatus) : undefined,
        size: 100,
      });
      setUsers(res.items || []);

      const cRes = await usersApi.listUsers({ role: "counselor" });
      setCounselors(cRes.items || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleUpdateStatus = async (userId: string, status: AccountStatus, email: string) => {
    try {
      await usersApi.updateUserStatus(userId, status);
      setFeedback(`Status for ${email} updated to "${status}".`);
      await loadUsers();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      await usersApi.createInternalUser({
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
        phone_number: newPhone || null,
      });

      setIsCreateModalOpen(false);
      setFeedback(`Internal user ${newEmail} (${newRole}) created in active status.`);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      await loadUsers();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create staff user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignCounselor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCounselorId) return;
    setIsAssigning(true);

    try {
      await studentsApi.assignCounselor(selectedStudent.id, selectedCounselorId);
      setIsAssignModalOpen(false);
      setFeedback(`Counselor assigned to student ${selectedStudent.full_name}.`);
      await loadUsers();
    } catch (err) {
      console.error("Failed to assign counselor", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Administration & RBAC</h1>
            <p className="text-xs text-slate-500">
              Manage accounts, verify student registrations, and create internal staff users.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Staff User
          </Button>
        </div>

        {feedback && (
          <Alert variant="success" title="Administrative Action">
            {feedback}
          </Alert>
        )}

        {/* Filters Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: "", label: "All Roles" },
              { value: "student", label: "Students" },
              { value: "counselor", label: "Counselors" },
              { value: "documentation_officer", label: "Documentation Officers" },
              { value: "admin", label: "Administrators" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Account Statuses" },
              { value: "pending", label: "Pending Approval" },
              { value: "active", label: "Active" },
              { value: "rejected", label: "Rejected" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No user accounts matching the specified filters.</p>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-slate-500 text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3.5 capitalize font-medium text-slate-700">
                        {u.role.replace(/_/g, " ")}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={u.account_status} />
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(u.created_at)}</td>
                      <td className="p-3.5 text-right space-x-1">
                        {u.role === "student" && u.account_status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] text-indigo-600"
                            onClick={() => {
                              setSelectedStudent(u);
                              setIsAssignModalOpen(true);
                            }}
                          >
                            Assign Advisor
                          </Button>
                        )}

                        {u.account_status === "pending" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleUpdateStatus(u.id, "active", u.email)}
                          >
                            Approve
                          </Button>
                        )}

                        {u.account_status === "active" && u.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] text-amber-600 hover:bg-amber-50"
                            onClick={() => handleUpdateStatus(u.id, "suspended", u.email)}
                          >
                            Suspend
                          </Button>
                        )}

                        {u.account_status === "suspended" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] text-emerald-600"
                            onClick={() => handleUpdateStatus(u.id, "active", u.email)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Internal Staff Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Internal Staff User"
          description="Internal staff accounts are created directly in active status"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            {createError && (
              <Alert variant="destructive" title="Creation Error">
                {createError}
              </Alert>
            )}

            <Input
              label="Full Name"
              required
              placeholder="e.g. Marcus Vance"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. officer@pocketconsultancy.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Temporary Password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Select
              label="Assigned Role"
              required
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              options={[
                { value: "counselor", label: "Counselor (Student Advisor)" },
                { value: "documentation_officer", label: "Documentation Officer (Reviewer)" },
                { value: "admin", label: "Administrator (Full System Access)" },
              ]}
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+1-555-0105"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                Create Staff Account
              </Button>
            </div>
          </form>
        </Modal>

        {/* Assign Counselor Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Academic Counselor"
          description={selectedStudent ? `Assign dedicated advisor to ${selectedStudent.full_name}` : ""}
        >
          <form onSubmit={handleAssignCounselor} className="space-y-4">
            <Select
              label="Select Verified Counselor"
              required
              value={selectedCounselorId}
              onChange={(e) => setSelectedCounselorId(e.target.value)}
              placeholder="Choose a counselor..."
              options={counselors.map((c) => ({
                value: c.id,
                label: `${c.full_name} (${c.email})`,
              }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isAssigning}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
