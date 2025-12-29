import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DPDAdministrasiStatus } from "@/types/administrasi-approval";

export const useAdministrasiList = () => {
  const [data, setData] = useState<DPDAdministrasiStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: result, error } = await supabase
        .from("v_dpd_administrasi_status")
        .select("*")
        .order("last_updated", { ascending: false });

      if (error) throw error;

      setData(result as DPDAdministrasiStatus[]);
    } catch (error) {
      console.error("Error loading administrasi data:", error);
      toast.error("Gagal memuat data administrasi");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.nama_dpd.toLowerCase().includes(search.toLowerCase()) ||
      item.provinsi.toLowerCase().includes(search.toLowerCase()) ||
      item.kabupaten_kota.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.overall_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return {
    data: filteredData,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: loadData,
  };
};