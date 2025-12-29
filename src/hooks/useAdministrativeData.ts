import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import type {
  BankAccountData,
  OfficeAddressData,
  OfficeLegalityData,
} from "@/types/data-administrasi";
import { toast } from "sonner";

export const useAdministrativeData = () => {
  const [loading, setLoading] = useState(true);
  const [bankAccountData, setBankAccountData] = useState<BankAccountData>({
    nama_pemilik_rekening: "",
    nama_bank: "",
    nomor_rekening: "",
    file_bukti_rekening: null,
  });

  const [officeAddressData, setOfficeAddressData] =
    useState<OfficeAddressData>({
      provinsi: "",
      kabupaten_kota: "",
      kecamatan: "",
      alamat_lengkap: "",
      file_foto_kantor_depan: null,
      file_foto_papan_nama: null,
    });

  const [officeLegalityData, setOfficeLegalityData] =
    useState<OfficeLegalityData>({
      jenis_dokumen: "",
      file_dokumen_legalitas: null,
      keterangan: "",
    });

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load bank account data
      const { data: bankData } = await (supabase as any)
        .from("dpd_bank_account")
        .select("*")
        .eq("dpd_id", user.id)
        .maybeSingle();

      if (bankData) {
        const signedUrl = await getSignedUrl(
          "dpd-documents",
          bankData.file_bukti_rekening
        );
        setBankAccountData({
          nama_pemilik_rekening: bankData.nama_pemilik_rekening || "",
          nama_bank: bankData.nama_bank || "",
          nomor_rekening: bankData.nomor_rekening || "",
          file_bukti_rekening: null,
          file_bukti_rekening_url: signedUrl || "",
        });
      }

      // Load office address data
      const { data: officeData } = await (supabase as any)
        .from("dpd_office_address")
        .select("*")
        .eq("dpd_id", user.id)
        .maybeSingle();

      if (officeData) {
        const [signedUrlKantorDepan, signedUrlPapanNama] = await Promise.all([
          getSignedUrl("dpd-documents", officeData.file_foto_kantor_depan),
          getSignedUrl("dpd-documents", officeData.file_foto_papan_nama),
        ]);

        setOfficeAddressData({
          provinsi: officeData.provinsi || "",
          kabupaten_kota: officeData.kabupaten_kota || "",
          kecamatan: officeData.kecamatan || "",
          alamat_lengkap: officeData.alamat_lengkap || "",
          file_foto_kantor_depan: null,
          file_foto_papan_nama: null,
          file_foto_kantor_depan_url: signedUrlKantorDepan || "",
          file_foto_papan_nama_url: signedUrlPapanNama || "",
        });
      }

      // Load office legality data
      const { data: legalityData } = await (supabase as any)
        .from("dpd_office_legality")
        .select("*")
        .eq("dpd_id", user.id)
        .maybeSingle();

      if (legalityData) {
        const signedUrl = await getSignedUrl(
          "dpd-documents",
          legalityData.file_dokumen_legalitas
        );

        setOfficeLegalityData({
          jenis_dokumen: legalityData.jenis_dokumen || "",
          file_dokumen_legalitas: null,
          keterangan: legalityData.keterangan || "",
          file_dokumen_legalitas_url: signedUrl || "",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    bankAccountData,
    setBankAccountData,
    officeAddressData,
    setOfficeAddressData,
    officeLegalityData,
    setOfficeLegalityData,
  };
};