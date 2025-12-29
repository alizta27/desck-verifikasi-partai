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

interface BankAccountData {
  id: string;
  nama_pemilik_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  file_bukti_rekening: string | null;
  okk_status: string;
  okk_notes: string | null;
  okk_verified_at: string | null;
}

interface BankAccountReviewProps {
  data: BankAccountData | null;
  onApprove: (action: ApprovalAction) => Promise<void>;
}

export const BankAccountReview = ({ data, onApprove }: BankAccountReviewProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");
  const [loading, setLoading] = useState(false);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rekening Bank Organisasi</CardTitle>
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

  const handleDownloadFile = async () => {
    if (!data.file_bukti_rekening) return;

    try {
      const { data: fileData, error } = await supabase.storage
        .from("bukti-rekening")
        .download(data.file_bukti_rekening);

      if (error) throw error;

      const url = URL.createObjectURL(fileData);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.file_bukti_rekening.split("/").pop() || "bukti-rekening";
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
            <CardTitle>Rekening Bank Organisasi</CardTitle>
            <StatusBadge status={data.okk_status as any} type="approval" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nama Pemilik Rekening
              </p>
              <p className="text-base font-medium">{data.nama_pemilik_rekening}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nama Bank
              </p>
              <p className="text-base font-medium">{data.nama_bank}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nomor Rekening
              </p>
              <p className="text-base font-medium">{data.nomor_rekening}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Bukti Rekening
              </p>
              {data.file_bukti_rekening ? (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={handleDownloadFile}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download File
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
        documentType="Rekening Bank"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
};