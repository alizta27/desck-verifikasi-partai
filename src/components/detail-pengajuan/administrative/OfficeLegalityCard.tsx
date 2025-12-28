import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Eye } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import type { OfficeLegalityData } from "@/types/detail-pengajuan";

interface OfficeLegalityCardProps {
  officeLegality: OfficeLegalityData | null;
}

export const OfficeLegalityCard = ({
  officeLegality,
}: OfficeLegalityCardProps) => {
  return (
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
                {officeLegality.jenis_dokumen === "pernyataan" &&
                  "Surat Pernyataan"}
                {officeLegality.jenis_dokumen === "kepemilikan" &&
                  "Sertifikat Kepemilikan"}
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
                <Label className="text-muted-foreground text-xs">
                  Dokumen Legalitas
                </Label>
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
  );
};