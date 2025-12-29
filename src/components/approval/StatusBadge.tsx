import { Badge } from "@/components/ui/badge";
import { APPROVAL_STATUS_CONFIG, OVERALL_STATUS_CONFIG } from "@/lib/approval-constants";
import type { ApprovalStatus, OverallStatus } from "@/types/administrasi-approval";

interface StatusBadgeProps {
  status: ApprovalStatus | OverallStatus;
  type?: "approval" | "overall";
}

export const StatusBadge = ({ status, type = "approval" }: StatusBadgeProps) => {
  const config = type === "approval"
    ? APPROVAL_STATUS_CONFIG[status as ApprovalStatus]
    : OVERALL_STATUS_CONFIG[status as OverallStatus];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${config.bgColor} border-0 gap-1.5`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};
