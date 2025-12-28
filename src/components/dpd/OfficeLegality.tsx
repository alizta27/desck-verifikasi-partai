import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Eye, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OfficeLegalityProps {
  data: {
    jenis_dokumen: string;
    file_dokumen_legalitas: File | null;
    keterangan: string;
    file_dokumen_legalitas_url?: string;
  };
  onChange: (field: string, value: any) => void;
  onFileDelete: () => void;
}

export const OfficeLegality = ({
  data,
  onChange,
  onFileDelete,
}: OfficeLegalityProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type (accept images and PDFs)
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("File harus berformat JPG, PNG, atau PDF");
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }

      onChange("file_dokumen_legalitas", selectedFile);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>3. Status Kepemilikan / Legalitas Sekretariat</CardTitle>
        <CardDescription>
          Upload dokumen legalitas kepemilikan kantor (surat sewa/pernyataan)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jenis_dokumen">
            Jenis Dokumen <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.jenis_dokumen}
            onValueChange={(value) => onChange("jenis_dokumen", value)}
          >
            <SelectTrigger id="jenis_dokumen">
              <SelectValue placeholder="Pilih jenis dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sewa">Surat Sewa</SelectItem>
              <SelectItem value="pernyataan">Surat Pernyataan</SelectItem>
              <SelectItem value="kepemilikan">Bukti Kepemilikan</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Pilih jenis dokumen yang sesuai dengan status kepemilikan kantor
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="file_dokumen_legalitas" className="text-sm font-medium">
            Upload Dokumen Legalitas{" "}
            <span className="text-destructive">*</span>
          </Label>

          {data.file_dokumen_legalitas_url && (
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[200px]">
                  {data.file_dokumen_legalitas_url.split("/").pop()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(data.file_dokumen_legalitas_url, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Lihat File</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onFileDelete}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hapus File</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {!data.file_dokumen_legalitas_url && (
            <div className="flex items-center gap-4">
              <Input
                id="file_dokumen_legalitas"
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileChange}
                className="flex-1 cursor-pointer"
              />
              {data.file_dokumen_legalitas && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {data.file_dokumen_legalitas.name}
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Format: <span className="font-medium">JPG, PNG, atau PDF</span>,
            Maksimal <span className="font-medium">5MB</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
          <Textarea
            id="keterangan"
            placeholder="Tambahkan keterangan tambahan jika diperlukan..."
            value={data.keterangan}
            onChange={(e) => onChange("keterangan", e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
