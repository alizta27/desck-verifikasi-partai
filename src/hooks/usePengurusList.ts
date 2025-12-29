import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Pengurus } from "@/lib/struktur-constants";
import { validatePengurusForm } from "@/lib/pengurus-validation";

const emptyPengurus: Pengurus = {
  jenis_struktur: "",
  bidang_struktur: "",
  jabatan: "",
  nama_lengkap: "",
  jenis_kelamin: "",
  file_ktp: "",
  urutan: 0,
};

export const usePengurusList = (initialList: Pengurus[] = []) => {
  const [pengurusList, setPengurusList] = useState<Pengurus[]>(initialList);
  const [currentPengurus, setCurrentPengurus] =
    useState<Pengurus>(emptyPengurus);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Sync with initial list when it changes
  useEffect(() => {
    if (initialList.length > 0) {
      setPengurusList(initialList);
    }
  }, [initialList]);

  const updateList = (newList: Pengurus[]) => {
    setPengurusList(newList);
  };

  const addPengurus = () => {
    const validationError = validatePengurusForm(currentPengurus);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (editingIndex !== null) {
      const updated = [...pengurusList];
      updated[editingIndex] = { ...currentPengurus, urutan: editingIndex };
      updateList(updated);
      setEditingIndex(null);
      toast.success("Data pengurus berhasil diupdate");
    } else {
      updateList([
        ...pengurusList,
        { ...currentPengurus, urutan: pengurusList.length },
      ]);
      toast.success("Pengurus berhasil ditambahkan ke daftar");
    }

    setCurrentPengurus(emptyPengurus);
  };

  const editPengurus = (index: number) => {
    setCurrentPengurus(pengurusList[index]);
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletePengurus = (index: number) => {
    updateList(pengurusList.filter((_, i) => i !== index));
    toast.success("Pengurus berhasil dihapus");
  };

  return {
    pengurusList,
    setPengurusList: updateList,
    currentPengurus,
    setCurrentPengurus,
    editingIndex,
    addPengurus,
    editPengurus,
    deletePengurus,
  };
};