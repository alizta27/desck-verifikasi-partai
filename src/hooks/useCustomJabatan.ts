import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CustomJabatan } from "@/lib/struktur-constants";

export const useCustomJabatan = () => {
  const [customJabatanList, setCustomJabatanList] = useState<CustomJabatan[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomJabatan();
  }, []);

  const loadCustomJabatan = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("custom_jabatan")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setCustomJabatanList(data as unknown as CustomJabatan[]);
      }
    } catch (error) {
      console.error("Error loading custom jabatan:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomJabatan = async (
    jenisStruktur: string,
    namaJabatan: string
  ): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const exists = customJabatanList.some(
        (cj) =>
          cj.jenis_struktur === jenisStruktur && cj.nama_jabatan === namaJabatan
      );

      if (exists) {
        toast.error("Jabatan ini sudah ada dalam daftar");
        return false;
      }

      const { data, error } = await (supabase as any)
        .from("custom_jabatan")
        .insert({
          dpd_id: user.id,
          jenis_struktur: jenisStruktur,
          nama_jabatan: namaJabatan,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomJabatanList([
        ...customJabatanList,
        data as unknown as CustomJabatan,
      ]);
      toast.success("Jabatan custom berhasil ditambahkan");
      return true;
    } catch (error) {
      console.error("Error adding custom jabatan:", error);
      toast.error("Gagal menambahkan jabatan custom");
      return false;
    }
  };

  return {
    customJabatanList,
    addCustomJabatan,
    loading,
  };
};