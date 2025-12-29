import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { LoadingScreen } from "@/components/ui/spinner";
import { BankAccountUpload } from "@/components/dpd/BankAccountUpload";
import { OfficeAddressProof } from "@/components/dpd/OfficeAddressProof";
import { OfficeLegality } from "@/components/dpd/OfficeLegality";
import { getOrganizationInfo, OrganizationInfo } from "@/lib/organization";
import { useAdministrativeData } from "@/hooks/useAdministrativeData";
import { useFileOperations } from "@/hooks/useFileOperations";
import type { OfficeAddressData } from "@/types/data-administrasi";

const DataAdministrasiDPD = () => {
  const navigate = useNavigate();
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    tipe: "DPD",
    nama: "DPD",
    fullName: "DPD",
  });

  const {
    loading,
    bankAccountData,
    setBankAccountData,
    officeAddressData,
    setOfficeAddressData,
    officeLegalityData,
    setOfficeLegalityData,
  } = useAdministrativeData();

  const { uploading, setUploading, uploadFile, deleteFile } =
    useFileOperations();

  useEffect(() => {
    loadOrganizationInfo();
  }, []);

  const loadOrganizationInfo = async () => {
    const orgInfo = await getOrganizationInfo();
    setOrganizationInfo(orgInfo);
  };

  const handleBankAccountChange = (field: string, value: any) => {
    setBankAccountData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfficeAddressChange = (field: string, value: any) => {
    setOfficeAddressData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOfficeLegalityChange = (field: string, value: any) => {
    setOfficeLegalityData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankFileDelete = async () => {
    if (!bankAccountData.file_bukti_rekening_url) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = bankAccountData.file_bukti_rekening_url
      .split("/")
      .slice(-2)
      .join("/");

    const success = await deleteFile(
      filePath,
      "dpd_bank_account",
      "file_bukti_rekening",
      user.id
    );

    if (success) {
      setBankAccountData((prev) => ({
        ...prev,
        file_bukti_rekening: null,
        file_bukti_rekening_url: undefined,
      }));
    }
  };

  const handleOfficeFileDelete = async (field: string) => {
    const urlField = `${field}_url` as keyof OfficeAddressData;
    const fileUrl = officeAddressData[urlField];
    if (!fileUrl || typeof fileUrl !== "string") return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = fileUrl.split("/").slice(-2).join("/");

    const success = await deleteFile(
      filePath,
      "dpd_office_address",
      field,
      user.id
    );

    if (success) {
      setOfficeAddressData((prev) => ({
        ...prev,
        [field]: null,
        [urlField]: undefined,
      }));
    }
  };

  const handleLegalityFileDelete = async () => {
    if (!officeLegalityData.file_dokumen_legalitas_url) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = officeLegalityData.file_dokumen_legalitas_url
      .split("/")
      .slice(-2)
      .join("/");

    const success = await deleteFile(
      filePath,
      "dpd_office_legality",
      "file_dokumen_legalitas",
      user.id
    );

    if (success) {
      setOfficeLegalityData((prev) => ({
        ...prev,
        file_dokumen_legalitas: null,
        file_dokumen_legalitas_url: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !bankAccountData.nama_pemilik_rekening ||
      !bankAccountData.nama_bank ||
      !bankAccountData.nomor_rekening ||
      (!bankAccountData.file_bukti_rekening &&
        !bankAccountData.file_bukti_rekening_url)
    ) {
      toast.error("Harap lengkapi semua data rekening organisasi");
      return;
    }

    if (
      !officeAddressData.provinsi ||
      !officeAddressData.kabupaten_kota ||
      !officeAddressData.kecamatan ||
      !officeAddressData.alamat_lengkap ||
      (!officeAddressData.file_foto_kantor_depan &&
        !officeAddressData.file_foto_kantor_depan_url) ||
      (!officeAddressData.file_foto_papan_nama &&
        !officeAddressData.file_foto_papan_nama_url)
    ) {
      toast.error("Harap lengkapi semua data alamat dan bukti sekretariat");
      return;
    }

    if (
      !officeLegalityData.jenis_dokumen ||
      (!officeLegalityData.file_dokumen_legalitas &&
        !officeLegalityData.file_dokumen_legalitas_url)
    ) {
      toast.error("Harap lengkapi data legalitas sekretariat");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        return;
      }

      // Upload bank account file if new
      let bankFileUrl = bankAccountData.file_bukti_rekening_url || "";
      if (bankAccountData.file_bukti_rekening) {
        bankFileUrl = await uploadFile(
          bankAccountData.file_bukti_rekening,
          user.id
        );
      }

      // Upload office photos if new
      let fotoKantorDepanUrl =
        officeAddressData.file_foto_kantor_depan_url || "";
      if (officeAddressData.file_foto_kantor_depan) {
        fotoKantorDepanUrl = await uploadFile(
          officeAddressData.file_foto_kantor_depan,
          user.id
        );
      }

      let fotoPapanNamaUrl = officeAddressData.file_foto_papan_nama_url || "";
      if (officeAddressData.file_foto_papan_nama) {
        fotoPapanNamaUrl = await uploadFile(
          officeAddressData.file_foto_papan_nama,
          user.id
        );
      }

      // Upload legality document if new
      let legalityFileUrl = officeLegalityData.file_dokumen_legalitas_url || "";
      if (officeLegalityData.file_dokumen_legalitas) {
        legalityFileUrl = await uploadFile(
          officeLegalityData.file_dokumen_legalitas,
          user.id
        );
      }

      // Save bank account data
      const { error: bankError } = await (supabase as any)
        .from("dpd_bank_account")
        .upsert(
          {
            dpd_id: user.id,
            nama_pemilik_rekening: bankAccountData.nama_pemilik_rekening,
            nama_bank: bankAccountData.nama_bank,
            nomor_rekening: bankAccountData.nomor_rekening,
            file_bukti_rekening: bankFileUrl,
          },
          {
            onConflict: "dpd_id",
          }
        );

      if (bankError) throw bankError;

      // Save office address data
      const { error: officeError } = await (supabase as any)
        .from("dpd_office_address")
        .upsert(
          {
            dpd_id: user.id,
            provinsi: officeAddressData.provinsi,
            kabupaten_kota: officeAddressData.kabupaten_kota,
            kecamatan: officeAddressData.kecamatan,
            alamat_lengkap: officeAddressData.alamat_lengkap,
            file_foto_kantor_depan: fotoKantorDepanUrl,
            file_foto_papan_nama: fotoPapanNamaUrl,
          },
          {
            onConflict: "dpd_id",
          }
        );

      if (officeError) throw officeError;

      // Save office legality data
      const { error: legalityError } = await (supabase as any)
        .from("dpd_office_legality")
        .upsert(
          {
            dpd_id: user.id,
            jenis_dokumen: officeLegalityData.jenis_dokumen,
            file_dokumen_legalitas: legalityFileUrl,
            keterangan: officeLegalityData.keterangan,
          },
          {
            onConflict: "dpd_id",
          }
        );

      if (legalityError) throw legalityError;

      toast.success("Data administrasi berhasil disimpan");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <img src={hanuraLogo} alt="HANURA" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                H-Gate050 Desk Verifikasi Partai Hanura
              </h1>
              <p className="text-sm text-muted-foreground">
                Data Administrasi {organizationInfo.tipe}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle>Data Administrasi {organizationInfo.tipe}</CardTitle>
            <CardDescription>
              Lengkapi data administrasi organisasi {organizationInfo.tipe} Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={0} className="h-3" />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BankAccountUpload
            data={bankAccountData}
            onChange={handleBankAccountChange}
            onFileDelete={handleBankFileDelete}
          />

          <OfficeAddressProof
            data={officeAddressData}
            onChange={handleOfficeAddressChange}
            onFileDelete={handleOfficeFileDelete}
          />

          <OfficeLegality
            data={officeLegalityData}
            onChange={handleOfficeLegalityChange}
            onFileDelete={handleLegalityFileDelete}
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1"
            >
              Simpan Draft
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (
                "Menyimpan..."
              ) : (
                <>
                  Simpan & Lanjutkan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default DataAdministrasiDPD;