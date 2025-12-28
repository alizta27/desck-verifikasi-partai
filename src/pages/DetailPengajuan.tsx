import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  Building2,
  CreditCard,
  MapPin,
  FileCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as dateId } from "date-fns/locale";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { getSignedUrl } from "@/lib/storage";
import type { Database } from "@/integrations/supabase/types";
import { LoadingScreen } from "@/components/ui/spinner";

type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface PengajuanDetail {
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

interface BankAccountData {
  id: string;
  nama_pemilik_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  file_bukti_rekening: string | null;
}

interface OfficeAddressData {
  id: string;
  provinsi: string;
  kabupaten_kota: string;
  kecamatan: string;
  alamat_lengkap: string;
  file_foto_kantor_depan: string | null;
  file_foto_papan_nama: string | null;
}

interface OfficeLegalityData {
  id: string;
  jenis_dokumen: "sewa" | "pernyataan" | "kepemilikan";
  file_dokumen_legalitas: string | null;
  keterangan: string | null;
}

interface PengurusData {
  id: string;
  jabatan: string;
  nama_lengkap: string;
  bidang_struktur: string;
  jenis_struktur: string;
  jenis_kelamin: string;
  file_ktp: string;
  urutan: number;
}

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
  const [bankAccount, setBankAccount] = useState<BankAccountData | null>(null);
  const [officeAddress, setOfficeAddress] = useState<OfficeAddressData | null>(null);
  const [officeLegality, setOfficeLegality] = useState<OfficeLegalityData | null>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole && id) {
      loadPengajuan();
      loadPengurus();
    }
  }, [userRole, id]);

  useEffect(() => {
    if (pengajuan?.dpd_id) {
      loadAdministrativeData(pengajuan.dpd_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pengajuan?.dpd_id]);

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
        setPengajuan((data as any) as PengajuanDetail);
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
        .select("id, jabatan, nama_lengkap, bidang_struktur, jenis_struktur, jenis_kelamin, file_ktp, urutan")
        .eq("pengajuan_id", id)
        .order("urutan", { ascending: true });

      if (error) throw error;

      setPengurusList((data as any) as PengurusData[]);
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };

  const loadAdministrativeData = async (dpdId: string) => {
    try {
      // Load bank account
      const { data: bankData } = await (supabase as any)
        .from("dpd_bank_account")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (bankData) setBankAccount(bankData as unknown as BankAccountData);

      // Load office address
      const { data: officeData } = await (supabase as any)
        .from("dpd_office_address")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (officeData) setOfficeAddress(officeData as unknown as OfficeAddressData);

      // Load office legality
      const { data: legalityData } = await (supabase as any)
        .from("dpd_office_legality")
        .select("*")
        .eq("dpd_id", dpdId)
        .maybeSingle();

      if (legalityData) setOfficeLegality(legalityData as unknown as OfficeLegalityData);
    } catch (error) {
      console.error("Error loading administrative data:", error);
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

  const perempuanCount = pengurusList.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;
  const perempuanPercentage =
    pengurusList.length > 0 ? (perempuanCount / pengurusList.length) * 100 : 0;

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
            <Card className="shadow-large">
              <CardHeader>
                <CardTitle>Informasi Pengajuan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tipe Organisasi</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="font-semibold">
                        {pengajuan?.profiles?.tipe_organisasi?.toUpperCase() || "DPD"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nama Organisasi</Label>
                    <p className="font-semibold">
                      {pengajuan?.profiles?.tipe_organisasi === "dpd" && `DPD ${pengajuan?.profiles?.provinsi || ""}`}
                      {pengajuan?.profiles?.tipe_organisasi === "dpc" && `DPC ${pengajuan?.profiles?.kabupaten_kota || ""}`}
                      {pengajuan?.profiles?.tipe_organisasi === "pac" && `PAC Kec. ${pengajuan?.profiles?.kecamatan || ""}`}
                      {!pengajuan?.profiles?.tipe_organisasi && pengajuan?.profiles?.provinsi}
                    </p>
                  </div>
                  {pengajuan?.profiles?.provinsi && (
                    <div>
                      <Label className="text-muted-foreground">Provinsi</Label>
                      <p className="font-semibold">{pengajuan?.profiles?.provinsi}</p>
                    </div>
                  )}
                  {pengajuan?.profiles?.kabupaten_kota && (
                    <div>
                      <Label className="text-muted-foreground">Kabupaten/Kota</Label>
                      <p className="font-semibold">{pengajuan?.profiles?.kabupaten_kota}</p>
                    </div>
                  )}
                  {pengajuan?.profiles?.kecamatan && (
                    <div>
                      <Label className="text-muted-foreground">Kecamatan</Label>
                      <p className="font-semibold">{pengajuan?.profiles?.kecamatan}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Tanggal MUSDA</Label>
                    <p className="font-semibold">
                      {format(new Date(pengajuan?.tanggal_musda), "PPP", {
                        locale: dateId,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lokasi MUSDA</Label>
                    <p className="font-semibold">{pengajuan?.lokasi_musda}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tanggal Pengajuan</Label>
                    <p className="font-semibold">
                      {format(new Date(pengajuan?.created_at), "PPP", {
                        locale: dateId,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge>{pengajuan?.status}</Badge>
                    </div>
                  </div>
                </div>

                {pengajuan?.file_laporan_musda && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground">
                      Laporan MUSDA
                    </Label>
                    <div className="flex gap-2 mt-2">
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleViewPdf(pengajuan?.file_laporan_musda!)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat PDF
                      </Button> */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const signedUrl = await getSignedUrl(
                            "laporan-musda",
                            pengajuan?.file_laporan_musda!
                          );
                          if (signedUrl) window.open(signedUrl, "_blank");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-large">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Data Pengurus ({pengurusList.length})</CardTitle>
                  <Badge
                    variant={
                      perempuanPercentage >= 30 ? "default" : "destructive"
                    }
                  >
                    Perempuan: {perempuanPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pengurusList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada data pengurus
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Struktur</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>JK</TableHead>
                        <TableHead>KTP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengurusList.map((pengurus, index) => (
                        <TableRow key={pengurus.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {/* {pengurus.jenis_struktur || "-"} */}
                            <div>
                              <div className="font-medium">
                                {pengurus.jenis_struktur}
                              </div>
                              {pengurus.bidang_struktur && (
                                <div className="text-xs text-muted-foreground">
                                  {pengurus.bidang_struktur}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {pengurus.jabatan}
                          </TableCell>
                          <TableCell>{pengurus.nama_lengkap}</TableCell>
                          <TableCell>
                            {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPdf(pengurus.file_ktp)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Data Administrasi - Bank Account */}
            <Card className="shadow-large">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Data Rekening</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!bankAccount ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada data rekening
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nama Pemilik Rekening</Label>
                      <p className="font-medium">{bankAccount.nama_pemilik_rekening}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Nama Bank</Label>
                        <p className="font-medium">{bankAccount.nama_bank}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nomor Rekening</Label>
                        <p className="font-medium">{bankAccount.nomor_rekening}</p>
                      </div>
                    </div>
                    {bankAccount.file_bukti_rekening && (
                      <div className="pt-2 border-t">
                        <Label className="text-muted-foreground text-xs">Bukti Rekening</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={async () => {
                            const signedUrl = await getSignedUrl(
                              "dpd-documents",
                              bankAccount.file_bukti_rekening!
                            );
                            if (signedUrl) window.open(signedUrl, "_blank");
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Dokumen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Administrasi - Office Address */}
            <Card className="shadow-large">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Alamat Sekretariat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!officeAddress ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada data alamat sekretariat
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Alamat Lengkap</Label>
                      <p className="font-medium">{officeAddress.alamat_lengkap}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Kecamatan</Label>
                        <p className="text-sm">{officeAddress.kecamatan}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Kabupaten/Kota</Label>
                        <p className="text-sm">{officeAddress.kabupaten_kota}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Provinsi</Label>
                        <p className="text-sm">{officeAddress.provinsi}</p>
                      </div>
                    </div>
                    {(officeAddress.file_foto_kantor_depan || officeAddress.file_foto_papan_nama) && (
                      <div className="pt-2 border-t">
                        <Label className="text-muted-foreground text-xs">Foto Kantor</Label>
                        <div className="flex gap-2 mt-2">
                          {officeAddress.file_foto_kantor_depan && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const signedUrl = await getSignedUrl(
                                  "dpd-documents",
                                  officeAddress.file_foto_kantor_depan!
                                );
                                if (signedUrl) window.open(signedUrl, "_blank");
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Foto Depan
                            </Button>
                          )}
                          {officeAddress.file_foto_papan_nama && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const signedUrl = await getSignedUrl(
                                  "dpd-documents",
                                  officeAddress.file_foto_papan_nama!
                                );
                                if (signedUrl) window.open(signedUrl, "_blank");
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Papan Nama
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Administrasi - Office Legality */}
            <Card className="shadow-large">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Legalitas Kantor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!officeLegality ? (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada data legalitas kantor
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Jenis Dokumen</Label>
                      <Badge variant="secondary" className="mt-1">
                        {officeLegality.jenis_dokumen === "sewa" && "Surat Sewa"}
                        {officeLegality.jenis_dokumen === "pernyataan" && "Surat Pernyataan"}
                        {officeLegality.jenis_dokumen === "kepemilikan" && "Sertifikat Kepemilikan"}
                      </Badge>
                    </div>
                    {officeLegality.keterangan && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Keterangan</Label>
                        <p className="text-sm">{officeLegality.keterangan}</p>
                      </div>
                    )}
                    {officeLegality.file_dokumen_legalitas && (
                      <div className="pt-2 border-t">
                        <Label className="text-muted-foreground text-xs">Dokumen Legalitas</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={async () => {
                            const signedUrl = await getSignedUrl(
                              "dpd-documents",
                              officeLegality.file_dokumen_legalitas!
                            );
                            if (signedUrl) window.open(signedUrl, "_blank");
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Dokumen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {canApprove() && (
              <Card className="shadow-large border-primary">
                <CardHeader>
                  <CardTitle>Aksi Verifikasi</CardTitle>
                  <CardDescription>
                    {userRole === "okk" && "Verifikasi dokumen pengajuan"}
                    {userRole === "sekjend" && "Setujui atau tolak pengajuan"}
                    {userRole === "ketum" && "Persetujuan akhir pengajuan"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catatan">
                      Catatan Revisi (Jika Ditolak)
                    </Label>
                    <Textarea
                      id="catatan"
                      placeholder="Masukkan alasan penolakan..."
                      value={catatanRevisi}
                      onChange={(e) => setCatatanRevisi(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleVerifikasi(true)}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {actionLoading ? "Memproses..." : "Setujui"}
                    </Button>
                    <Button
                      onClick={() => handleVerifikasi(false)}
                      disabled={actionLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {actionLoading ? "Memproses..." : "Tolak"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canPublishSK() && (
              <Card className="shadow-large border-success">
                <CardHeader>
                  <CardTitle>Terbitkan SK</CardTitle>
                  <CardDescription>
                    Pengajuan sudah disetujui. Terbitkan SK sekarang.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleTerbitkanSK}
                    disabled={actionLoading}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {actionLoading ? "Memproses..." : "Terbitkan SK"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {pengajuan?.catatan_revisi && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Catatan Revisi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{pengajuan?.catatan_revisi}</p>
                </CardContent>
              </Card>
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
