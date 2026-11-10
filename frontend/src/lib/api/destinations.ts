import { apiClient } from "./client";
import {
  Country,
  CountryListResponse,
  University,
  UniversityListResponse,
} from "@/types/api";

export const destinationsApi = {
  // Countries
  listCountries: async (activeOnly = true): Promise<CountryListResponse> => {
    return apiClient<CountryListResponse>(`/api/v1/countries/?active_only=${activeOnly}`);
  },

  getCountry: async (countryId: string): Promise<Country> => {
    return apiClient<Country>(`/api/v1/countries/${countryId}`);
  },

  createCountry: async (payload: {
    name: string;
    code: string;
    currency: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Country> => {
    return apiClient<Country>("/api/v1/countries/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateCountry: async (
    countryId: string,
    payload: Partial<{
      name: string;
      code: string;
      currency: string;
      description: string;
      is_active: boolean;
    }>
  ): Promise<Country> => {
    return apiClient<Country>(`/api/v1/countries/${countryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // Universities
  listUniversities: async (params?: {
    country_id?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<UniversityListResponse> => {
    const query = new URLSearchParams();
    if (params?.country_id) query.set("country_id", params.country_id);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", params.page.toString());
    if (params?.size) query.set("size", params.size.toString());

    return apiClient<UniversityListResponse>(`/api/v1/universities/?${query.toString()}`);
  },

  getUniversity: async (univId: string): Promise<University> => {
    return apiClient<University>(`/api/v1/universities/${univId}`);
  },

  createUniversity: async (payload: {
    name: string;
    country_id: string;
    city: string;
    website?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<University> => {
    return apiClient<University>("/api/v1/universities/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUniversity: async (
    univId: string,
    payload: Partial<{
      name: string;
      country_id: string;
      city: string;
      website: string;
      description: string;
      is_active: boolean;
    }>
  ): Promise<University> => {
    return apiClient<University>(`/api/v1/universities/${univId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
