import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import type { AppRole } from "@/types/detail-pengajuan";

interface VerificationActionsProps {
  userRole: AppRole;
  catatanRevisi: string;
  onCatatanChange: (value: string) => void;
  onVerifikasi: (approved: boolean) => void;
  actionLoading: boolean;
}

export const VerificationActions = ({
  userRole,
  catatanRevisi,
  onCatatanChange,
  onVerifikasi,
  actionLoading,
}: VerificationActionsProps) => {
  return (
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
          <Label htmlFor="catatan">Catatan Revisi (Jika Ditolak)</Label>
          <Textarea
            id="catatan"
            placeholder="Masukkan alasan penolakan..."
            value={catatanRevisi}
            onChange={(e) => onCatatanChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onVerifikasi(true)}
            disabled={actionLoading}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {actionLoading ? "Memproses..." : "Setujui"}
          </Button>
          <Button
            onClick={() => onVerifikasi(false)}
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
  );
};