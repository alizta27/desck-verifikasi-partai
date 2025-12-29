import type { Database } from "@/integrations/supabase/types";

export type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];

export interface PengajuanSK {
  id: string;
  status: PengajuanStatus;
  tanggal_musda: string;
  lokasi_musda: string;
  file_laporan_musda: string | null;
  catatan_revisi: string | null;
  verified_okk_at: string | null;
  approved_sekjend_at: string | null;
  approved_ketum_at: string | null;
  sk_terbit_at: string | null;
  created_at: string;
}

export type StepStatus = "completed" | "current" | "pending" | "rejected";