# H-Gate050 Desk Verifikasi Partai Hanura - Technical Documentation

**Version:** 1.0
**Last Updated:** December 2025
**Tech Stack:** React + TypeScript + Supabase + Vite

---

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Database Schema](#database-schema)
5. [Application Features](#application-features)
6. [User Flow Diagrams](#user-flow-diagrams)
7. [Code Structure](#code-structure)
8. [Key Components](#key-components)
9. [State Management](#state-management)
10. [Authentication Flow](#authentication-flow)
11. [File Upload Flow](#file-upload-flow)
12. [Approval Workflow](#approval-workflow)

---

## 🎯 Application Overview

### Purpose

Sistem pengajuan Surat Keputusan (SK) kepengurusan dan laporan MUSDA (Musyawarah Daerah) untuk organisasi multi-tingkat Partai HANURA.

### Organization Levels

1. **DPD** (Dewan Pimpinan Daerah) - Tingkat Provinsi
2. **DPC** (Dewan Pimpinan Cabang) - Tingkat Kabupaten/Kota
3. **PAC** (Pimpinan Anak Cabang) - Tingkat Kecamatan

### Core Functionality

- Upload laporan MUSDA
- Input data pengurus dengan validasi gender 30%
- Upload dokumen administrasi organisasi
- Multi-level approval system (OKK → Sekjend → Ketum)
- Real-time tracking status pengajuan
- Penerbitan SK final

---

## 🏗 Architecture & Tech Stack

### Frontend

```
React 18 + TypeScript
├── Vite (Build Tool)
├── React Router (Routing)
├── TailwindCSS (Styling)
├── shadcn/ui (UI Components)
├── date-fns (Date Formatting)
├── Lucide React (Icons)
└── Sonner (Toast Notifications)
```

### Backend

```
Supabase
├── PostgreSQL (Database)
├── Row Level Security (RLS)
├── Storage Buckets
├── Real-time Subscriptions
└── Authentication
```

### Key Libraries

- **@supabase/supabase-js** - Supabase client
- **react-router-dom** - Client-side routing
- **clsx** + **tailwind-merge** - Conditional styling

---

## 👥 User Roles & Permissions

### 1. Organization Users (DPD/DPC/PAC)

**Role:** `dpd`, `dpc`, `pac` (stored in `profiles.role` when not admin)

**Permissions:**

- ✅ Create/Edit own pengajuan SK
- ✅ Upload laporan MUSDA (PDF, max 10MB)
- ✅ Input data pengurus (with 30% female requirement)
- ✅ Upload administrative documents (rekening, alamat, legalitas)
- ✅ View own submission progress
- ✅ Revise rejected submissions
- ❌ Cannot view other organizations' data
- ❌ Cannot approve submissions

**Access:**

- Login: `/auth`
- Dashboard: `/dashboard`
- Upload MUSDA: `/upload-laporan`
- Input Pengurus: `/input-pengurus`
- Data Administrasi: `/data-administrasi`
- Track Progress: `/progress-sk`

### 2. OKK (Organisasi, Kaderisasi, dan Keanggotaan)

**Role:** `okk`

**Permissions:**

- ✅ View all submissions from all organizations
- ✅ Verify documents (first level approval)
- ✅ Approve/Reject submissions
- ✅ Add revision notes
- ❌ Cannot publish SK (only Ketum)

**Workflow:**

- Receives submissions with status: `diupload`
- Can approve to: `diverifikasi_okk`
- Can reject to: `ditolak_okk`

### 3. Sekjend (Sekretaris Jenderal)

**Role:** `sekjend`

**Permissions:**

- ✅ View all submissions
- ✅ Second level approval
- ✅ Approve/Reject OKK-verified submissions
- ❌ Cannot publish SK

**Workflow:**

- Receives submissions with status: `diverifikasi_okk`
- Can approve to: `disetujui_sekjend`
- Can reject to: `ditolak_sekjend`

### 4. Ketum (Ketua Umum)

**Role:** `ketum`

**Permissions:**

- ✅ View all submissions
- ✅ Final approval
- ✅ Publish SK (final step)

**Workflow:**

- Receives submissions with status: `disetujui_sekjend`
- Can approve to: `disetujui_ketum`
- Can reject to: `ditolak_ketum`
- Can publish SK: `disetujui_ketum` → `sk_terbit`

---

## 🗄 Database Schema

### Core Tables

#### 1. `profiles`

```sql
profiles (
  id UUID PRIMARY KEY,              -- user ID from auth.users
  full_name TEXT,
  role TEXT,                        -- 'okk' | 'sekjend' | 'ketum' | null (for DPD/DPC/PAC)
  tipe_organisasi TEXT,             -- 'dpd' | 'dpc' | 'pac'
  provinsi TEXT,
  kabupaten_kota TEXT,              -- for DPC and PAC
  kecamatan TEXT,                   -- for PAC only
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### 2. `pengajuan_sk`

```sql
pengajuan_sk (
  id UUID PRIMARY KEY,
  dpd_id UUID REFERENCES profiles(id),  -- submitter
  status pengajuan_status,               -- enum type
  tanggal_musda DATE,
  lokasi_musda TEXT,
  file_laporan_musda TEXT,               -- storage path
  catatan_revisi TEXT,

  -- Approval tracking
  verified_by_okk UUID,
  verified_okk_at TIMESTAMPTZ,
  approved_by_sekjend UUID,
  approved_sekjend_at TIMESTAMPTZ,
  approved_by_ketum UUID,
  approved_ketum_at TIMESTAMPTZ,
  sk_terbit_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Status Enum:**

```typescript
type pengajuan_status =
  | "draft"
  | "diupload"
  | "diverifikasi_okk"
  | "ditolak_okk"
  | "disetujui_sekjend"
  | "ditolak_sekjend"
  | "disetujui_ketum"
  | "ditolak_ketum"
  | "sk_terbit";
```

#### 3. `pengurus`

```sql
pengurus (
  id UUID PRIMARY KEY,
  pengajuan_id UUID REFERENCES pengajuan_sk(id) ON DELETE CASCADE,
  jenis_struktur TEXT,              -- 'Pimpinan' | 'Badan Pengurus Harian' | etc.
  bidang_struktur TEXT,             -- optional, e.g., 'Ekonomi Kerakyatan'
  jabatan TEXT,
  nama_lengkap TEXT,
  jenis_kelamin TEXT,               -- 'Laki-laki' | 'Perempuan'
  file_ktp TEXT,                    -- storage path
  urutan INTEGER,                   -- display order
  created_at TIMESTAMPTZ
)
```

**Gender Validation:**

- Minimum 30% perempuan required before upload

#### 4. `dpd_bank_account`

```sql
dpd_bank_account (
  id UUID PRIMARY KEY,
  dpd_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nama_pemilik_rekening TEXT,
  nama_bank TEXT,
  nomor_rekening TEXT,
  file_bukti_rekening TEXT,         -- storage path
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(dpd_id)
)
```

#### 5. `dpd_office_address`

```sql
dpd_office_address (
  id UUID PRIMARY KEY,
  dpd_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provinsi TEXT,
  kabupaten_kota TEXT,
  kecamatan TEXT,
  alamat_lengkap TEXT,
  file_foto_kantor_depan TEXT,      -- storage path
  file_foto_papan_nama TEXT,        -- storage path
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(dpd_id)
)
```

#### 6. `dpd_office_legality`

```sql
dpd_office_legality (
  id UUID PRIMARY KEY,
  dpd_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  jenis_dokumen TEXT,               -- 'sewa' | 'pernyataan' | 'kepemilikan'
  file_dokumen_legalitas TEXT,      -- storage path
  keterangan TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(dpd_id)
)
```

### Storage Buckets

1. **laporan-musda**

   - Max size: 10MB
   - Allowed types: PDF only
   - Path: `{user_id}/{timestamp}-{filename}.pdf`

2. **ktp-pengurus**

   - Max size: 5MB
   - Allowed types: JPG, PNG, PDF
   - Path: `{user_id}/{pengajuan_id}/{timestamp}-{filename}`

3. **dpd-documents**
   - Max size: 5MB
   - Allowed types: JPG, PNG, PDF
   - For: Bank account proof, office photos, legality docs
   - Path: `{user_id}/{type}/{timestamp}-{filename}`

### RLS Policies

**Principle:** Users can only access their own data, admins can see all

```sql
-- Organization users can only see their own submissions
CREATE POLICY "Users can view own pengajuan"
  ON pengajuan_sk FOR SELECT
  USING (auth.uid() = dpd_id);

-- Admins can see all submissions
CREATE POLICY "Admins can view all pengajuan"
  ON pengajuan_sk FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('okk', 'sekjend', 'ketum')
    )
  );
```

---

## 🎨 Application Features

### For Organization Users (DPD/DPC/PAC)

#### Feature 1: Upload Laporan MUSDA

**Page:** `/upload-laporan` (`UploadLaporanMusda.tsx`)

**Flow:**

1. User fills form:
   - Tanggal MUSDA (date picker)
   - Lokasi MUSDA (text)
   - Upload PDF (max 10MB)
2. Validation:
   - All fields required
   - PDF format only
   - File size check
3. On submit:
   - Upload PDF to `laporan-musda` bucket
   - Create/update `pengajuan_sk` record with status `draft`
   - Navigate to next step

**Key Components:**

- `DatePicker` - Select MUSDA date
- `Input` - Location text input
- `FileUpload` - PDF upload with preview
- `Progress` - Shows overall progress (Step 1/3)

#### Feature 2: Input Data Pengurus

**Page:** `/input-pengurus` (`InputDataPengurus.tsx`)

**Flow:**

1. User adds pengurus one by one:
   - Select Jenis Struktur (dropdown from constants)
   - Select/input Bidang Struktur (optional)
   - Select/input Jabatan (from constants or custom)
   - Input Nama Lengkap
   - Select Jenis Kelamin
   - Upload KTP (JPG/PNG/PDF)
2. Gender validation:
   - Shows real-time percentage
   - Must be ≥30% perempuan to proceed
3. Can edit/delete entries
4. On submit:
   - Upload all KTP files
   - Bulk insert to `pengurus` table
   - Update `pengajuan_sk` status to `diupload`
   - Navigate to next step

**Key Components:**

- `FormPengurus` - Input form for single pengurus
- `ListPengurus` - Table showing all added pengurus
- `ProgressGender` - Visual gender ratio indicator
- `CustomJabatanDialog` - Dialog to add custom jabatan

**Validations:**

- At least 1 pengurus required
- 30% minimum female representation
- All fields required per pengurus
- KTP file required

#### Feature 3: Data Administrasi

**Page:** `/data-administrasi` (`DataAdministrasiDPD.tsx`)

**Flow:**
Multi-step form (stepper):

**Step 1: Bank Account**

- Nama Pemilik Rekening
- Nama Bank
- Nomor Rekening
- Upload Bukti Rekening (image/PDF)

**Step 2: Office Address**

- Provinsi, Kabupaten/Kota, Kecamatan
- Alamat Lengkap
- Upload Foto Kantor Depan
- Upload Foto Papan Nama

**Step 3: Office Legality**

- Jenis Dokumen (Sewa/Pernyataan/Kepemilikan)
- Upload Dokumen Legalitas
- Keterangan (optional)

**Special Notes:**

- Independent from MUSDA flow (can be done anytime)
- Data stored in separate tables
- Not required to complete MUSDA submission
- Can be updated anytime

**Key Components:**

- `BankAccountUpload` - Step 1 form
- `OfficeAddressProof` - Step 2 form
- `OfficeLegality` - Step 3 form
- `Stepper` - Navigation between steps

#### Feature 4: Track Progress

**Page:** `/progress-sk` (`ProgressPengajuanSK.tsx`)

**Flow:**

1. Display timeline of approval stages
2. Show current status with color coding
3. Show approval timestamps
4. Display catatan revisi if rejected
5. Allow re-submission if rejected

**Timeline Stages:**

1. ✅ Diupload (initial)
2. 🟡 Verifikasi OKK (pending)
3. 🟡 Persetujuan Sekjend (pending)
4. 🟡 Persetujuan Ketum (pending)
5. 🎉 SK Terbit (final)

**Status Colors:**

- Gray: Draft
- Blue: Diupload
- Yellow: In review
- Red: Rejected
- Green: Approved
- Primary: SK Terbit

**Key Components:**

- `StatusTimeline` - Visual progress timeline
- `StatusCard` - Individual status display
- `RevisionAlert` - Shows rejection notes

### For Admin Users (OKK/Sekjend/Ketum)

#### Feature 5: Admin Dashboard

**Page:** `/dashboard-admin` (`DashboardAdmin.tsx`)

**Flow:**

1. Display statistics cards:
   - Total Pengajuan
   - Menunggu Verifikasi
   - Sedang Diproses
   - SK Terbit
2. Table with all submissions:
   - Tipe Organisasi (DPD/DPC/PAC)
   - Nama Organisasi
   - Tanggal MUSDA
   - Lokasi
   - Status
   - Tanggal Diajukan
   - Action (Detail button)
3. Filters:
   - Search (by name, provinsi, lokasi)
   - Filter by Status
   - Filter by Provinsi

**Key Features:**

- Real-time data updates
- Sortable columns
- Responsive design
- Click to view detail

**Key Components:**

- `StatsCards` - Statistics display
- `SearchInput` - Search functionality
- `StatusFilter` - Filter dropdown
- `PengajuanTable` - Main data table

#### Feature 6: Detail & Verification

**Page:** `/detail-pengajuan/:id` (`DetailPengajuan.tsx`)

**Flow:**

1. Display complete submission details:
   - Organization info (tipe, provinsi, etc.)
   - MUSDA info (date, location, PDF)
   - Pengurus list with gender ratio
   - Bank account data
   - Office address data
   - Office legality data
2. Admin actions (based on role & status):
   - Approve (changes status)
   - Reject (requires revision notes)
   - Publish SK (Ketum only, final step)
3. Document viewing:
   - PDF viewer for MUSDA report
   - Image viewer for KTP, photos, docs

**Approval Logic:**

- OKK: Can approve `diupload` → `diverifikasi_okk`
- Sekjend: Can approve `diverifikasi_okk` → `disetujui_sekjend`
- Ketum: Can approve `disetujui_sekjend` → `disetujui_ketum`
- Ketum: Can publish `disetujui_ketum` → `sk_terbit`

**Key Components:**

- `PengajuanInfoCard` - Submission details
- `PengurusTable` - Pengurus list
- `BankAccountCard` - Bank account info
- `OfficeAddressCard` - Office address info
- `OfficeLegalityCard` - Office legality info
- `VerificationActions` - Approve/Reject buttons
- `PublishSKCard` - Publish SK button (Ketum only)
- `RevisionNoteCard` - Rejection notes

---

## 🔄 User Flow Diagrams

### Organization User Flow

```
┌─────────────┐
│   Sign Up   │ /auth (register)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Login    │ /auth (login)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Dashboard DPD   │ /dashboard
│ - View Progress │
│ - 3 Main Steps  │
└──────┬──────────┘
       │
       ├─── Step 1 ───────────────────────────┐
       │                                       │
       ▼                                       ▼
┌──────────────────┐              ┌────────────────────┐
│ Upload Laporan   │ /upload-     │ Data Administrasi  │ /data-administrasi
│ MUSDA            │  laporan     │ (Independent)      │
│ - Date           │              │ - Bank Account     │
│ - Location       │              │ - Office Address   │
│ - PDF Upload     │              │ - Office Legality  │
└────────┬─────────┘              └────────────────────┘
         │
         ▼
┌──────────────────┐
│ Input Pengurus   │ /input-pengurus
│ - Add Pengurus   │
│ - 30% Female     │
│ - Upload KTP     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Track Progress   │ /progress-sk
│ - Timeline       │
│ - Status Updates │
│ - Revisions      │
└──────────────────┘
```

### Admin Approval Flow

```
┌─────────────┐
│ Admin Login │ /auth-admin
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Admin Dashboard │ /dashboard-admin
│ - All Pengajuan │
│ - Filters       │
│ - Search        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Detail Pengajuan│ /detail-pengajuan/:id
│ - View All Data │
│ - Verify Docs   │
└──────┬──────────┘
       │
       ├─── OKK (First Approval) ────┐
       │                              │
       ▼                              ▼
   ┌──────┐                      ┌───────┐
   │Approve│ diverifikasi_okk     │Reject │ ditolak_okk
   └───┬──┘                       └───────┘
       │
       ├─── Sekjend (Second Approval) ─┐
       │                                │
       ▼                                ▼
   ┌──────┐                        ┌───────┐
   │Approve│ disetujui_sekjend      │Reject │ ditolak_sekjend
   └───┬──┘                         └───────┘
       │
       ├─── Ketum (Final Approval) ────┐
       │                                │
       ▼                                ▼
   ┌──────┐                        ┌───────┐
   │Approve│ disetujui_ketum        │Reject │ ditolak_ketum
   └───┬──┘                         └───────┘
       │
       ├─── Ketum (Publish SK) ────┐
       │                            │
       ▼                            ▼
   ┌────────────┐              ┌─────────┐
   │ SK TERBIT  │              │  Done   │
   └────────────┘              └─────────┘
```

---

## 📁 Code Structure

### Directory Structure

```
src/
├── assets/              # Static assets
│   └── hanura-logo.jpg
│
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   └── ... (30+ UI components)
│   │
│   ├── detail-pengajuan/        # DetailPengajuan components
│   │   ├── PengajuanInfoCard.tsx
│   │   ├── PengurusTable.tsx
│   │   ├── administrative/
│   │   │   ├── BankAccountCard.tsx
│   │   │   ├── OfficeAddressCard.tsx
│   │   │   └── OfficeLegalityCard.tsx
│   │   ├── actions/
│   │   │   ├── VerificationActions.tsx
│   │   │   ├── PublishSKCard.tsx
│   │   │   └── RevisionNoteCard.tsx
│   │   └── index.ts
│   │
│   ├── pengurus/        # InputDataPengurus components
│   │   ├── FormPengurus.tsx
│   │   ├── ListPengurus.tsx
│   │   ├── ProgressGender.tsx
│   │   └── CustomJabatanDialog.tsx
│   │
│   └── dpd/            # DataAdministrasi components
│       ├── BankAccountUpload.tsx
│       ├── OfficeAddressProof.tsx
│       └── OfficeLegality.tsx
│
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client config
│       └── types.ts     # Auto-generated DB types
│
├── lib/                # Utility functions
│   ├── utils.ts        # General utilities (cn, etc.)
│   ├── auth.ts         # Auth helper functions
│   ├── storage.ts      # File upload/download helpers
│   ├── organization.ts # Organization info helpers
│   └── struktur-constants.ts  # Struktur & jabatan constants
│
├── pages/              # Page components (routes)
│   ├── Index.tsx       # Landing page
│   ├── Auth.tsx        # Organization user login/register
│   ├── AuthAdmin.tsx   # Admin login
│   ├── DashboardDPD.tsx          # Organization dashboard
│   ├── UploadLaporanMusda.tsx    # Step 1: Upload MUSDA
│   ├── InputDataPengurus.tsx     # Step 2: Input pengurus
│   ├── DataAdministrasiDPD.tsx   # Admin data (independent)
│   ├── ProgressPengajuanSK.tsx   # Step 3: Track progress
│   ├── DashboardAdmin.tsx        # Admin dashboard
│   ├── DetailPengajuan.tsx       # Admin detail & verify
│   └── NotFound.tsx    # 404 page
│
├── types/              # TypeScript type definitions
│   └── detail-pengajuan.ts
│
├── App.tsx             # Root component with routing
├── main.tsx            # Entry point
└── index.css           # Global styles + Tailwind
```

### Routing Structure

```typescript
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Index />} />

  {/* Organization User Routes */}
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<DashboardDPD />} />
  <Route path="/upload-laporan" element={<UploadLaporanMusda />} />
  <Route path="/input-pengurus" element={<InputDataPengurus />} />
  <Route path="/data-administrasi" element={<DataAdministrasiDPD />} />
  <Route path="/progress-sk" element={<ProgressPengajuanSK />} />

  {/* Admin Routes */}
  <Route path="/auth-admin" element={<AuthAdmin />} />
  <Route path="/dashboard-admin" element={<DashboardAdmin />} />
  <Route path="/detail-pengajuan/:id" element={<DetailPengajuan />} />

  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 🔑 Key Components

### Shared UI Components (shadcn/ui)

All components from `src/components/ui/`:

- **Card** - Container with header, content, footer
- **Button** - Interactive buttons with variants
- **Input** - Form input fields
- **Table** - Data tables with sorting
- **Dialog** - Modal dialogs
- **Badge** - Status badges
- **Progress** - Progress bars
- **Select** - Dropdown selects
- **Textarea** - Multi-line text input
- **Label** - Form labels
- And 20+ more...

### Custom Hooks

#### `useAuth` Pattern

```typescript
// Used in: Auth.tsx, AuthAdmin.tsx
const handleAuth = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    // Check role and redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile.role in ["okk", "sekjend", "ketum"]) {
      navigate("/dashboard-admin");
    } else {
      navigate("/dashboard");
    }
  }
};
```

#### `useFileUpload` Pattern

```typescript
// Used throughout the app
const uploadFile = async (file: File, bucket: string) => {
  const filePath = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (!error) return filePath;
  return null;
};
```

### Reusable Patterns

#### Organization Info Helper

```typescript
// lib/organization.ts
export const getOrganizationInfo = async () => {
  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tipe_organisasi, provinsi, kabupaten_kota, kecamatan")
    .eq("id", data.user.id)
    .single();

  // Returns: { tipe: 'DPD', nama: 'DPD', fullName: 'DPD Sulawesi Tenggara' }
};
```

#### Signed URL Helper

```typescript
// lib/storage.ts
export const getSignedUrl = async (bucket: string, path: string) => {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  return data?.signedUrl;
};
```

---

## 💾 State Management

### No External State Library

Uses React's built-in state management:

- **useState** - Component-level state
- **useEffect** - Side effects & data fetching
- **Context** - Not used (app is simple enough)

### State Patterns

#### Loading States

```typescript
const [loading, setLoading] = useState(true);
const [actionLoading, setActionLoading] = useState(false);

// Page load
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    // fetch data
    setLoading(false);
  };
  fetchData();
}, []);

// Action (submit, approve, etc.)
const handleAction = async () => {
  setActionLoading(true);
  // perform action
  setActionLoading(false);
};
```

#### Form States

```typescript
const [formData, setFormData] = useState({
  field1: "",
  field2: "",
  file: null,
});

const handleChange = (field: string, value: any) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
};
```

---

## 🔐 Authentication Flow

### Registration (Organization Users)

```
User fills form
├── Email
├── Password
├── Full Name
├── Tipe Organisasi (DPD/DPC/PAC)
├── Provinsi (required)
├── Kabupaten/Kota (if DPC/PAC)
└── Kecamatan (if PAC)
    │
    ▼
Supabase Auth.signUp()
    │
    ▼
Auto-creates profile via trigger
    │
    ▼
User can login
```

### Login

```
User enters credentials
    │
    ▼
Supabase Auth.signInWithPassword()
    │
    ▼
Check profile.role
    │
    ├─ Admin (okk/sekjend/ketum) → /dashboard-admin
    └─ Organization → /dashboard
```

### Session Management

```typescript
// Check session on protected routes
useEffect(() => {
  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
    }
  };
  checkSession();
}, []);
```

---

## 📤 File Upload Flow

### Upload Process

```
User selects file
    │
    ▼
Validate file
├── Type (PDF/JPG/PNG)
├── Size (max 5MB or 10MB)
└── Required fields
    │
    ▼
Upload to Supabase Storage
    │
    ├─ Bucket: laporan-musda / ktp-pengurus / dpd-documents
    └─ Path: {userId}/{timestamp}-{filename}
    │
    ▼
Get file path
    │
    ▼
Save path to database
    │
    ▼
Show success toast
```

### Download/View Process

```
User clicks "View"
    │
    ▼
Get file path from database
    │
    ▼
Create signed URL (1 hour expiry)
    │
    ▼
Open in new tab or show in dialog
```

---

## ✅ Approval Workflow

### Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PENGAJUAN SK WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

DPD/DPC/PAC Creates Submission
    │
    ▼
┌─────────────┐
│   draft     │ (incomplete)
└──────┬──────┘
       │ [Upload MUSDA + Input Pengurus]
       ▼
┌─────────────┐
│  diupload   │ ◄────────────────┐ (can resubmit if rejected)
└──────┬──────┘                  │
       │                         │
       │ OKK Reviews             │
       ├─────────────┐           │
       │             │           │
       ▼             ▼           │
┌──────────────────┐ ┌──────────────┐
│diverifikasi_okk  │ │ ditolak_okk  │───┘
└────────┬─────────┘ └──────────────┘
         │
         │ Sekjend Reviews
         ├──────────────┐
         │              │
         ▼              ▼
┌────────────────────┐ ┌─────────────────┐
│disetujui_sekjend   │ │ditolak_sekjend  │───┐
└────────┬───────────┘ └─────────────────┘   │
         │                                   │
         │ Ketum Reviews                     │
         ├──────────────┐                    │
         │              │                    │
         ▼              ▼                    │
┌────────────────────┐ ┌─────────────────┐   │
│disetujui_ketum     │ │ditolak_ketum    │───┤
└────────┬───────────┘ └─────────────────┘   │
         │                                   │
         │ Ketum Publishes SK                │
         ▼                                   │
┌─────────────┐                              │
│  sk_terbit  │ (FINAL)                      │
└─────────────┘                              │
                                             │
         [Rejection Loop] ◄──────────────────┘
         User sees catatan_revisi
         User fixes issues
         User resubmits → back to 'diupload'
```

### Status Transitions

| Current Status    | Actor   | Action     | Next Status       |
| ----------------- | ------- | ---------- | ----------------- |
| draft             | User    | Submit     | diupload          |
| diupload          | OKK     | Approve    | diverifikasi_okk  |
| diupload          | OKK     | Reject     | ditolak_okk       |
| ditolak_okk       | User    | Resubmit   | diupload          |
| diverifikasi_okk  | Sekjend | Approve    | disetujui_sekjend |
| diverifikasi_okk  | Sekjend | Reject     | ditolak_sekjend   |
| ditolak_sekjend   | User    | Resubmit   | diupload          |
| disetujui_sekjend | Ketum   | Approve    | disetujui_ketum   |
| disetujui_sekjend | Ketum   | Reject     | ditolak_ketum     |
| ditolak_ketum     | User    | Resubmit   | diupload          |
| disetujui_ketum   | Ketum   | Publish SK | sk_terbit         |

---

## 🎨 UI/UX Patterns

### Design System

**Colors:**

- Primary: Blue (Hanura brand color)
- Success: Green
- Destructive: Red
- Warning: Yellow
- Muted: Gray

**Typography:**

- Font: Poppins (via Google Fonts)
- Headings: font-bold
- Body: font-normal
- Code: font-mono

**Spacing:**

- Uses Tailwind spacing scale (4px increments)
- Container: `container mx-auto px-4`
- Card padding: `p-6`
- Gap: `gap-4` or `gap-6`

### Common UI Patterns

#### Page Layout

```tsx
<div className="min-h-screen bg-gradient-soft">
  <header className="bg-card border-b shadow-soft sticky top-0 z-10">
    {/* Logo + Title + Actions */}
  </header>

  <main className="container mx-auto px-4 py-8">{/* Page content */}</main>
</div>
```

#### Card Pattern

```tsx
<Card className="shadow-large">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

#### Loading State

```tsx
if (loading) {
  return <LoadingScreen />;
}
```

#### Empty State

```tsx
{list.length === 0 ? (
  <p className="text-center text-muted-foreground py-8">
    Tidak ada data
  </p>
) : (
  // Show data
)}
```

---

## 🚀 Performance Considerations

### Optimization Strategies

1. **Lazy Loading**

   - Images loaded on demand
   - PDFs opened in new tab (not embedded)

2. **Pagination**

   - Not currently implemented
   - Future: Add for large datasets

3. **Caching**

   - Supabase client caches queries automatically
   - Signed URLs cached for 1 hour

4. **File Size Limits**
   - Laporan MUSDA: 10MB max
   - Other files: 5MB max
   - Prevents storage bloat

---

## 🔧 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

```env
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Deployment

Build artifacts in `dist/` folder, deployable to:

- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting

---

## 📝 Code Conventions

### Naming Conventions

- **Components:** PascalCase (`DashboardAdmin.tsx`)
- **Files:** kebab-case for non-components (`detail-pengajuan.ts`)
- **Functions:** camelCase (`handleSubmit`)
- **Constants:** UPPER_SNAKE_CASE (`STATUS_CONFIG`)
- **Types:** PascalCase (`PengajuanDetail`)

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from "react";

// 2. Third-party libraries
import { useNavigate } from "react-router-dom";

// 3. UI components
import { Card, CardContent } from "@/components/ui/card";

// 4. Custom components
import { PengajuanInfoCard } from "@/components/detail-pengajuan";

// 5. Utilities
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// 6. Types
import type { PengajuanDetail } from "@/types/detail-pengajuan";

// 7. Assets
import hanuraLogo from "@/assets/hanura-logo.jpg";
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Type Errors for Administrative Tables

**Problem:** TypeScript errors when querying `dpd_bank_account`, etc.

**Solution:**

```typescript
// Use type assertion
const { data } = await(supabase as any)
  .from("dpd_bank_account")
  .select("*");

setBankAccount(data as unknown as BankAccountData);
```

### Issue 2: Infinite Re-renders

**Problem:** useEffect watching entire object

**Solution:**

```typescript
// ❌ Wrong
useEffect(() => {
  // ...
}, [pengajuan]);

// ✅ Correct
useEffect(() => {
  // ...
}, [pengajuan?.dpd_id]);
```

### Issue 3: File Upload Fails

**Problem:** RLS policies blocking upload

**Solution:**

- Ensure storage bucket has correct policies
- Use authenticated user's UID in path
- Check file size limits

---

## 📚 Further Reading

- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Document Version:** 1.0
**Last Updated:** December 28, 2025
**Maintained By:** Development Team
