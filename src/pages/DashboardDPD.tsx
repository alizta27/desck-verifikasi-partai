import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Users, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { checkAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui/spinner";
import { ApprovalStatusCard } from "@/components/approval/ApprovalStatusCard";

const DashboardDPD = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dataMusda, setDataMusda] = useState<any>(null);
  const [hasAdministrativeData, setHasAdministrativeData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState<{
    tipe: string;
    nama: string;
  }>({ tipe: "DPD", nama: "DPD" });
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setLoading(true);
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          toast.error("Silakan login terlebih dahulu");
          navigate("/auth");
        }
      } catch (error) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, [navigate]);

  const fetchMusdaProgreess = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile to get organization info
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tipe_organisasi, provinsi, kabupaten_kota, kecamatan")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const tipeOrganisasi = (profileData as any).tipe_organisasi;
        const provinsi = (profileData as any).provinsi;
        const kabupatenKota = (profileData as any).kabupaten_kota;
        const kecamatan = (profileData as any).kecamatan;

        let orgName = "";
        let orgType = "DPD";

        switch (tipeOrganisasi) {
          case "dpd":
            orgName = `DPD ${provinsi || ""}`;
            orgType = "DPD";
            break;
          case "dpc":
            orgName = `DPC ${kabupatenKota || ""}`;
            orgType = "DPC";
            break;
          case "pac":
            orgName = `PAC Kec. ${kecamatan || ""}`;
            orgType = "PAC";
            break;
          default:
            orgName = "DPD";
            orgType = "DPD";
        }

        setOrganizationInfo({ tipe: orgType, nama: orgName });
      }

      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setDataMusda(data);

      // Check if administrative data is complete
      const [bankData, officeData, legalityData] = await Promise.all([
        supabase
          .from("dpd_bank_account" as any)
          .select("*")
          .eq("dpd_id", user.id)
          .maybeSingle(),
        supabase
          .from("dpd_office_address" as any)
          .select("*")
          .eq("dpd_id", user.id)
          .maybeSingle(),
        supabase
          .from("dpd_office_legality" as any)
          .select("*")
          .eq("dpd_id", user.id)
          .maybeSingle(),
      ]);

      const hasComplete =
        bankData.data &&
        officeData.data &&
        legalityData.data &&
        (bankData.data as any).file_bukti_rekening &&
        (officeData.data as any).file_foto_kantor_depan &&
        (officeData.data as any).file_foto_papan_nama &&
        (legalityData.data as any).file_dokumen_legalitas;

      setHasAdministrativeData(Boolean(hasComplete));
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusdaProgreess();
  }, []);

  const currentStepFromData = useMemo(() => {
    const { tanggal_musda, lokasi_musda, file_laporan_musda, status } =
      dataMusda ?? {};

    if (
      [
        "diverifikasi_okk",
        "ditolak_okk",
        "disetujui_sekjend",
        "ditolak_sekjend",
        "disetujui_ketum",
        "ditolak_ketum",
        "diupload",
      ].includes(status)
    )
      return 3;

    if (["sk_terbit"].includes(status)) return 4;

    if (tanggal_musda && lokasi_musda && file_laporan_musda) return 2;

    return 1;
  }, [dataMusda]);

  const steps = useMemo(
    () => [
      {
        number: 1,
        title: "Upload Laporan MUSDA",
        description:
          "Upload file PDF laporan hasil MUSDA dan informasi pelaksanaan",
        icon: FileText,
        completed: Boolean(currentStepFromData > 1),
        route: "/upload-laporan",
      },
      {
        number: 2,
        title: "Input Data Pengurus",
        description: `Isi data lengkap pengurus ${organizationInfo.tipe} beserta dokumen pendukung`,
        icon: Users,
        completed: Boolean(currentStepFromData > 2),
        route: "/input-pengurus",
      },
      {
        number: 3,
        title: "Tracking Progress SK",
        description:
          "Pantau status persetujuan SK dari OKK, Sekjend, hingga Ketum",
        icon: CheckCircle2,
        completed: Boolean(currentStepFromData > 3),
        route: "/progress-sk",
      },
    ],
    [currentStepFromData, organizationInfo.tipe]
  );

  const stepProgressLimit = currentStepFromData === 4 ? 100 : 90;
  const progressPercentage = (currentStep / steps.length) * stepProgressLimit;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  useEffect(() => {
    console.log({ progressPercentage, currentStepFromData, currentStep });
    setCurrentStep(currentStepFromData);
  }, [currentStepFromData]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={hanuraLogo} alt="HANURA" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  H-Gate050 Desk Verifikasi Partai Hanura
                </h1>
                <p className="text-sm text-muted-foreground">
                  Dashboard {organizationInfo.nama}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle>Progress Pengajuan SK</CardTitle>
            <CardDescription>
              Langkah {currentStep} dari {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mulai</span>
                <span>{progressPercentage.toFixed(0)}%</span>
                <span>Selesai</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Administrasi Section (Terpisah dari flow MUSDA) */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <ApprovalStatusCard />

          <Card className="shadow-medium border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Kelengkapan Data Administrasi</CardTitle>
              <CardDescription>
                Input data organisasi (dapat diisi kapan saja)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hasAdministrativeData ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-muted-foreground">
                      Status:{" "}
                      {hasAdministrativeData ? "Lengkap" : "Belum Lengkap"}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    • Upload bukti rekening organisasi
                    <br />
                    • Input alamat & foto sekretariat
                    <br />• Upload dokumen legalitas kantor
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/data-administrasi")}
                  variant={hasAdministrativeData ? "outline" : "default"}
                  className="w-full"
                >
                  {hasAdministrativeData ? "Lihat/Edit Data" : "Lengkapi Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.number === currentStep;
            const isCompleted = step.completed;

            return (
              <Card
                key={step.number}
                className={`transition-all duration-300 cursor-pointer hover:shadow-large ${
                  isActive ? "ring-2 ring-primary shadow-large scale-105" : ""
                } ${isCompleted ? "bg-accent/50" : ""}`}
                // onClick={() => setCurrentStep(step.number)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-gradient-primary text-white"
                          : isCompleted
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">
                        Langkah {step.number}
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => navigate(step.route)}
                  >
                    {isCompleted
                      ? "Lihat Detail"
                      : isActive
                      ? "Mulai"
                      : "Mulai"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-accent/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Butuh Bantuan?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Jika Anda mengalami kesulitan dalam proses pengajuan SK, silakan
              hubungi tim dukungan kami.
            </p>
            <Button variant="outline" size="sm">
              Hubungi Dukungan
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardDPD;
