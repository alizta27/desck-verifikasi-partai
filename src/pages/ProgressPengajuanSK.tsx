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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { LoadingScreen } from "@/components/ui/spinner";
import { getOrganizationInfo, OrganizationInfo } from "@/lib/organization";
import { usePengajuanData } from "@/hooks/usePengajuanData";
import { getProgressValue, getStepStatus } from "@/lib/pengajuan-utils";
import { STATUS_CONFIG } from "@/constants/pengajuan-status";
import { TimelineStep } from "@/components/pengajuan/TimelineStep";

const ProgressPengajuanSK = () => {
  const navigate = useNavigate();
  const { pengajuan, loading } = usePengajuanData();
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

  const handleRevisi = () => {
    navigate("/upload-laporan");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!pengajuan) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tidak Ada Data</CardTitle>
            <CardDescription>
              Belum ada pengajuan SK yang ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = STATUS_CONFIG[pengajuan.status];
  const StatusIcon = currentStatus.icon;
  const progressValue = getProgressValue(pengajuan.status);
  const isDitolak = pengajuan.status.includes("ditolak");

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
                Progress Pengajuan SK
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
            <CardTitle>Progress Pengajuan SK</CardTitle>
            <CardDescription>Langkah 3 dari 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="h-3" />
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-large">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status Pengajuan</CardTitle>
                <CardDescription>
                  Diajukan pada{" "}
                  {format(new Date(pengajuan.created_at), "PPP", {
                    locale: id,
                  })}
                </CardDescription>
              </div>
              <Badge className={`${currentStatus.color} text-white`}>
                <StatusIcon className="mr-2 h-4 w-4" />
                {currentStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detail MUSDA</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tanggal:</span>
                    <p className="font-medium">
                      {format(new Date(pengajuan.tanggal_musda), "PPP", {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokasi:</span>
                    <p className="font-medium">{pengajuan.lokasi_musda}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Timeline Proses</h3>
                <div className="space-y-4">
                  <TimelineStep
                    icon={FileText}
                    label="Dokumen Diupload"
                    date={pengajuan.created_at}
                    status={getStepStatus("upload", pengajuan)}
                    emptyDateText="-"
                  />

                  <TimelineStep
                    icon={CheckCircle2}
                    label="Verifikasi OKK"
                    date={pengajuan.verified_okk_at}
                    status={getStepStatus("okk", pengajuan)}
                    emptyDateText="Menunggu verifikasi"
                  />

                  <TimelineStep
                    icon={CheckCircle2}
                    label="Persetujuan Sekjend"
                    date={pengajuan.approved_sekjend_at}
                    status={getStepStatus("sekjend", pengajuan)}
                    emptyDateText="Menunggu persetujuan"
                  />

                  <TimelineStep
                    icon={CheckCircle2}
                    label="Persetujuan Ketum"
                    date={pengajuan.approved_ketum_at}
                    status={getStepStatus("ketum", pengajuan)}
                    emptyDateText="Menunggu persetujuan"
                  />

                  <TimelineStep
                    icon={FileText}
                    label="SK Terbit"
                    date={pengajuan.sk_terbit_at}
                    status={getStepStatus("terbit", pengajuan)}
                    emptyDateText="Belum terbit"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">
                      Progress Keseluruhan
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{progressValue}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isDitolak && pengajuan.catatan_revisi && (
          <Card className="mb-6 border-destructive shadow-large">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">
                  Catatan Revisi
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{pengajuan.catatan_revisi}</p>
              <Button onClick={handleRevisi} variant="destructive">
                Revisi & Upload Ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {pengajuan.status === "sk_terbit" && (
          <Card className="border-success shadow-large">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle className="text-success">
                  SK Berhasil Terbit!
                </CardTitle>
              </div>
              <CardDescription>
                Selamat! Surat Keputusan kepengurusan {organizationInfo.tipe} Anda telah terbit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Download SK
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ProgressPengajuanSK;
