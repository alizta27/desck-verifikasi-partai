import type { PengajuanStatus, PengajuanSK, StepStatus } from "@/types/pengajuan";

export const getProgressValue = (status: PengajuanStatus): number => {
  const progress: Record<PengajuanStatus, number> = {
    draft: 10,
    diupload: 25,
    diverifikasi_okk: 50,
    ditolak_okk: 25,
    disetujui_sekjend: 75,
    ditolak_sekjend: 50,
    disetujui_ketum: 90,
    ditolak_ketum: 75,
    sk_terbit: 100,
  };
  return progress[status] || 0;
};

export const getStepStatus = (
  step: string,
  pengajuan: PengajuanSK | null
): StepStatus => {
  if (!pengajuan) return "pending";

  const { status } = pengajuan;

  if (step === "upload") {
    if (status === "draft") return "pending";
    if (status === "diupload") return "current";
    return "completed";
  }

  if (step === "okk") {
    if (["draft", "diupload"].includes(status)) return "pending";
    if (status === "ditolak_okk") return "rejected";
    if (status === "diverifikasi_okk") return "current";
    return "completed";
  }

  if (step === "sekjend") {
    if (
      ["draft", "diupload", "diverifikasi_okk", "ditolak_okk"].includes(status)
    )
      return "pending";
    if (status === "ditolak_sekjend") return "rejected";
    if (status === "disetujui_sekjend") return "current";
    return "completed";
  }

  if (step === "ketum") {
    if (!["disetujui_ketum", "ditolak_ketum", "sk_terbit"].includes(status))
      return "pending";
    if (status === "ditolak_ketum") return "rejected";
    if (status === "disetujui_ketum") return "current";
    return "completed";
  }

  if (step === "terbit") {
    return status === "sk_terbit" ? "completed" : "pending";
  }

  return "pending";
};