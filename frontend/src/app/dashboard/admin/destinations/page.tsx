"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { destinationsApi } from "@/lib/api/destinations";
import { Country, University } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Globe2, GraduationCap, Loader2, Plus } from "lucide-react";

export default function AdminDestinationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal: Add Country
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryCurrency, setCountryCurrency] = useState("USD");
  const [countryDesc, setCountryDesc] = useState("");
  const [isSavingCountry, setIsSavingCountry] = useState(false);

  // Modal: Add University
  const [isUnivModalOpen, setIsUnivModalOpen] = useState(false);
  const [univName, setUnivName] = useState("");
  const [univCountryId, setUnivCountryId] = useState("");
  const [univCity, setUnivCity] = useState("");
  const [univWebsite, setUnivWebsite] = useState("");
  const [univDesc, setUnivDesc] = useState("");
  const [isSavingUniv, setIsSavingUniv] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        destinationsApi.listCountries(false),
        destinationsApi.listUniversities({ size: 100 }),
      ]);
      setCountries(cRes.items || []);
      setUniversities(uRes.items || []);
      if ((cRes.items || []).length > 0 && !univCountryId) {
        setUnivCountryId(cRes.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load destinations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCountry(true);
    try {
      await destinationsApi.createCountry({
        name: countryName,
        code: countryCode.toUpperCase(),
        currency: countryCurrency.toUpperCase(),
        description: countryDesc,
      });
      setIsCountryModalOpen(false);
      setCountryName("");
      setCountryCode("");
      setCountryDesc("");
      setFeedback("Study destination country created successfully.");
      await loadData();
    } catch (err) {
      console.error("Failed to create country", err);
    } finally {
      setIsSavingCountry(false);
    }
  };

  const handleCreateUniv = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUniv(true);
    try {
      await destinationsApi.createUniversity({
        name: univName,
        country_id: univCountryId,
        city: univCity,
        website: univWebsite || undefined,
        description: univDesc,
      });
      setIsUnivModalOpen(false);
      setUnivName("");
      setUnivCity("");
      setUnivWebsite("");
      setUnivDesc("");
      setFeedback("University institution created successfully.");
      await loadData();
    } catch (err) {
      console.error("Failed to create university", err);
    } finally {
      setIsSavingUniv(false);
    }
  };

  return (
    <DashboardShell allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Study Destinations & Universities</h1>
            <p className="text-xs text-slate-500">
              Manage supported international educational destinations and registered partner universities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCountryModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Country
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUnivModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add University
            </Button>
          </div>
        </div>

        {feedback && (
          <Alert variant="success" title="Catalog Updated">
            {feedback}
          </Alert>
        )}

        {/* Section 1: Countries */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-indigo-600" />
            <span>Supported Study Destination Countries ({countries.length})</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {countries.map((c) => (
                <Card key={c.id} className="p-4 space-y-1.5 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                    <Badge variant="indigo" size="sm">
                      {c.code}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Currency: {c.currency}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Universities Table */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Universities & Colleges ({universities.length})</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Institution Name</th>
                    <th className="p-3.5">City / Location</th>
                    <th className="p-3.5">Website</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {universities.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3.5 text-slate-600">{u.city}</td>
                      <td className="p-3.5">
                        {u.website ? (
                          <a
                            href={u.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {u.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={u.is_active ? "success" : "neutral"} size="sm">
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Country Modal */}
        <Modal
          isOpen={isCountryModalOpen}
          onClose={() => setIsCountryModalOpen(false)}
          title="Add Destination Country"
          description="Register a new target country for degree programs"
        >
          <form onSubmit={handleCreateCountry} className="space-y-4">
            <Input
              label="Country Name"
              required
              placeholder="e.g. New Zealand"
              value={countryName}
              onChange={(e) => setCountryName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Country Code (2-Letters)"
                required
                maxLength={2}
                placeholder="e.g. NZ"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              />

              <Input
                label="Currency Code"
                required
                maxLength={3}
                placeholder="e.g. NZD"
                value={countryCurrency}
                onChange={(e) => setCountryCurrency(e.target.value)}
              />
            </div>

            <Input
              label="Short Description"
              placeholder="e.g. Renowned research and post-study opportunities"
              value={countryDesc}
              onChange={(e) => setCountryDesc(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCountryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingCountry}>
                Save Country
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add University Modal */}
        <Modal
          isOpen={isUnivModalOpen}
          onClose={() => setIsUnivModalOpen(false)}
          title="Register University"
          description="Add a new academic institution to the database"
        >
          <form onSubmit={handleCreateUniv} className="space-y-4">
            <Input
              label="University Name"
              required
              placeholder="e.g. University of Auckland"
              value={univName}
              onChange={(e) => setUnivName(e.target.value)}
            />

            <Select
              label="Destination Country"
              required
              value={univCountryId}
              onChange={(e) => setUnivCountryId(e.target.value)}
              options={countries.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
            />

            <Input
              label="City / Campus Location"
              required
              placeholder="e.g. Auckland"
              value={univCity}
              onChange={(e) => setUnivCity(e.target.value)}
            />

            <Input
              label="Official Website URL"
              type="url"
              placeholder="https://auckland.ac.nz"
              value={univWebsite}
              onChange={(e) => setUnivWebsite(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUnivModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingUniv}>
                Save University
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardShell>
  );
}
