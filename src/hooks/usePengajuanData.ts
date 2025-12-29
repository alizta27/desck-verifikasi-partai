import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PengajuanSK } from "@/types/pengajuan";

export const usePengajuanData = () => {
  const navigate = useNavigate();
  const [pengajuan, setPengajuan] = useState<PengajuanSK | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPengajuan();
  }, []);

  const loadPengajuan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPengajuan(data as PengajuanSK);
      } else {
        toast.info("Belum ada pengajuan SK");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  return {
    pengajuan,
    loading,
  };
};