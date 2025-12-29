import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ApprovalAction } from "@/types/administrasi-approval";

interface BankAccountData {
  id: string;
  nama_pemilik_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  file_bukti_rekening: string | null;
  okk_status: string;
  okk_notes: string | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
}

interface OfficeAddressData {
  id: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  alamat_lengkap: string;
  file_foto_kantor_depan: string | null;
  file_foto_papan_nama: string | null;
  okk_status: string;
  okk_notes: string | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
}

interface OfficeLegalityData {
  id: string;
  jenis_dokumen: string;
  file_dokumen_legalitas: string | null;
  keterangan: string | null;
  okk_status: string;
  okk_notes: string | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
}

interface DPDProfileData {
  id: string;
  email: string;
  full_name: string;
  provinsi: string;
  kabupaten_kota: string;
}

export const useAdministrasiDetail = (dpdId: string) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DPDProfileData | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccountData | null>(null);
  const [officeAddress, setOfficeAddress] = useState<OfficeAddressData | null>(null);
  const [officeLegality, setOfficeLegality] = useState<OfficeLegalityData | null>(null);

  useEffect(() => {
    loadData();
  }, [dpdId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, provinsi, kabupaten_kota")
        .eq("id", dpdId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load bank account
      const { data: bankData, error: bankError } = await supabase
        .from("dpd_bank_account")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (bankError) throw bankError;
      setBankAccount(bankData);

      // Load office address
      const { data: officeData, error: officeError } = await supabase
        .from("dpd_office_address")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (officeError) throw officeError;
      setOfficeAddress(officeData);

      // Load office legality
      const { data: legalityData, error: legalityError } = await supabase
        .from("dpd_office_legality")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (legalityError) throw legalityError;
      setOfficeLegality(legalityData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data administrasi");
    } finally {
      setLoading(false);
    }
  };

  const approveBank = async (action: ApprovalAction) => {
    if (!bankAccount) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      const { error } = await supabase
        .from("dpd_bank_account")
        .update({
          okk_status: action.status,
          okk_verified: action.status === "approved",
          okk_verified_at: new Date().toISOString(),
          okk_verified_by: user.id,
          okk_notes: action.notes || null,
        })
        .eq("id", bankAccount.id);

      if (error) throw error;

      toast.success(
        action.status === "approved"
          ? "Rekening bank berhasil diapprove"
          : "Rekening bank berhasil direject"
      );
      await loadData();
    } catch (error) {
      console.error("Error updating bank account:", error);
      toast.error("Gagal mengupdate status");
    }
  };

  const approveOffice = async (action: ApprovalAction) => {
    if (!officeAddress) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      const { error } = await supabase
        .from("dpd_office_address")
        .update({
          okk_status: action.status,
          okk_verified: action.status === "approved",
          okk_verified_at: new Date().toISOString(),
          okk_verified_by: user.id,
          okk_notes: action.notes || null,
        })
        .eq("id", officeAddress.id);

      if (error) throw error;

      toast.success(
        action.status === "approved"
          ? "Alamat kantor berhasil diapprove"
          : "Alamat kantor berhasil direject"
      );
      await loadData();
    } catch (error) {
      console.error("Error updating office address:", error);
      toast.error("Gagal mengupdate status");
    }
  };

  const approveLegality = async (action: ApprovalAction) => {
    if (!officeLegality) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      const { error } = await supabase
        .from("dpd_office_legality")
        .update({
          okk_status: action.status,
          okk_verified: action.status === "approved",
          okk_verified_at: new Date().toISOString(),
          okk_verified_by: user.id,
          okk_notes: action.notes || null,
        })
        .eq("id", officeLegality.id);

      if (error) throw error;

      toast.success(
        action.status === "approved"
          ? "Legalitas kantor berhasil diapprove"
          : "Legalitas kantor berhasil direject"
      );
      await loadData();
    } catch (error) {
      console.error("Error updating office legality:", error);
      toast.error("Gagal mengupdate status");
    }
  };

  return {
    loading,
    profile,
    bankAccount,
    officeAddress,
    officeLegality,
    approveBank,
    approveOffice,
    approveLegality,
    refresh: loadData,
  };
};