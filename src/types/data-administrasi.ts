export interface BankAccountData {
  nama_pemilik_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  file_bukti_rekening: File | null;
  file_bukti_rekening_url?: string;
}

export interface OfficeAddressData {
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  alamat_lengkap: string;
  file_foto_kantor_depan: File | null;
  file_foto_papan_nama: File | null;
  file_foto_kantor_depan_url?: string;
  file_foto_papan_nama_url?: string;
}

export interface OfficeLegalityData {
  jenis_dokumen: string;
  file_dokumen_legalitas: File | null;
  keterangan: string;
  file_dokumen_legalitas_url?: string;
}