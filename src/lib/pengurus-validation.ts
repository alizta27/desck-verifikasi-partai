import type { Pengurus } from "@/lib/struktur-constants";

export const validatePengurusForm = (pengurus: Pengurus): string | null => {
  if (
    !pengurus.jenis_struktur ||
    !pengurus.jabatan ||
    !pengurus.nama_lengkap ||
    !pengurus.jenis_kelamin ||
    !pengurus.file_ktp
  ) {
    return "Semua field wajib diisi";
  }

  if (pengurus.jenis_struktur === "Biro-Biro" && !pengurus.bidang_struktur) {
    return "Pilih biro terlebih dahulu";
  }

  return null;
};

export const validateGenderRepresentation = (
  pengurusList: Pengurus[]
): boolean => {
  if (pengurusList.length === 0) return false;

  const nonBiroPengurus = pengurusList.filter(
    (p) => p.jenis_struktur !== "Biro-Biro"
  );

  if (nonBiroPengurus.length === 0) return true;

  const perempuanCount = nonBiroPengurus.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;

  const percentage = (perempuanCount / nonBiroPengurus.length) * 100;
  return percentage >= 30;
};

export const getGenderStats = (
  pengurusList: Pengurus[]
): { total: number; perempuan: number; percentage: number } => {
  const nonBiroPengurus = pengurusList.filter(
    (p) => p.jenis_struktur !== "Biro-Biro"
  );

  const total = nonBiroPengurus.length;
  const perempuan = nonBiroPengurus.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;

  const percentage = total > 0 ? (perempuan / total) * 100 : 0;

  return { total, perempuan, percentage };
};
