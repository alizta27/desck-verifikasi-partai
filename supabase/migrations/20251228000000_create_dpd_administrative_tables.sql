/*
  # Create DPD Administrative Tables

  1. New Tables
    - `dpd_bank_account`: Bank account information and proof
    - `dpd_office_address`: Office/secretariat address and photos
    - `dpd_office_legality`: Office ownership/legality documents

  2. Security
    - Enable RLS on all tables
    - DPD can only access their own data
*/

-- Create dpd_bank_account table
CREATE TABLE IF NOT EXISTS public.dpd_bank_account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dpd_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nama_pemilik_rekening TEXT NOT NULL,
  nama_bank TEXT NOT NULL,
  nomor_rekening TEXT NOT NULL,
  file_bukti_rekening TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dpd_id)
);

ALTER TABLE public.dpd_bank_account ENABLE ROW LEVEL SECURITY;

-- Create dpd_office_address table
CREATE TABLE IF NOT EXISTS public.dpd_office_address (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dpd_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provinsi TEXT NOT NULL,
  kabupaten_kota TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  alamat_lengkap TEXT NOT NULL,
  file_foto_kantor_depan TEXT DEFAULT NULL,
  file_foto_papan_nama TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dpd_id)
);

ALTER TABLE public.dpd_office_address ENABLE ROW LEVEL SECURITY;

-- Create dpd_office_legality table
CREATE TABLE IF NOT EXISTS public.dpd_office_legality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dpd_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  jenis_dokumen TEXT NOT NULL CHECK (jenis_dokumen IN ('sewa', 'pernyataan', 'kepemilikan')),
  file_dokumen_legalitas TEXT DEFAULT NULL,
  keterangan TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dpd_id)
);

ALTER TABLE public.dpd_office_legality ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  -- dpd_bank_account policies
  DROP POLICY IF EXISTS "DPD can view their own bank account" ON public.dpd_bank_account;
  DROP POLICY IF EXISTS "Admin roles can view all bank accounts" ON public.dpd_bank_account;
  DROP POLICY IF EXISTS "DPD can insert their own bank account" ON public.dpd_bank_account;
  DROP POLICY IF EXISTS "DPD can update their own bank account" ON public.dpd_bank_account;
  DROP POLICY IF EXISTS "DPD can delete their own bank account" ON public.dpd_bank_account;

  -- dpd_office_address policies
  DROP POLICY IF EXISTS "DPD can view their own office address" ON public.dpd_office_address;
  DROP POLICY IF EXISTS "Admin roles can view all office addresses" ON public.dpd_office_address;
  DROP POLICY IF EXISTS "DPD can insert their own office address" ON public.dpd_office_address;
  DROP POLICY IF EXISTS "DPD can update their own office address" ON public.dpd_office_address;
  DROP POLICY IF EXISTS "DPD can delete their own office address" ON public.dpd_office_address;

  -- dpd_office_legality policies
  DROP POLICY IF EXISTS "DPD can view their own office legality" ON public.dpd_office_legality;
  DROP POLICY IF EXISTS "Admin roles can view all office legality" ON public.dpd_office_legality;
  DROP POLICY IF EXISTS "DPD can insert their own office legality" ON public.dpd_office_legality;
  DROP POLICY IF EXISTS "DPD can update their own office legality" ON public.dpd_office_legality;
  DROP POLICY IF EXISTS "DPD can delete their own office legality" ON public.dpd_office_legality;
END $$;

-- RLS Policies for dpd_bank_account
CREATE POLICY "DPD can view their own bank account"
  ON public.dpd_bank_account FOR SELECT
  TO authenticated
  USING (auth.uid() = dpd_id);

CREATE POLICY "Admin roles can view all bank accounts"
  ON public.dpd_bank_account FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk') OR
    public.has_role(auth.uid(), 'sekjend') OR
    public.has_role(auth.uid(), 'ketum')
  );

CREATE POLICY "DPD can insert their own bank account"
  ON public.dpd_bank_account FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can update their own bank account"
  ON public.dpd_bank_account FOR UPDATE
  TO authenticated
  USING (auth.uid() = dpd_id)
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can delete their own bank account"
  ON public.dpd_bank_account FOR DELETE
  TO authenticated
  USING (auth.uid() = dpd_id);

-- RLS Policies for dpd_office_address
CREATE POLICY "DPD can view their own office address"
  ON public.dpd_office_address FOR SELECT
  TO authenticated
  USING (auth.uid() = dpd_id);

CREATE POLICY "Admin roles can view all office addresses"
  ON public.dpd_office_address FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk') OR
    public.has_role(auth.uid(), 'sekjend') OR
    public.has_role(auth.uid(), 'ketum')
  );

CREATE POLICY "DPD can insert their own office address"
  ON public.dpd_office_address FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can update their own office address"
  ON public.dpd_office_address FOR UPDATE
  TO authenticated
  USING (auth.uid() = dpd_id)
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can delete their own office address"
  ON public.dpd_office_address FOR DELETE
  TO authenticated
  USING (auth.uid() = dpd_id);

-- RLS Policies for dpd_office_legality
CREATE POLICY "DPD can view their own office legality"
  ON public.dpd_office_legality FOR SELECT
  TO authenticated
  USING (auth.uid() = dpd_id);

CREATE POLICY "Admin roles can view all office legality"
  ON public.dpd_office_legality FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk') OR
    public.has_role(auth.uid(), 'sekjend') OR
    public.has_role(auth.uid(), 'ketum')
  );

CREATE POLICY "DPD can insert their own office legality"
  ON public.dpd_office_legality FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can update their own office legality"
  ON public.dpd_office_legality FOR UPDATE
  TO authenticated
  USING (auth.uid() = dpd_id)
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can delete their own office legality"
  ON public.dpd_office_legality FOR DELETE
  TO authenticated
  USING (auth.uid() = dpd_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_dpd_bank_account_updated_at ON public.dpd_bank_account;
DROP TRIGGER IF EXISTS update_dpd_office_address_updated_at ON public.dpd_office_address;
DROP TRIGGER IF EXISTS update_dpd_office_legality_updated_at ON public.dpd_office_legality;

-- Add triggers for updated_at
CREATE TRIGGER update_dpd_bank_account_updated_at
  BEFORE UPDATE ON public.dpd_bank_account
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dpd_office_address_updated_at
  BEFORE UPDATE ON public.dpd_office_address
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dpd_office_legality_updated_at
  BEFORE UPDATE ON public.dpd_office_legality
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dpd_bank_account_dpd_id ON public.dpd_bank_account(dpd_id);
CREATE INDEX IF NOT EXISTS idx_dpd_office_address_dpd_id ON public.dpd_office_address(dpd_id);
CREATE INDEX IF NOT EXISTS idx_dpd_office_legality_dpd_id ON public.dpd_office_legality(dpd_id);
