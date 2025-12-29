import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ApprovalDialog } from "./ApprovalDialog";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { ApprovalAction } from "@/types/administrasi-approval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

interface OfficeAddressReviewProps {
  data: OfficeAddressData | null;
  onApprove: (action: ApprovalAction) => Promise<void>;
}

export const OfficeAddressReview = ({ data, onApprove }: OfficeAddressReviewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [loading, setLoading] = useState(false);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alamat & Bukti Sekretariat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Data belum disubmit</p>
        </CardContent>
      </Card>
    );
  }

  const handleOpenDialog = (action: "approve" | "reject") => {
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async (notes?: string) => {
    setLoading(true);
    try {
      await onApprove({ status: dialogAction, notes });
      setDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data: fileData, error } = await supabase.storage
        .from("foto-kantor")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(fileData);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Gagal mendownload file");
    }
  };

  const isPending = data.okk_status === "pending";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alamat & Bukti Sekretariat</CardTitle>
            <StatusBadge status={data.okk_status as any} type="approval" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Provinsi</p>
              <p className="text-base font-medium">{data.provinsi}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Kabupaten/Kota
              </p>
              <p className="text-base font-medium">{data.kabupaten_kota}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kecamatan</p>
              <p className="text-base font-medium">{data.kecamatan}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                Alamat Lengkap
              </p>
              <p className="text-base font-medium">{data.alamat_lengkap}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Foto Kantor Depan
              </p>
              {data.file_foto_kantor_depan ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      data.file_foto_kantor_depan!,
                      "foto-kantor-depan.jpg"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada file</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Foto Papan Nama
              </p>
              {data.file_foto_papan_nama ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      data.file_foto_papan_nama!,
                      "foto-papan-nama.jpg"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada file</p>
              )}
            </div>
          </div>

          {data.okk_notes && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Catatan OKK
              </p>
              <p className="text-sm">{data.okk_notes}</p>
            </div>
          )}

          {data.okk_verified_at && (
            <div>
              <p className="text-sm text-muted-foreground">
                Diverifikasi pada{" "}
                {format(new Date(data.okk_verified_at), "PPP 'pukul' HH:mm", {
                  locale: id,
                })}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              onClick={() => handleOpenDialog("approve")}
              disabled={!isPending || loading}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleOpenDialog("reject")}
              disabled={!isPending || loading}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={dialogAction}
        documentType="Alamat & Bukti Sekretariat"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
};