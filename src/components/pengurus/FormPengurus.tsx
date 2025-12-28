import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Pengurus,
  CustomJabatan,
  JENIS_STRUKTUR,
  BIRO_LIST,
  getJabatanByStruktur,
} from "@/lib/struktur-constants";

interface FormPengurusProps {
  currentPengurus: Pengurus;
  setCurrentPengurus: (pengurus: Pengurus) => void;
  editingIndex: number | null;
  onAddPengurus: () => void;
  customJabatanList: CustomJabatan[];
  onOpenCustomDialog: () => void;
}

export const FormPengurus = ({
  currentPengurus,
  setCurrentPengurus,
  editingIndex,
  onAddPengurus,
  customJabatanList,
  onOpenCustomDialog,
}: FormPengurusProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error("File harus berformat JPG, PNG, atau PDF");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setCurrentPengurus({ ...currentPengurus, file_ktp: selectedFile });
    }
  };

  const getAvailableJabatan = (): string[] => {
    const baseJabatan = getJabatanByStruktur(
      currentPengurus.jenis_struktur,
      currentPengurus.bidang_struktur
    );

    const customJabatan = customJabatanList
      .filter((cj) => cj.jenis_struktur === currentPengurus.jenis_struktur)
      .map((cj) => cj.nama_jabatan);

    return [...baseJabatan, ...customJabatan];
  };

  const handleStrukturChange = (value: string) => {
    setCurrentPengurus({
      ...currentPengurus,
      jenis_struktur: value,
      bidang_struktur: "",
      jabatan: "",
    });
  };

  const handleBidangChange = (value: string) => {
    setCurrentPengurus({
      ...currentPengurus,
      bidang_struktur: value,
      jabatan: "",
    });
  };

  return (
    <div className="space-y-4 w-full max-w-full px-2 sm:px-4 overflow-hidden">
      {/* Jenis Struktur */}
      <div className="space-y-2 w-full">
        <Label>Jenis Struktur Pengurus</Label>
        <Select
          value={currentPengurus.jenis_struktur}
          onValueChange={handleStrukturChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih jenis struktur" />
          </SelectTrigger>
          <SelectContent>
            {JENIS_STRUKTUR.map((struktur) => (
              <SelectItem key={struktur} value={struktur}>
                {struktur}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Biro */}
      {currentPengurus.jenis_struktur === "Biro-Biro" && (
        <div className="space-y-2 w-full">
          <Label>Pilih Biro</Label>
          <Select
            value={currentPengurus.bidang_struktur}
            onValueChange={handleBidangChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih biro" />
            </SelectTrigger>
            <SelectContent>
              {BIRO_LIST.map((biro) => (
                <SelectItem key={biro} value={biro}>
                  {biro}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {currentPengurus.jenis_struktur && (
        <>
          {/* Jabatan */}
          <div className="space-y-2 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label>Jabatan</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenCustomDialog}
                className="h-auto py-1 px-2 text-xs w-full sm:w-auto"
              >
                + Tambah Jabatan Custom
              </Button>
            </div>
            <Select
              value={currentPengurus.jabatan}
              onValueChange={(value) =>
                setCurrentPengurus({ ...currentPengurus, jabatan: value })
              }
              disabled={
                !currentPengurus.jenis_struktur ||
                (currentPengurus.jenis_struktur === "Biro-Biro" &&
                  !currentPengurus.bidang_struktur)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableJabatan().map((jab) => (
                  <SelectItem key={jab} value={jab}>
                    {jab}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nama */}
          <div className="space-y-2 w-full">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              placeholder="Masukkan nama lengkap"
              value={currentPengurus.nama_lengkap}
              onChange={(e) =>
                setCurrentPengurus({
                  ...currentPengurus,
                  nama_lengkap: e.target.value,
                })
              }
              className="w-full"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-2 w-full">
            <Label>Jenis Kelamin</Label>
            <Select
              value={currentPengurus.jenis_kelamin}
              onValueChange={(value) =>
                setCurrentPengurus({
                  ...currentPengurus,
                  jenis_kelamin: value,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload KTP */}
          <div className="space-y-2 w-full">
            <Label htmlFor="ktp">Upload KTP (JPG/PNG/PDF)</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <Input
                id="ktp"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                className="w-full sm:flex-1"
              />
              {currentPengurus.file_ktp && (
                <Upload className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Maksimal 5MB</p>
          </div>

          {/* Submit */}
          <Button
            onClick={onAddPengurus}
            className="w-full sm:w-auto mt-4"
            variant={editingIndex !== null ? "default" : "outline"}
          >
            <Plus className="mr-2 h-4 w-4" />
            {editingIndex !== null ? "Update Pengurus" : "Tambah ke Daftar"}
          </Button>
        </>
      )}
    </div>
  );
};
