import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { id as dateId } from "date-fns/locale";
import { getSignedUrl } from "@/lib/storage";
import type { PengajuanDetail } from "@/types/detail-pengajuan";

interface PengajuanInfoCardProps {
  pengajuan: PengajuanDetail;
}

export const PengajuanInfoCard = ({ pengajuan }: PengajuanInfoCardProps) => {
  return (
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
              {pengajuan?.profiles?.tipe_organisasi === "dpd" &&
                `DPD ${pengajuan?.profiles?.provinsi || ""}`}
              {pengajuan?.profiles?.tipe_organisasi === "dpc" &&
                `DPC ${pengajuan?.profiles?.kabupaten_kota || ""}`}
              {pengajuan?.profiles?.tipe_organisasi === "pac" &&
                `PAC Kec. ${pengajuan?.profiles?.kecamatan || ""}`}
              {!pengajuan?.profiles?.tipe_organisasi &&
                pengajuan?.profiles?.provinsi}
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
              <p className="font-semibold">
                {pengajuan?.profiles?.kabupaten_kota}
              </p>
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
            <Label className="text-muted-foreground">Laporan MUSDA</Label>
            <div className="flex gap-2 mt-2">
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
  );
};