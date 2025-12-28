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
import { Upload, Eye, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OfficeAddressProofProps {
  data: {
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    alamat_lengkap: string;
    file_foto_kantor_depan: File | null;
    file_foto_papan_nama: File | null;
    file_foto_kantor_depan_url?: string;
    file_foto_papan_nama_url?: string;
  };
  onChange: (field: string, value: any) => void;
  onFileDelete: (field: string) => void;
}

export const OfficeAddressProof = ({
  data,
  onChange,
  onFileDelete,
}: OfficeAddressProofProps) => {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type (accept images only)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("File harus berformat JPG atau PNG");
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }

      onChange(field, selectedFile);
    }
  };

  const renderFileUpload = (
    label: string,
    field: string,
    fileUrl?: string,
    file?: File | null
  ) => (
    <div className="space-y-3">
      <Label htmlFor={field} className="text-sm font-medium">
        {label} <span className="text-destructive">*</span>
      </Label>

      {fileUrl && (
        <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[200px]">
              {fileUrl.split("/").pop()}
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
                    onClick={() => window.open(fileUrl, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lihat Foto</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onFileDelete(field)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hapus Foto</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {!fileUrl && (
        <div className="flex items-center gap-4">
          <Input
            id={field}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => handleFileChange(e, field)}
            className="flex-1 cursor-pointer"
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{file.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>2. Alamat & Bukti Sekretariat (Kantor)</CardTitle>
        <CardDescription>
          Input alamat lengkap sekretariat dan upload foto kantor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provinsi">
              Provinsi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provinsi"
              placeholder="Contoh: DKI Jakarta"
              value={data.provinsi}
              onChange={(e) => onChange("provinsi", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kabupaten_kota">
              Kabupaten/Kota <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kabupaten_kota"
              placeholder="Contoh: Jakarta Pusat"
              value={data.kabupaten_kota}
              onChange={(e) => onChange("kabupaten_kota", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kecamatan">
            Kecamatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="kecamatan"
            placeholder="Contoh: Menteng"
            value={data.kecamatan}
            onChange={(e) => onChange("kecamatan", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alamat_lengkap">
            Alamat Lengkap <span className="text-destructive">*</span>
          </Label>
          <Input
            id="alamat_lengkap"
            placeholder="Contoh: Jl. Sudirman No. 123, RT 001/RW 002"
            value={data.alamat_lengkap}
            onChange={(e) => onChange("alamat_lengkap", e.target.value)}
            required
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          {renderFileUpload(
            "Foto Kantor Tampak Depan",
            "file_foto_kantor_depan",
            data.file_foto_kantor_depan_url,
            data.file_foto_kantor_depan
          )}

          {renderFileUpload(
            "Foto Papan Nama",
            "file_foto_papan_nama",
            data.file_foto_papan_nama_url,
            data.file_foto_papan_nama
          )}

          <p className="text-xs text-muted-foreground">
            Format: <span className="font-medium">JPG atau PNG</span>, Maksimal{" "}
            <span className="font-medium">5MB per file</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
