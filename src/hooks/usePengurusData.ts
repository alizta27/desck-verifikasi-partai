import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Pengurus } from "@/lib/struktur-constants";

export const usePengurusData = () => {
  const navigate = useNavigate();
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
  const [pengajuanId, setPengajuanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPengajuan();
  }, []);

  const loadPengajuan = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPengajuanId(data.id);
        loadPengurus(data.id);
      } else {
        toast.error(
          "Tidak ada pengajuan draft. Silakan upload laporan MUSDA terlebih dahulu"
        );
        navigate("/upload-laporan");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const loadPengurus = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .eq("pengajuan_id", id)
        .order("urutan", { ascending: true });

      if (error) throw error;

      if (data) {
        setPengurusList(data as unknown as Pengurus[]);
      }
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };

  return {
    pengurusList,
    setPengurusList,
    pengajuanId,
    loading,
  };
};