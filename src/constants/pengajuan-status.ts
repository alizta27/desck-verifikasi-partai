import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { PengajuanStatus } from "@/types/pengajuan";

export const STATUS_CONFIG: Record<
  PengajuanStatus,
  { label: string; color: string; icon: any }
> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  diupload: { label: "Diupload", color: "bg-blue-500", icon: Clock },
  diverifikasi_okk: {
    label: "Diverifikasi OKK",
    color: "bg-yellow-500",
    icon: Clock,
  },
  ditolak_okk: { label: "Ditolak OKK", color: "bg-red-500", icon: XCircle },
  disetujui_sekjend: {
    label: "Disetujui Sekjend",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  ditolak_sekjend: {
    label: "Ditolak Sekjend",
    color: "bg-red-500",
    icon: XCircle,
  },
  disetujui_ketum: {
    label: "Disetujui Ketum",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  ditolak_ketum: { label: "Ditolak Ketum", color: "bg-red-500", icon: XCircle },
  sk_terbit: { label: "SK Terbit", color: "bg-primary", icon: CheckCircle2 },
};