import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "./StatusBadge";
import { useMyApprovalStatus } from "@/hooks/useMyApprovalStatus";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import type { ApprovalStatus } from "@/types/administrasi-approval";

interface ApprovalItem {
  label: string;
  status: ApprovalStatus | null;
  notes: string | null;
}

export const ApprovalStatusCard = () => {
  const { status, loading } = useMyApprovalStatus();

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const items: ApprovalItem[] = [
    {
      label: "Rekening Bank",
      status: status.bank_status,
      notes: status.bank_notes,
    },
    {
      label: "Alamat Sekretariat",
      status: status.office_status,
      notes: status.office_notes,
    },
    {
      label: "Legalitas Sekretariat",
      status: status.legality_status,
      notes: status.legality_notes,
    },
  ];

  const hasRejection = items.some((item) => item.status === "rejected");
  const allApproved = items.every((item) => item.status === "approved");
  const allSubmitted = items.every((item) => item.status !== null);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Status Verifikasi Administrasi</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {allApproved
                ? "Semua dokumen telah disetujui"
                : hasRejection
                ? "Ada dokumen yang ditolak"
                : allSubmitted
                ? "Menunggu verifikasi OKK"
                : "Belum semua dokumen disubmit"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              {item.status ? (
                <StatusBadge status={item.status} type="approval" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Belum disubmit
                </span>
              )}
            </div>
            {item.status === "rejected" && item.notes && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Catatan OKK:</strong> {item.notes}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}

        {hasRejection && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Silakan perbaiki data yang ditolak dan submit ulang melalui menu
              Data Administrasi.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};