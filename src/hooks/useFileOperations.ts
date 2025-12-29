import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFileOperations = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("dpd-documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const deleteFile = async (
    filePath: string,
    tableName: string,
    fieldName: string,
    userId: string
  ) => {
    try {
      setUploading(true);

      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from("dpd-documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Update database
      const { error: dbError } = await (supabase as any)
        .from(tableName)
        .update({ [fieldName]: null })
        .eq("dpd_id", userId);

      if (dbError) throw dbError;

      toast.success("File berhasil dihapus");
      return true;
    } catch (error) {
      toast.error("Gagal menghapus file");
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    setUploading,
    uploadFile,
    deleteFile,
  };
};