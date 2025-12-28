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

interface BankAccountUploadProps {
  data: {
    nama_pemilik_rekening: string;
    nama_bank: string;
    nomor_rekening: string;
    file_bukti_rekening: File | null;
    file_bukti_rekening_url?: string;
  };
  onChange: (field: string, value: any) => void;
  onFileDelete: () => void;
}

export const BankAccountUpload = ({
  data,
  onChange,
  onFileDelete,
}: BankAccountUploadProps) => {
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

      onChange("file_bukti_rekening", selectedFile);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>1. Upload & Validasi Rekening Organisasi</CardTitle>
        <CardDescription>
          Upload bukti rekening organisasi (buku tabungan/surat bank) dan
          informasi rekening
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nama_pemilik_rekening">
            Nama Pemilik Rekening <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nama_pemilik_rekening"
            placeholder="Contoh: DPD HANURA Jakarta"
            value={data.nama_pemilik_rekening}
            onChange={(e) =>
              onChange("nama_pemilik_rekening", e.target.value)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama_bank">
            Nama Bank <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nama_bank"
            placeholder="Contoh: Bank Mandiri"
            value={data.nama_bank}
            onChange={(e) => onChange("nama_bank", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomor_rekening">
            Nomor Rekening <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nomor_rekening"
            placeholder="Contoh: 1234567890"
            value={data.nomor_rekening}
            onChange={(e) => onChange("nomor_rekening", e.target.value)}
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="file_bukti_rekening" className="text-sm font-medium">
            Upload Bukti Rekening (Buku Tabungan/Surat Bank){" "}
            <span className="text-destructive">*</span>
          </Label>

          {data.file_bukti_rekening_url && (
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[200px]">
                  {data.file_bukti_rekening_url.split("/").pop()}
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
                          window.open(data.file_bukti_rekening_url, "_blank")
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

          {!data.file_bukti_rekening_url && (
            <div className="flex items-center gap-4">
              <Input
                id="file_bukti_rekening"
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileChange}
                className="flex-1 cursor-pointer"
              />
              {data.file_bukti_rekening && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {data.file_bukti_rekening.name}
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
      </CardContent>
    </Card>
  );
};
