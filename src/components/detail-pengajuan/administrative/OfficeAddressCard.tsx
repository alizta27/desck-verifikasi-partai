import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Eye } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";
import type { OfficeAddressData } from "@/types/detail-pengajuan";

interface OfficeAddressCardProps {
  officeAddress: OfficeAddressData | null;
}

export const OfficeAddressCard = ({ officeAddress }: OfficeAddressCardProps) => {
  return (
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
                <Label className="text-muted-foreground text-xs">
                  Kabupaten/Kota
                </Label>
                <p className="text-sm">{officeAddress.kabupaten_kota}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Provinsi</Label>
                <p className="text-sm">{officeAddress.provinsi}</p>
              </div>
            </div>
            {(officeAddress.file_foto_kantor_depan ||
              officeAddress.file_foto_papan_nama) && (
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
  );
};