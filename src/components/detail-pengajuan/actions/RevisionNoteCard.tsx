import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevisionNoteCardProps {
  catatan: string;
}

export const RevisionNoteCard = ({ catatan }: RevisionNoteCardProps) => {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Catatan Revisi</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{catatan}</p>
      </CardContent>
    </Card>
  );
};