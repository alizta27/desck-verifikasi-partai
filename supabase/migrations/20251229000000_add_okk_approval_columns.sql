/*
  # Add OKK Approval System to Administrative Tables

  1. Changes to existing tables
    - Add approval columns to `dpd_bank_account`
    - Add approval columns to `dpd_office_address`
    - Add approval columns to `dpd_office_legality`

  2. New Objects
    - Create view `v_dpd_administrasi_status` for aggregate status
    - Add indexes for approval status columns

  3. Security
    - Add UPDATE policies for OKK to approve/reject
    - Existing SELECT policies already allow OKK to view all data
*/

-- ============================================================================
-- 1. ADD APPROVAL COLUMNS TO TABLES
-- ============================================================================

-- Add approval columns to dpd_bank_account
ALTER TABLE public.dpd_bank_account
ADD COLUMN IF NOT EXISTS okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Add approval columns to dpd_office_address
ALTER TABLE public.dpd_office_address
ADD COLUMN IF NOT EXISTS okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Add approval columns to dpd_office_legality
ALTER TABLE public.dpd_office_legality
ADD COLUMN IF NOT EXISTS okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_verified_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dpd_bank_account_okk_status
  ON public.dpd_bank_account(okk_status);

CREATE INDEX IF NOT EXISTS idx_dpd_office_address_okk_status
  ON public.dpd_office_address(okk_status);

CREATE INDEX IF NOT EXISTS idx_dpd_office_legality_okk_status
  ON public.dpd_office_legality(okk_status);

-- ============================================================================
-- 3. CREATE AGGREGATE VIEW FOR OKK DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW public.v_dpd_administrasi_status AS
SELECT
  p.id as dpd_id,
  au.email,
  p.full_name as nama_dpd,
  p.provinsi,
  COALESCE(oa.kabupaten_kota, '') as kabupaten_kota,

  -- Bank Account Status
  ba.okk_status as bank_status,
  ba.okk_verified_at as bank_verified_at,
  ba.okk_notes as bank_notes,
  ba.okk_verified_by as bank_verified_by,

  -- Office Address Status
  oa.okk_status as office_status,
  oa.okk_verified_at as office_verified_at,
  oa.okk_notes as office_notes,
  oa.okk_verified_by as office_verified_by,

  -- Office Legality Status
  ol.okk_status as legality_status,
  ol.okk_verified_at as legality_verified_at,
  ol.okk_notes as legality_notes,
  ol.okk_verified_by as legality_verified_by,

  -- Overall Status
  CASE
    WHEN ba.okk_status = 'approved' AND oa.okk_status = 'approved' AND ol.okk_status = 'approved'
      THEN 'all_approved'
    WHEN ba.okk_status = 'rejected' OR oa.okk_status = 'rejected' OR ol.okk_status = 'rejected'
      THEN 'has_rejection'
    WHEN ba.id IS NULL OR oa.id IS NULL OR ol.id IS NULL
      THEN 'incomplete'
    ELSE 'pending'
  END as overall_status,

  -- Timestamps
  ba.updated_at as bank_updated_at,
  oa.updated_at as office_updated_at,
  ol.updated_at as legality_updated_at,

  GREATEST(
    COALESCE(ba.updated_at, '1970-01-01'::timestamp),
    COALESCE(oa.updated_at, '1970-01-01'::timestamp),
    COALESCE(ol.updated_at, '1970-01-01'::timestamp)
  ) as last_updated,

  -- Submitted status
  CASE
    WHEN ba.id IS NOT NULL AND oa.id IS NOT NULL AND ol.id IS NOT NULL
      THEN true
    ELSE false
  END as is_submitted

FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN public.dpd_bank_account ba ON ba.dpd_id = p.id
LEFT JOIN public.dpd_office_address oa ON oa.dpd_id = p.id
LEFT JOIN public.dpd_office_legality ol ON ol.dpd_id = p.id

-- Only show DPD who have submitted at least one administrative document
WHERE (ba.id IS NOT NULL OR oa.id IS NOT NULL OR ol.id IS NOT NULL)
  AND p.role = 'dpd'

ORDER BY last_updated DESC;

-- ============================================================================
-- 4. ADD RLS POLICIES FOR OKK APPROVAL
-- ============================================================================

-- Drop existing UPDATE policies if they exist (to recreate them)
DO $$ BEGIN
  DROP POLICY IF EXISTS "OKK can update bank account approval status" ON public.dpd_bank_account;
  DROP POLICY IF EXISTS "OKK can update office address approval status" ON public.dpd_office_address;
  DROP POLICY IF EXISTS "OKK can update office legality approval status" ON public.dpd_office_legality;
END $$;

-- Policy for OKK to update approval status on dpd_bank_account
CREATE POLICY "OKK can update bank account approval status"
  ON public.dpd_bank_account FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'okk')
  );

-- Policy for OKK to update approval status on dpd_office_address
CREATE POLICY "OKK can update office address approval status"
  ON public.dpd_office_address FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'okk')
  );

-- Policy for OKK to update approval status on dpd_office_legality
CREATE POLICY "OKK can update office legality approval status"
  ON public.dpd_office_legality FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'okk')
  );

-- ============================================================================
-- 5. GRANT SELECT ON VIEW TO AUTHENTICATED USERS
-- ============================================================================

GRANT SELECT ON public.v_dpd_administrasi_status TO authenticated;

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.dpd_bank_account.okk_verified IS 'Whether the bank account has been verified by OKK (true/false/null)';
COMMENT ON COLUMN public.dpd_bank_account.okk_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN public.dpd_bank_account.okk_notes IS 'Notes from OKK (especially for rejections)';
COMMENT ON COLUMN public.dpd_bank_account.okk_verified_at IS 'Timestamp when OKK approved/rejected';
COMMENT ON COLUMN public.dpd_bank_account.okk_verified_by IS 'User ID of OKK who approved/rejected';

COMMENT ON COLUMN public.dpd_office_address.okk_verified IS 'Whether the office address has been verified by OKK (true/false/null)';
COMMENT ON COLUMN public.dpd_office_address.okk_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN public.dpd_office_address.okk_notes IS 'Notes from OKK (especially for rejections)';
COMMENT ON COLUMN public.dpd_office_address.okk_verified_at IS 'Timestamp when OKK approved/rejected';
COMMENT ON COLUMN public.dpd_office_address.okk_verified_by IS 'User ID of OKK who approved/rejected';

COMMENT ON COLUMN public.dpd_office_legality.okk_verified IS 'Whether the office legality has been verified by OKK (true/false/null)';
COMMENT ON COLUMN public.dpd_office_legality.okk_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN public.dpd_office_legality.okk_notes IS 'Notes from OKK (especially for rejections)';
COMMENT ON COLUMN public.dpd_office_legality.okk_verified_at IS 'Timestamp when OKK approved/rejected';
COMMENT ON COLUMN public.dpd_office_legality.okk_verified_by IS 'User ID of OKK who approved/rejected';

COMMENT ON VIEW public.v_dpd_administrasi_status IS 'Aggregate view of DPD administrative data approval status for OKK dashboard';
