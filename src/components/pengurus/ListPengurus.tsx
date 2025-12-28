import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { Pengurus } from "@/lib/struktur-constants";

interface ListPengurusProps {
  pengurusList: Pengurus[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export const ListPengurus = ({
  pengurusList,
  onEdit,
  onDelete,
}: ListPengurusProps) => {
  if (pengurusList.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Belum ada pengurus yang ditambahkan
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop view */}
      <div className="hidden sm:block">
        <div className="overflow-auto max-h-[600px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Struktur</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pengurusList.map((pengurus, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">
                    <div>
                      <div className="font-medium">
                        {pengurus.jenis_struktur}
                      </div>
                      {pengurus.bidang_struktur && (
                        <div className="text-xs text-muted-foreground">
                          {pengurus.bidang_struktur}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {pengurus.jabatan}
                  </TableCell>
                  <TableCell>{pengurus.nama_lengkap}</TableCell>
                  <TableCell>
                    {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile view (card layout) */}
      <div className="sm:hidden space-y-3">
        {pengurusList.map((pengurus, index) => (
          <div
            key={index}
            className="rounded-lg border p-3 shadow-sm bg-white flex flex-col space-y-2"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">
                  {pengurus.jabatan || "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pengurus.jenis_struktur}
                  {pengurus.bidang_struktur
                    ? ` - ${pengurus.bidang_struktur}`
                    : ""}
                </p>
              </div>
              <span className="text-xs font-medium text-white bg-orange-300 rounded-sm px-2 py-1">
                {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
              </span>
            </div>

            <div className="text-sm">
              <p className="font-medium">{pengurus.nama_lengkap}</p>
            </div>

            <div className="flex justify-end gap-1 pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(index)}
                className="px-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(index)}
                className="px-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
