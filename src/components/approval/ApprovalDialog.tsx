import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject";
  documentType: string;
  onConfirm: (notes?: string) => void;
  loading?: boolean;
}

export const ApprovalDialog = ({
  open,
  onOpenChange,
  action,
  documentType,
  onConfirm,
  loading = false,
}: ApprovalDialogProps) => {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
    setNotes("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setNotes("");
  };

  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Approve {documentType}
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Reject {documentType}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `Apakah Anda yakin ingin menyetujui ${documentType}?`
              : `Apakah Anda yakin ingin menolak ${documentType}? Pastikan untuk memberikan catatan yang jelas.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan {!isApprove && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                isApprove
                  ? "Catatan tambahan (opsional)..."
                  : "Jelaskan alasan penolakan..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {!isApprove && !notes.trim() && (
              <p className="text-sm text-red-500">
                Catatan wajib diisi untuk penolakan
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={isApprove ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={loading || (!isApprove && !notes.trim())}
          >
            {loading ? "Memproses..." : isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};