import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [tipeOrganisasi, setTipeOrganisasi] = useState<"dpd" | "dpc" | "pac">(
    "dpd"
  );
  const [provinsi, setProvinsi] = useState("");
  const [kabupatenKota, setKabupatenKota] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === "SIGNED_IN" && session) {
          navigate("/dashboard");
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Login berhasil!");
      } else {
        // Validation based on organization type
        if (!provinsi) {
          toast.error("Provinsi harus diisi");
          return;
        }
        if (
          (tipeOrganisasi === "dpc" || tipeOrganisasi === "pac") &&
          !kabupatenKota
        ) {
          toast.error("Kabupaten/Kota harus diisi");
          return;
        }
        if (tipeOrganisasi === "pac" && !kecamatan) {
          toast.error("Kecamatan harus diisi");
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              tipe_organisasi: tipeOrganisasi,
              provinsi: provinsi,
              kabupaten_kota: kabupatenKota || null,
              kecamatan: kecamatan || null,
              role: "dpd",
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        toast.success("Registrasi berhasil! Anda akan diarahkan ke dashboard.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={hanuraLogo} alt="HANURA Logo" className="h-20 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              H-Gate050 Desk Verifikasi Partai Hanura
            </CardTitle>
            <CardDescription className="mt-2">
              Sistem Pengajuan SK dan Laporan MUSDA
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipeOrganisasi">Tipe Organisasi</Label>
                  <Select
                    value={tipeOrganisasi}
                    onValueChange={(value: "dpd" | "dpc" | "pac") => {
                      setTipeOrganisasi(value);
                      // Reset dependent fields when type changes
                      if (value === "dpd") {
                        setKabupatenKota("");
                        setKecamatan("");
                      } else if (value === "dpc") {
                        setKecamatan("");
                      }
                    }}
                  >
                    <SelectTrigger id="tipeOrganisasi">
                      <SelectValue placeholder="Pilih tipe organisasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dpd">
                        DPD (Dewan Pimpinan Daerah)
                      </SelectItem>
                      <SelectItem value="dpc">
                        DPC (Dewan Pimpinan Cabang)
                      </SelectItem>
                      <SelectItem value="pac">
                        PAC (Pimpinan Anak Cabang)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provinsi">
                    Provinsi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="provinsi"
                    placeholder="Contoh: Sulawesi Tenggara"
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                {(tipeOrganisasi === "dpc" || tipeOrganisasi === "pac") && (
                  <div className="space-y-2">
                    <Label htmlFor="kabupatenKota">
                      Kabupaten/Kota <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="kabupatenKota"
                      placeholder="Contoh: Kota Kendari"
                      value={kabupatenKota}
                      onChange={(e) => setKabupatenKota(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                )}

                {tipeOrganisasi === "pac" && (
                  <div className="space-y-2">
                    <Label htmlFor="kecamatan">
                      Kecamatan <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="kecamatan"
                      placeholder="Contoh: Poasia"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Masuk" : "Daftar"}
            </Button>
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Belum punya akun? Daftar di sini"
                  : "Sudah punya akun? Masuk di sini"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
