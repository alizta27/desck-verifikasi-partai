import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { getSignedUrl } from "@/lib/storage";
import { LoadingScreen } from "@/components/ui/spinner";
import type {
  PengajuanDetail,
  PengajuanStatus,
  AppRole,
  PengurusData,
} from "@/types/detail-pengajuan";

// Import new components
import { PengajuanInfoCard } from "@/components/detail-pengajuan/PengajuanInfoCard";
import { PengurusTable } from "@/components/detail-pengajuan/PengurusTable";
import { VerificationActions } from "@/components/detail-pengajuan/actions/VerificationActions";
import { PublishSKCard } from "@/components/detail-pengajuan/actions/PublishSKCard";
import { RevisionNoteCard } from "@/components/detail-pengajuan/actions/RevisionNoteCard";

const DetailPengajuan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pengajuan, setPengajuan] = useState<PengajuanDetail | null>(null);
  const [pengurusList, setPengurusList] = useState<PengurusData[]>([]);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState("");
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole && id) {
      loadPengajuan();
      loadPengurus();
    }
  }, [userRole, id]);


  const loadUserRole = async () => {
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
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && ["okk", "sekjend", "ketum"].includes(data.role)) {
        setUserRole(data.role as AppRole);
      } else {
        toast.error("Akses ditolak");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading user role:", error);
      toast.error("Gagal memuat data user");
    }
  };

  const loadPengajuan = async () => {
    try {
      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select(
          `
          id,
          dpd_id,
          status,
          tanggal_musda,
          lokasi_musda,
          file_laporan_musda,
          catatan_revisi,
          created_at,
          profiles:dpd_id (
            full_name,
            tipe_organisasi,
            provinsi,
            kabupaten_kota,
            kecamatan
          )
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPengajuan(data as any as PengajuanDetail);
      } else {
        toast.error("Pengajuan tidak ditemukan");
        navigate("/dashboard-admin");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
      navigate("/dashboard-admin");
    } finally {
      setLoading(false);
    }
  };

  const loadPengurus = async () => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select(
          "id, jabatan, nama_lengkap, bidang_struktur, jenis_struktur, jenis_kelamin, file_ktp, urutan"
        )
        .eq("pengajuan_id", id)
        .order("urutan", { ascending: true });

      if (error) throw error;

      setPengurusList(data as any as PengurusData[]);
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };


  const handleVerifikasi = async (approved: boolean) => {
    if (!approved && !catatanRevisi.trim()) {
      toast.error("Catatan revisi wajib diisi untuk penolakan");
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      let newStatus: PengajuanStatus;
      let updateData: any = {};

      if (userRole === "okk") {
        if (approved) {
          newStatus = "diverifikasi_okk";
          updateData = {
            status: newStatus,
            verified_by_okk: user.id,
            verified_okk_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_okk";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else if (userRole === "sekjend") {
        if (approved) {
          newStatus = "disetujui_sekjend";
          updateData = {
            status: newStatus,
            approved_by_sekjend: user.id,
            approved_sekjend_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_sekjend";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else if (userRole === "ketum") {
        if (approved) {
          newStatus = "disetujui_ketum";
          updateData = {
            status: newStatus,
            approved_by_ketum: user.id,
            approved_ketum_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_ketum";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else {
        throw new Error("Role tidak valid");
      }

      const { error } = await supabase
        .from("pengajuan_sk")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(
        approved ? "Pengajuan berhasil disetujui" : "Pengajuan ditolak"
      );
      navigate("/dashboard-admin");
    } catch (error) {
      console.error("Error updating pengajuan:", error);
      toast.error("Gagal memproses pengajuan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerbitkanSK = async () => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("pengajuan_sk")
        .update({
          status: "sk_terbit",
          sk_terbit_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("SK berhasil diterbitkan");
      navigate("/dashboard-admin");
    } catch (error) {
      console.error("Error publishing SK:", error);
      toast.error("Gagal menerbitkan SK");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPdf = async (path: string) => {
    const bucket = path.includes("laporan-musda")
      ? "laporan-musda"
      : "ktp-pengurus";
    const signedUrl = await getSignedUrl(bucket, path);

    if (signedUrl) {
      setPdfUrl(signedUrl);
      setShowPdfDialog(true);
    } else {
      toast.error("Gagal memuat dokumen");
    }
  };

  const canApprove = () => {
    if (!pengajuan || !userRole) return false;

    if (userRole === "okk" && pengajuan?.status === "diupload") return true;
    if (userRole === "sekjend" && pengajuan?.status === "diverifikasi_okk")
      return true;
    if (userRole === "ketum" && pengajuan?.status === "disetujui_sekjend")
      return true;

    return false;
  };

  const canPublishSK = () => {
    return userRole === "ketum" && pengajuan?.status === "disetujui_ketum";
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!pengajuan) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Data Tidak Ditemukan</CardTitle>
            <CardDescription>Pengajuan tidak ditemukan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/dashboard-admin")}
              className="w-full"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
                Detail Pengajuan SK
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard-admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PengajuanInfoCard pengajuan={pengajuan} />

            <PengurusTable
              pengurusList={pengurusList}
              onViewPdf={handleViewPdf}
            />
          </div>

          <div className="space-y-6">
            {canApprove() && userRole && (
              <VerificationActions
                userRole={userRole}
                catatanRevisi={catatanRevisi}
                onCatatanChange={setCatatanRevisi}
                onVerifikasi={handleVerifikasi}
                actionLoading={actionLoading}
              />
            )}

            {canPublishSK() && (
              <PublishSKCard
                onPublish={handleTerbitkanSK}
                actionLoading={actionLoading}
              />
            )}

            {pengajuan?.catatan_revisi && (
              <RevisionNoteCard catatan={pengajuan.catatan_revisi} />
            )}
          </div>
        </div>
      </main>

      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogTitle>Preview</DialogTitle>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded"
              title="PDF Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailPengajuan;
