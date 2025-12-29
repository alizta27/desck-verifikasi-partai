import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import type { ApprovalStatus, OverallStatus } from "@/types/administrasi-approval";

export const APPROVAL_STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
};

export const OVERALL_STATUS_CONFIG: Record<
  OverallStatus,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  all_approved: {
    label: "All Approved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
  },
  has_rejection: {
    label: "Has Rejection",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: XCircle,
  },
  pending: {
    label: "Pending Review",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: Clock,
  },
  incomplete: {
    label: "Incomplete",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: AlertCircle,
  },
};