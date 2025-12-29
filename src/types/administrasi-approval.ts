export type ApprovalStatus = "pending" | "approved" | "rejected";

export type OverallStatus = "all_approved" | "has_rejection" | "pending" | "incomplete";

export interface BankAccountApproval {
  okk_verified: boolean | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
  okk_notes: string | null;
  okk_status: ApprovalStatus;
}

export interface OfficeAddressApproval {
  okk_verified: boolean | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
  okk_notes: string | null;
  okk_status: ApprovalStatus;
}

export interface OfficeLegalityApproval {
  okk_verified: boolean | null;
  okk_verified_at: string | null;
  okk_verified_by: string | null;
  okk_notes: string | null;
  okk_status: ApprovalStatus;
}

export interface DPDAdministrasiStatus {
  dpd_id: string;
  email: string;
  nama_dpd: string;
  provinsi: string;
  kabupaten_kota: string;

  // Bank Account
  bank_status: ApprovalStatus;
  bank_verified_at: string | null;
  bank_notes: string | null;
  bank_verified_by: string | null;

  // Office Address
  office_status: ApprovalStatus;
  office_verified_at: string | null;
  office_notes: string | null;
  office_verified_by: string | null;

  // Office Legality
  legality_status: ApprovalStatus;
  legality_verified_at: string | null;
  legality_notes: string | null;
  legality_verified_by: string | null;

  // Overall
  overall_status: OverallStatus;
  last_updated: string;
  is_submitted: boolean;

  // Timestamps
  bank_updated_at: string | null;
  office_updated_at: string | null;
  legality_updated_at: string | null;
}

export interface ApprovalAction {
  status: "approved" | "rejected";
  notes?: string;
}