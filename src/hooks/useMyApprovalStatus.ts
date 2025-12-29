import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ApprovalStatus } from "@/types/administrasi-approval";

interface ApprovalStatusData {
  bank_status: ApprovalStatus | null;
  bank_notes: string | null;
  office_status: ApprovalStatus | null;
  office_notes: string | null;
  legality_status: ApprovalStatus | null;
  legality_notes: string | null;
}

export const useMyApprovalStatus = () => {
  const [status, setStatus] = useState<ApprovalStatusData>({
    bank_status: null,
    bank_notes: null,
    office_status: null,
    office_notes: null,
    legality_status: null,
    legality_notes: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch approval status for each document type
      const [bankData, officeData, legalityData] = await Promise.all([
        supabase
          .from("dpd_bank_account")
          .select("okk_status, okk_notes")
          .eq("dpd_id", user.id)
          .maybeSingle(),
        supabase
          .from("dpd_office_address")
          .select("okk_status, okk_notes")
          .eq("dpd_id", user.id)
          .maybeSingle(),
        supabase
          .from("dpd_office_legality")
          .select("okk_status, okk_notes")
          .eq("dpd_id", user.id)
          .maybeSingle(),
      ]);

      setStatus({
        bank_status: bankData.data?.okk_status as ApprovalStatus || null,
        bank_notes: bankData.data?.okk_notes || null,
        office_status: officeData.data?.okk_status as ApprovalStatus || null,
        office_notes: officeData.data?.okk_notes || null,
        legality_status: legalityData.data?.okk_status as ApprovalStatus || null,
        legality_notes: legalityData.data?.okk_notes || null,
      });
    } catch (error) {
      console.error("Error loading approval status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refresh: loadStatus };
};