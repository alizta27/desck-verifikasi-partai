/*
  # Add Organization Type and Region Fields

  1. Changes
    - Add `tipe_organisasi` enum (dpd, dpc, pac)
    - Update `profiles` table with:
      - tipe_organisasi field
      - kabupaten_kota field (for DPC and PAC)
      - kecamatan field (for PAC only)
    - Update existing rows (if any) to set default tipe_organisasi

  2. Notes
    - provinsi field already exists in profiles table
    - kabupaten_kota and kecamatan are nullable since DPD only needs provinsi
*/

-- Create enum for organization type
DO $$ BEGIN
  CREATE TYPE tipe_organisasi AS ENUM ('dpd', 'dpc', 'pac');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipe_organisasi tipe_organisasi DEFAULT 'dpd',
  ADD COLUMN IF NOT EXISTS kabupaten_kota TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kecamatan TEXT DEFAULT NULL;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tipe_organisasi, provinsi, kabupaten_kota, kecamatan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd'),
    COALESCE((NEW.raw_user_meta_data->>'tipe_organisasi')::tipe_organisasi, 'dpd'),
    NEW.raw_user_meta_data->>'provinsi',
    NEW.raw_user_meta_data->>'kabupaten_kota',
    NEW.raw_user_meta_data->>'kecamatan'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    tipe_organisasi = EXCLUDED.tipe_organisasi,
    provinsi = EXCLUDED.provinsi,
    kabupaten_kota = EXCLUDED.kabupaten_kota,
    kecamatan = EXCLUDED.kecamatan;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create helper function to get organization display name
CREATE OR REPLACE FUNCTION public.get_organization_name(
  p_tipe tipe_organisasi,
  p_provinsi TEXT,
  p_kabupaten_kota TEXT DEFAULT NULL,
  p_kecamatan TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE p_tipe
    WHEN 'dpd' THEN
      RETURN 'DPD ' || COALESCE(p_provinsi, '');
    WHEN 'dpc' THEN
      RETURN 'DPC ' || COALESCE(p_kabupaten_kota, '');
    WHEN 'pac' THEN
      RETURN 'PAC Kec. ' || COALESCE(p_kecamatan, '');
    ELSE
      RETURN 'Unknown';
  END CASE;
END;
$$;
