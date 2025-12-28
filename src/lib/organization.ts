import { supabase } from "@/integrations/supabase/client";

export interface OrganizationInfo {
  tipe: "DPD" | "DPC" | "PAC";
  nama: string;
  fullName: string;
}

export const getOrganizationInfo = async (): Promise<OrganizationInfo> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { tipe: "DPD", nama: "DPD", fullName: "DPD" };
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("tipe_organisasi, provinsi, kabupaten_kota, kecamatan")
      .eq("id", user.id)
      .single();

    if (!profileData) {
      return { tipe: "DPD", nama: "DPD", fullName: "DPD" };
    }

    const tipeOrganisasi = (profileData as any).tipe_organisasi;
    const provinsi = (profileData as any).provinsi;
    const kabupatenKota = (profileData as any).kabupaten_kota;
    const kecamatan = (profileData as any).kecamatan;

    let orgName = "";
    let orgType: "DPD" | "DPC" | "PAC" = "DPD";
    let fullName = "";

    switch (tipeOrganisasi) {
      case "dpd":
        orgName = "DPD";
        orgType = "DPD";
        fullName = `DPD ${provinsi || ""}`;
        break;
      case "dpc":
        orgName = "DPC";
        orgType = "DPC";
        fullName = `DPC ${kabupatenKota || ""}`;
        break;
      case "pac":
        orgName = "PAC";
        orgType = "PAC";
        fullName = `PAC Kec. ${kecamatan || ""}`;
        break;
      default:
        orgName = "DPD";
        orgType = "DPD";
        fullName = "DPD";
    }

    return { tipe: orgType, nama: orgName, fullName };
  } catch (error) {
    console.error("Error fetching organization info:", error);
    return { tipe: "DPD", nama: "DPD", fullName: "DPD" };
  }
};
