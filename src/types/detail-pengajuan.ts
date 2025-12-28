import type { Database } from "@/integrations/supabase/types";

export type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export interface PengajuanDetail {
  id: string;
  dpd_id: string;
  status: PengajuanStatus;
  tanggal_musda: string;
  lokasi_musda: string;
  file_laporan_musda: string | null;
  catatan_revisi: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    tipe_organisasi: string | null;
    provinsi: string | null;
    kabupaten_kota: string | null;
    kecamatan: string | null;
  };
}

export interface BankAccountData {
  id: string;
  nama_pemilik_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  file_bukti_rekening: string | null;
}

export interface OfficeAddressData {
  id: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  alamat_lengkap: string;
  file_foto_kantor_depan: string | null;
  file_foto_papan_nama: string | null;
}

export interface OfficeLegalityData {
  id: string;
  jenis_dokumen: "sewa" | "pernyataan" | "kepemilikan";
  file_dokumen_legalitas: string | null;
  keterangan: string | null;
}

export interface PengurusData {
  id: string;
  jabatan: string;
  nama_lengkap: string;
  bidang_struktur: string;
  jenis_struktur: string;
  jenis_kelamin: string;
  file_ktp: string;
  urutan: number;
}