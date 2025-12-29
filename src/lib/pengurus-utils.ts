import { supabase } from "@/integrations/supabase/client";
import type { Pengurus } from "@/lib/struktur-constants";

export const uploadKTPFile = async (
  file: File,
  userId: string,
  jabatan: string
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${jabatan.replace(/\s+/g, "-")}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("ktp-pengurus")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  return fileName;
};

export const savePengurusList = async (
  pengurusList: Pengurus[],
  pengajuanId: string,
  userId: string
): Promise<void> => {
  // Delete existing pengurus
  const { data: existingPengurus } = await supabase
    .from("pengurus")
    .select("id")
    .eq("pengajuan_id", pengajuanId);

  if (existingPengurus && existingPengurus.length > 0) {
    const { error: deleteError } = await supabase
      .from("pengurus")
      .delete()
      .eq("pengajuan_id", pengajuanId);

    if (deleteError) throw deleteError;
  }

  // Insert new pengurus
  for (const pengurus of pengurusList) {
    let ktpUrl = pengurus.file_ktp;

    // Upload new file if it's a File object
    if (pengurus.file_ktp instanceof File) {
      ktpUrl = await uploadKTPFile(pengurus.file_ktp, userId, pengurus.jabatan);
    }

    const { error } = await supabase.from("pengurus").insert({
      pengajuan_id: pengajuanId,
      jenis_struktur: pengurus.jenis_struktur,
      bidang_struktur: pengurus.bidang_struktur || "",
      jabatan: pengurus.jabatan,
      nama_lengkap: pengurus.nama_lengkap,
      jenis_kelamin: pengurus.jenis_kelamin,
      file_ktp: ktpUrl as string,
      urutan: pengurus.urutan,
    });

    if (error) throw error;
  }

  // Update pengajuan status
  const { error: updateError } = await supabase
    .from("pengajuan_sk")
    .update({ status: "diupload", dpd_id: userId })
    .eq("id", pengajuanId);

  if (updateError) throw updateError;
};