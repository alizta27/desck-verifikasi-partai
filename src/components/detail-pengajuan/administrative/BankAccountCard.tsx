import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import type { BankAccountData } from "@/types/detail-pengajuan";

interface BankAccountCardProps {
  bankAccount: BankAccountData | null;
}

export const BankAccountCard = ({ bankAccount }: BankAccountCardProps) => {
  return (
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
              <Label className="text-muted-foreground text-xs">
                Nama Pemilik Rekening
              </Label>
              <p className="font-medium">{bankAccount.nama_pemilik_rekening}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Nama Bank</Label>
                <p className="font-medium">{bankAccount.nama_bank}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Nomor Rekening
                </Label>
                <p className="font-medium">{bankAccount.nomor_rekening}</p>
              </div>
            </div>
            {bankAccount.file_bukti_rekening && (
              <div className="pt-2 border-t">
                <Label className="text-muted-foreground text-xs">
                  Bukti Rekening
                </Label>
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
  );
};