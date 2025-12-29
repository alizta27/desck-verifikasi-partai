import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
import type { StepStatus } from "@/types/pengajuan";

interface TimelineStepProps {
  icon: React.ElementType;
  label: string;
  date: string | null;
  status: StepStatus;
  emptyDateText?: string;
}

export const TimelineStep = ({
  icon: Icon,
  label,
  date,
  status,
  emptyDateText = "Menunggu",
}: TimelineStepProps) => {
  const getStepClassName = () => {
    if (status === "completed") return "bg-primary text-white";
    if (status === "current") return "bg-primary/20 text-primary";
    if (status === "rejected") return "bg-destructive text-white";
    return "bg-muted text-muted-foreground";
  };

  const getSuccessClassName = () => {
    if (status === "completed" && label === "SK Terbit") {
      return "bg-success text-white";
    }
    return getStepClassName();
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          label === "SK Terbit" ? getSuccessClassName() : getStepClassName()
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {date ? format(new Date(date), "PPP", { locale: id }) : emptyDateText}
        </p>
      </div>
      {status === "completed" && (
        <CheckCircle2 className="h-5 w-5 text-success" />
      )}
      {status === "rejected" && <XCircle className="h-5 w-5 text-destructive" />}
    </div>
  );
};