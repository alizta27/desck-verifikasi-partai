import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/approval/StatusBadge";
import { useAdministrasiList } from "@/hooks/useAdministrasiList";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, Eye, RefreshCw } from "lucide-react";

export default function AdminReviewAdministrasi() {
  const navigate = useNavigate();
  const {
    data,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh,
  } = useAdministrasiList();

  const handleViewDetail = (dpdId: string) => {
    navigate(`/admin/review-administrasi/${dpdId}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Administrasi DPD</h1>
          <p className="text-muted-foreground">
            Verifikasi data administrasi yang disubmit oleh DPD
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama DPD, provinsi, atau kabupaten/kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="all_approved">All Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="has_rejection">Has Rejection</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada data ditemukan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama DPD</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Kabupaten/Kota</TableHead>
                  <TableHead className="text-center">Rekening</TableHead>
                  <TableHead className="text-center">Alamat</TableHead>
                  <TableHead className="text-center">Legalitas</TableHead>
                  <TableHead className="text-center">Overall</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.dpd_id}>
                    <TableCell className="font-medium">
                      {item.nama_dpd}
                    </TableCell>
                    <TableCell>{item.provinsi}</TableCell>
                    <TableCell>{item.kabupaten_kota}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.bank_status} type="approval" />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.office_status} type="approval" />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={item.legality_status}
                        type="approval"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.overall_status} type="overall" />
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.last_updated), "PPp", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(item.dpd_id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}