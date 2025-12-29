import { useState, useEffect } from "react";
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
import { FormPengurus } from "@/components/pengurus/FormPengurus";
import { ListPengurus } from "@/components/pengurus/ListPengurus";
import { ProgressGender } from "@/components/pengurus/ProgressGender";
import { CustomJabatanDialog } from "@/components/pengurus/CustomJabatanDialog";
import { LoadingScreen } from "@/components/ui/spinner";
import { getOrganizationInfo, OrganizationInfo } from "@/lib/organization";
import { usePengurusData } from "@/hooks/usePengurusData";
import { useCustomJabatan } from "@/hooks/useCustomJabatan";
import { usePengurusList } from "@/hooks/usePengurusList";
import { validateGenderRepresentation } from "@/lib/pengurus-validation";
import { savePengurusList } from "@/lib/pengurus-utils";

const InputDataPengurus = () => {
  const navigate = useNavigate();
  const { pengurusList: initialList, pengajuanId, loading } = usePengurusData();
  const { customJabatanList, addCustomJabatan } = useCustomJabatan();

  const {
    pengurusList,
    setPengurusList,
    currentPengurus,
    setCurrentPengurus,
    editingIndex,
    addPengurus,
    editPengurus,
    deletePengurus,
  } = usePengurusList(initialList);

  const [uploading, setUploading] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>({
    tipe: "DPD",
    nama: "DPD",
    fullName: "DPD",
  });

  useEffect(() => {
    loadOrganizationInfo();
  }, []);

  const loadOrganizationInfo = async () => {
    const orgInfo = await getOrganizationInfo();
    setOrganizationInfo(orgInfo);
  };

  const handleSubmit = async () => {
    if (pengurusList.length === 0) {
      toast.error("Minimal ada 1 pengurus yang harus diisi");
      return;
    }

    if (!validateGenderRepresentation(pengurusList)) {
      toast.error("Keterwakilan perempuan minimal 30%");
      return;
    }

    if (!pengajuanId) {
      toast.error("Pengajuan tidak ditemukan");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      await savePengurusList(pengurusList, pengajuanId, user.id);

      toast.success("Data pengurus berhasil disimpan");
      navigate("/progress-sk");
    } catch (error) {
      console.error("Error saving pengurus:", error);
      toast.error("Gagal menyimpan data pengurus");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
                Input Data Pengurus
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
            <CardTitle>Progress Pengajuan SK</CardTitle>
            <CardDescription>Langkah 2 dari 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={66.66} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-large h-[fit-content]">
            <CardHeader>
              <CardTitle>Form Data Pengurus</CardTitle>
              <CardDescription>
                Isi data lengkap pengurus {organizationInfo.tipe} beserta
                dokumen KTP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormPengurus
                currentPengurus={currentPengurus}
                setCurrentPengurus={setCurrentPengurus}
                editingIndex={editingIndex}
                onAddPengurus={addPengurus}
                customJabatanList={customJabatanList}
                onOpenCustomDialog={() => setCustomDialogOpen(true)}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ProgressGender
              pengurusList={pengurusList?.filter(
                (p) => p.jenis_struktur !== "Biro-Biro"
              )}
            />

            <Card className="shadow-large">
              <CardHeader>
                <CardTitle>Daftar Pengurus ({pengurusList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ListPengurus
                  pengurusList={pengurusList}
                  onEdit={editPengurus}
                  onDelete={deletePengurus}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 shadow-medium">
          <CardContent className="pt-6">
            <div className="flex md:flex-row flex-col gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/upload-laporan")}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || pengurusList.length === 0}
                className="flex-1"
              >
                {uploading ? (
                  "Menyimpan..."
                ) : (
                  <>
                    Simpan & Lanjut ke Step 3
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <CustomJabatanDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onAdd={addCustomJabatan}
      />
    </div>
  );
};

export default InputDataPengurus;
