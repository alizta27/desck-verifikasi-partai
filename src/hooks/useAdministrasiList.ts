import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ApprovalStatus } from "@/types/administrasi-approval";

interface AdministrasiListItem {
  dpd_id: string;
  email: string;
  nama_dpd: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  tipe_organisasi: string;

  // Bank Account Status
  bank_status: ApprovalStatus;
  bank_notes: string | null;
  bank_verified_at: string | null;

  // Office Address Status
  office_status: ApprovalStatus;
  office_notes: string | null;
  office_verified_at: string | null;

  // Office Legality Status
  legality_status: ApprovalStatus;
  legality_notes: string | null;
  legality_verified_at: string | null;

  // Overall status
  overall_status: "all_approved" | "has_rejection" | "pending" | "incomplete";
  last_updated: string;
}

export const useAdministrasiList = () => {
  const [data, setData] = useState<AdministrasiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage, search, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Build query for profiles with role 'dpd' - using 'any' to bypass type checking
      let query = (supabase as any)
        .from("profiles")
        .select(
          `
          id,
          full_name,
          provinsi,
          kabupaten_kota,
          kecamatan,
          tipe_organisasi
        `,
          { count: "exact" }
        )
        .eq("role", "dpd");

      // Apply search filter
      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,provinsi.ilike.%${search}%,kabupaten_kota.ilike.%${search}%`
        );
      }

      const { data: profilesData, error: profilesError, count } = await query;

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setData([]);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      // Get all profile IDs
      const profileIds = profilesData.map((p: any) => p.id);

      // Get emails from auth.users
      const { data: usersData } = await (supabase as any).auth.admin.listUsers();
      const emailMap = new Map(
        usersData?.users?.map((u: any) => [u.id, u.email]) || []
      );

      // Load administrative data for these profiles in parallel
      const [bankData, officeData, legalityData] = await Promise.all([
        (supabase as any)
          .from("dpd_bank_account")
          .select("dpd_id, okk_status, okk_notes, okk_verified_at, updated_at")
          .in("dpd_id", profileIds),
        (supabase as any)
          .from("dpd_office_address")
          .select("dpd_id, okk_status, okk_notes, okk_verified_at, updated_at")
          .in("dpd_id", profileIds),
        (supabase as any)
          .from("dpd_office_legality")
          .select("dpd_id, okk_status, okk_notes, okk_verified_at, updated_at")
          .in("dpd_id", profileIds),
      ]);

      // Create lookup maps
      const bankMap = new Map(
        bankData.data?.map((b: any) => [b.dpd_id, b]) || []
      );
      const officeMap = new Map(
        officeData.data?.map((o: any) => [o.dpd_id, o]) || []
      );
      const legalityMap = new Map(
        legalityData.data?.map((l: any) => [l.dpd_id, l]) || []
      );

      // Combine data
      const combinedData: AdministrasiListItem[] = profilesData.map((profile: any) => {
        const bank: any = bankMap.get(profile.id);
        const office: any = officeMap.get(profile.id);
        const legality: any = legalityMap.get(profile.id);

        const bankStatus = (bank?.okk_status as ApprovalStatus) || "pending";
        const officeStatus = (office?.okk_status as ApprovalStatus) || "pending";
        const legalityStatus = (legality?.okk_status as ApprovalStatus) || "pending";

        // Determine overall status
        let overallStatus: "all_approved" | "has_rejection" | "pending" | "incomplete";
        const hasData = bank || office || legality;

        if (!hasData) {
          overallStatus = "incomplete";
        } else if (
          [bankStatus, officeStatus, legalityStatus].some((s) => s === "rejected")
        ) {
          overallStatus = "has_rejection";
        } else if (
          bankStatus === "approved" &&
          officeStatus === "approved" &&
          legalityStatus === "approved"
        ) {
          overallStatus = "all_approved";
        } else {
          overallStatus = "pending";
        }

        // Get latest update timestamp
        const timestamps = [
          bank?.updated_at,
          office?.updated_at,
          legality?.updated_at,
        ].filter(Boolean);
        const lastUpdated =
          timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((t: any) => new Date(t!).getTime())))
                .toISOString()
            : new Date().toISOString();

        return {
          dpd_id: profile.id,
          email: emailMap.get(profile.id) || "",
          nama_dpd: profile.full_name || "",
          provinsi: profile.provinsi || "",
          kabupaten_kota: profile.kabupaten_kota || "",
          kecamatan: profile.kecamatan || "",
          tipe_organisasi: profile.tipe_organisasi || "dpd",
          bank_status: bankStatus,
          bank_notes: bank?.okk_notes || null,
          bank_verified_at: bank?.okk_verified_at || null,
          office_status: officeStatus,
          office_notes: office?.okk_notes || null,
          office_verified_at: office?.okk_verified_at || null,
          legality_status: legalityStatus,
          legality_notes: legality?.okk_notes || null,
          legality_verified_at: legality?.okk_verified_at || null,
          overall_status: overallStatus,
          last_updated: lastUpdated,
        };
      });

      // Apply status filter
      const filtered =
        statusFilter === "all"
          ? combinedData
          : combinedData.filter((item) => item.overall_status === statusFilter);

      // Calculate pagination
      const total = count || filtered.length;
      setTotalPages(Math.ceil(total / itemsPerPage));

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filtered.slice(startIndex, endIndex);

      setData(paginatedData);
    } catch (error) {
      console.error("Error loading administrasi data:", error);
      toast.error("Gagal memuat data administrasi");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    refresh: loadData,
  };
};