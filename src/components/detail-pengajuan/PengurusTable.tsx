import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import type { PengurusData } from "@/types/detail-pengajuan";

interface PengurusTableProps {
  pengurusList: PengurusData[];
  onViewPdf: (path: string) => void;
}

export const PengurusTable = ({
  pengurusList,
  onViewPdf,
}: PengurusTableProps) => {
  const perempuanCount = pengurusList.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;
  const perempuanPercentage =
    pengurusList.length > 0 ? (perempuanCount / pengurusList.length) * 100 : 0;

  return (
    <Card className="shadow-large">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Data Pengurus ({pengurusList.length})</CardTitle>
          <Badge
            variant={perempuanPercentage >= 30 ? "default" : "destructive"}
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
                    <div>
                      <div className="font-medium">{pengurus.jenis_struktur}</div>
                      {pengurus.bidang_struktur && (
                        <div className="text-xs text-muted-foreground">
                          {pengurus.bidang_struktur}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{pengurus.jabatan}</TableCell>
                  <TableCell>{pengurus.nama_lengkap}</TableCell>
                  <TableCell>
                    {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewPdf(pengurus.file_ktp)}
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
  );
};