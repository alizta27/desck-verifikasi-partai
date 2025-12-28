import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface PublishSKCardProps {
  onPublish: () => void;
  actionLoading: boolean;
}

export const PublishSKCard = ({
  onPublish,
  actionLoading,
}: PublishSKCardProps) => {
  return (
    <Card className="shadow-large border-success">
      <CardHeader>
        <CardTitle>Terbitkan SK</CardTitle>
        <CardDescription>
          Pengajuan sudah disetujui. Terbitkan SK sekarang.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onPublish}
          disabled={actionLoading}
          className="w-full bg-success hover:bg-success/90"
        >
          <FileText className="mr-2 h-4 w-4" />
          {actionLoading ? "Memproses..." : "Terbitkan SK"}
        </Button>
      </CardContent>
    </Card>
  );
};