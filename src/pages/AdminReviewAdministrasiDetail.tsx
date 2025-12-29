import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankAccountReview } from "@/components/approval/BankAccountReview";
import { OfficeAddressReview } from "@/components/approval/OfficeAddressReview";
import { OfficeLegalityReview } from "@/components/approval/OfficeLegalityReview";
import { useAdministrasiDetail } from "@/hooks/useAdministrasiDetail";
import { ArrowLeft, RefreshCw, MapPin, Mail } from "lucide-react";

export default function AdminReviewAdministrasiDetail() {
  const { dpdId } = useParams<{ dpdId: string }>();
  const navigate = useNavigate();

  const {
    loading,
    profile,
    bankAccount,
    officeAddress,
    officeLegality,
    approveBank,
    approveOffice,
    approveLegality,
    refresh,
  } = useAdministrasiDetail(dpdId!);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Data DPD tidak ditemukan
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/review-administrasi")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Review Data Administrasi</h1>
            <p className="text-muted-foreground">
              Verifikasi dokumen dan data administrasi
            </p>
          </div>
        </div>
        <Button onClick={refresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi DPD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nama DPD
              </p>
              <p className="text-base font-medium">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </p>
              <p className="text-base font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Provinsi
              </p>
              <p className="text-base font-medium">{profile.provinsi}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Kabupaten/Kota
              </p>
              <p className="text-base font-medium">{profile.kabupaten_kota}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <BankAccountReview data={bankAccount} onApprove={approveBank} />
        <OfficeAddressReview data={officeAddress} onApprove={approveOffice} />
        <OfficeLegalityReview data={officeLegality} onApprove={approveLegality} />
      </div>
    </div>
  );
}