# Planning: Fitur Approval Data Administrasi oleh OKK

## 📋 Overview

Fitur ini memungkinkan OKK untuk melakukan validasi/approval terhadap data administrasi yang diinput oleh DPD/DPC/PAC, meliputi:
- Rekening Bank Organisasi
- Alamat & Bukti Sekretariat
- Legalitas Sekretariat

## 🎯 User Stories

### OKK (Verifikator)
- Sebagai OKK, saya ingin melihat daftar DPD/DPC/PAC yang sudah submit data administrasi
- Sebagai OKK, saya ingin melihat detail setiap dokumen administrasi
- Sebagai OKK, saya ingin approve atau reject setiap dokumen
- Sebagai OKK, saya ingin memberikan catatan/komentar untuk dokumen yang ditolak

### DPD/DPC/PAC
- Sebagai DPD/DPC/PAC, saya ingin melihat status approval data administrasi saya
- Sebagai DPD/DPC/PAC, saya ingin melihat catatan dari OKK jika ada yang perlu diperbaiki
- Sebagai DPD/DPC/PAC, saya ingin bisa revisi data jika ditolak

## 🗄️ Database Changes

### 1. Tambah Kolom Approval ke Tabel Existing

#### Table: `dpd_bank_account`
```sql
ALTER TABLE dpd_bank_account
ADD COLUMN okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN okk_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN okk_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN okk_notes TEXT,
ADD COLUMN okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

CREATE INDEX idx_dpd_bank_account_okk_status ON dpd_bank_account(okk_status);
```

#### Table: `dpd_office_address`
```sql
ALTER TABLE dpd_office_address
ADD COLUMN okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN okk_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN okk_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN okk_notes TEXT,
ADD COLUMN okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

CREATE INDEX idx_dpd_office_address_okk_status ON dpd_office_address(okk_status);
```

#### Table: `dpd_office_legality`
```sql
ALTER TABLE dpd_office_legality
ADD COLUMN okk_verified BOOLEAN DEFAULT NULL,
ADD COLUMN okk_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN okk_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN okk_notes TEXT,
ADD COLUMN okk_status TEXT CHECK (okk_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

CREATE INDEX idx_dpd_office_legality_okk_status ON dpd_office_legality(okk_status);
```

### 2. View untuk OKK Dashboard

```sql
-- View untuk aggregate status administrasi per DPD
CREATE OR REPLACE VIEW v_dpd_administrasi_status AS
SELECT
  d.id as dpd_id,
  d.email,
  d.nama_dpd,
  d.provinsi,

  -- Bank Account Status
  ba.okk_status as bank_status,
  ba.okk_verified_at as bank_verified_at,
  ba.okk_notes as bank_notes,

  -- Office Address Status
  oa.okk_status as office_status,
  oa.okk_verified_at as office_verified_at,
  oa.okk_notes as office_notes,

  -- Office Legality Status
  ol.okk_status as legality_status,
  ol.okk_verified_at as legality_verified_at,
  ol.okk_notes as legality_notes,

  -- Overall Status
  CASE
    WHEN ba.okk_status = 'approved' AND oa.okk_status = 'approved' AND ol.okk_status = 'approved'
      THEN 'all_approved'
    WHEN ba.okk_status = 'rejected' OR oa.okk_status = 'rejected' OR ol.okk_status = 'rejected'
      THEN 'has_rejection'
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
  ) as last_updated

FROM dpd d
LEFT JOIN dpd_bank_account ba ON ba.dpd_id = d.id
LEFT JOIN dpd_office_address oa ON oa.dpd_id = d.id
LEFT JOIN dpd_office_legality ol ON ol.dpd_id = d.id

WHERE ba.id IS NOT NULL OR oa.id IS NOT NULL OR ol.id IS NOT NULL
ORDER BY last_updated DESC;
```

### 3. RLS Policies

```sql
-- Policy untuk OKK bisa read semua data administrasi
CREATE POLICY "OKK can view all administrative data"
ON dpd_bank_account FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'okk'
  )
);

-- Policy untuk OKK bisa update approval status
CREATE POLICY "OKK can update approval status"
ON dpd_bank_account FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'okk'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'okk'
  )
);

-- Duplicate untuk dpd_office_address dan dpd_office_legality
```

## 🎨 Frontend Components

### 1. OKK Admin Pages

#### `/admin/review-administrasi` - List View
**Components:**
- `AdminReviewAdministrasi.tsx` - Main page
- `AdministrasiListTable.tsx` - Table dengan filter & sorting
- `StatusBadge.tsx` - Badge untuk status (pending/approved/rejected)

**Features:**
- Filter by status (all, pending, approved, rejected)
- Filter by organization type (DPD, DPC, PAC)
- Search by nama organisasi atau provinsi
- Sort by last updated
- Bulk actions (jika diperlukan)

**Columns:**
| Nama DPD | Provinsi | Bank | Office | Legality | Overall Status | Last Updated | Actions |
|----------|----------|------|--------|----------|----------------|--------------|---------|

#### `/admin/review-administrasi/:dpdId` - Detail View
**Components:**
- `AdministrasiDetailReview.tsx` - Main detail page
- `BankAccountReview.tsx` - Review rekening bank
- `OfficeAddressReview.tsx` - Review alamat & bukti kantor
- `OfficeLegalityReview.tsx` - Review legalitas
- `ApprovalDialog.tsx` - Dialog untuk approve/reject dengan notes

**Features:**
- View semua dokumen & data
- Preview/download dokumen (KTP, bukti transfer, foto kantor, dll)
- Approve/Reject button untuk setiap section
- Text area untuk catatan/komentar
- History log approval (jika diperlukan)

### 2. DPD Dashboard Updates

#### Update `DashboardDPD.tsx`
**New Components:**
- `AdministrasiApprovalStatus.tsx` - Card showing approval status
- `ApprovalTimeline.tsx` - Timeline approval process

**Features:**
- Overall approval status card
- Individual status untuk Bank, Office, Legality
- Alert/notification jika ada rejection
- Link ke revisi data jika rejected

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Status Kelengkapan Administrasi                     │
├─────────────────────────────────────────────────────┤
│ ✅ Rekening Bank         [APPROVED] 12 Jan 2025    │
│ ⏳ Alamat Sekretariat    [PENDING]  15 Jan 2025    │
│ ❌ Legalitas Sekretariat [REJECTED] 14 Jan 2025    │
│    📝 Catatan: Dokumen tidak lengkap...            │
│    [Revisi Data]                                    │
├─────────────────────────────────────────────────────┤
│ Overall Status: Pending Review                      │
└─────────────────────────────────────────────────────┘
```

### ~~3. Notification System~~ ❌ NOT REQUIRED

~~**Components:**~~
- ~~`NotificationBell.tsx` - Bell icon dengan badge~~
- ~~`NotificationDropdown.tsx` - List notifikasi~~
- ~~`NotificationItem.tsx` - Single notification~~

**Status:** Removed from scope per requirements

## 🔄 User Flows

### Flow 1: OKK Approve/Reject

```
1. OKK login ke admin dashboard
2. Navigate ke "Review Administrasi"
3. See list of DPD dengan pending/approved/rejected status
4. Click detail untuk review specific DPD
5. View dokumen & data:
   - Rekening Bank: nama, nomor, bukti transfer
   - Alamat: alamat lengkap, foto kantor, foto papan nama
   - Legalitas: jenis dokumen, file dokumen
6. For each section:
   - Click "Approve" → confirm → status updated
   - Click "Reject" → input notes → confirm → status updated
7. DPD dapat notifikasi (email/in-app)
```

### Flow 2: DPD View & Revisi

```
1. DPD login ke dashboard
2. See approval status card
3. If rejected:
   - View catatan dari OKK
   - Click "Revisi Data"
   - Navigate to DataAdministrasiDPD
   - Update data & re-submit
   - Status berubah ke "pending" lagi
4. If approved:
   - See checkmark & timestamp
   - Can proceed to next step
```

## 🏗️ Implementation Phases

### Phase 1: Database & Backend (Week 1)
- [ ] Create migration files untuk alter tables
- [ ] Create view `v_dpd_administrasi_status`
- [ ] Setup RLS policies
- [ ] Create database functions untuk update approval status
- [ ] Test migrations di development

### Phase 2: OKK Admin Pages (Week 2)
- [ ] Create `/admin/review-administrasi` list page
  - [ ] Table component dengan filter & sort
  - [ ] Status badges
  - [ ] Search functionality
- [ ] Create `/admin/review-administrasi/:dpdId` detail page
  - [ ] Bank account review component
  - [ ] Office address review component
  - [ ] Office legality review component
  - [ ] Approval dialog
- [ ] Implement approve/reject actions
- [ ] Add loading states & error handling

### Phase 3: DPD Dashboard Updates (Week 2)
- [ ] Create `AdministrasiApprovalStatus` component
- [ ] Update `DashboardDPD.tsx` to show approval status
- [ ] Add alert for rejected items
- [ ] Link to revision flow
- [ ] Update `DataAdministrasiDPD.tsx`:
  - [ ] Show current approval status
  - [ ] Allow re-submission if rejected
  - [ ] Disable edit if approved (optional)

### Phase 4: Testing & Polish (Week 3)
- [ ] Integration testing
- [ ] E2E testing untuk approval flow
- [ ] UI/UX polish
- [ ] Performance optimization
- [ ] Documentation

### ~~Phase 5: Notification System~~ ❌ NOT REQUIRED
- ~~Email notifications~~ - Not needed
- ~~In-app notifications~~ - Not needed
- ~~Notification preferences~~ - Not needed

## 📝 API Endpoints

### OKK Admin APIs

#### GET `/api/admin/administrasi/list`
Query params: `status`, `search`, `page`, `limit`
Response: List of DPD dengan approval status

#### GET `/api/admin/administrasi/:dpdId`
Response: Detail data administrasi DPD

#### POST `/api/admin/administrasi/:dpdId/approve-bank`
Body: `{ notes?: string }`
Response: Updated bank account with approval

#### POST `/api/admin/administrasi/:dpdId/reject-bank`
Body: `{ notes: string }` (required)
Response: Updated bank account with rejection

#### (Similar endpoints untuk office & legality)

### DPD APIs

#### GET `/api/dpd/administrasi/status`
Response: Current approval status

## 🎨 UI Components Library Needed

### New Components to Create
1. `StatusBadge` - Badge untuk pending/approved/rejected
2. `ApprovalDialog` - Modal untuk approve/reject dengan notes
3. `DocumentPreview` - Preview dokumen (image/pdf)
4. `ApprovalTimeline` - Timeline visual untuk approval process
5. ~~`NotificationBell`~~ - Not needed

### Reusable from Existing
- Card, Button, Badge dari shadcn/ui
- Table components
- Form components
- Toast notifications

## 🔒 Security Considerations

1. **Authorization:**
   - Only OKK role dapat approve/reject
   - DPD hanya bisa view status mereka sendiri
   - RLS policies enforce ini di database level

2. **Audit Trail:**
   - Track siapa yang approve/reject
   - Track timestamp
   - Optional: Track history changes (create audit log table)

3. **Data Validation:**
   - Validate notes required untuk rejection
   - Prevent approval jika data belum lengkap
   - Validate file uploads (type, size)

## 🧪 Testing Strategy

### Unit Tests
- Validation functions
- Status calculation logic
- Permission checks

### Integration Tests
- Approval flow end-to-end
- Rejection dengan notes
- Re-submission after rejection

### E2E Tests
- OKK review & approve full flow
- DPD view status & revisi flow
- Multi-user concurrent approvals

## 📊 Success Metrics

1. **Operational:**
   - Average time to approve per DPD
   - Rejection rate (should decrease over time)
   - Re-submission rate

2. **User Satisfaction:**
   - OKK feedback on review UI
   - DPD feedback on status visibility
   - Support tickets related to approval process

## 🚀 Deployment Plan

1. **Development:**
   - Feature branch: `feature/okk-approval`
   - Testing di development environment

2. **Staging:**
   - Deploy to staging
   - OKK team testing
   - Bug fixes

3. **Production:**
   - Migration run during maintenance window
   - Deploy frontend
   - Monitor for issues
   - Gradual rollout (if needed)

## 📚 Documentation Needed

1. **User Guide:**
   - OKK: How to review & approve
   - DPD: How to check status & revisi

2. **Technical Docs:**
   - API documentation
   - Database schema changes
   - Component documentation

## ✅ Requirements Clarified

1. **Approval Workflow:** ✅ **Partial approval allowed**
   - Tidak harus semua 3 approved
   - Setiap dokumen bisa di-approve independent

2. **Re-approval:** ✅ **Required for revisions**
   - Jika DPD revisi data yang sudah approved
   - Status kembali ke "pending" dan perlu approval ulang

3. **History:** ✅ **No audit log needed**
   - Cukup simpan status terakhir saja
   - Tidak perlu track history changes

4. **Notification:** ✅ **Not required**
   - Tidak perlu email notification
   - Tidak perlu in-app notification
   - DPD check dashboard manual

5. **Bulk Operations:** ✅ **Not required**
   - Tidak perlu bulk approve
   - OKK approve satu-satu saja

---

## 📅 Timeline Estimate

**Total: 2-3 weeks** ⚡ (Simplified based on requirements)

- Week 1: Database & Backend
- Week 2: OKK Admin UI + DPD Dashboard
- Week 3: Testing & Polish
- ~~Week 4: Notification System~~ - Not needed

---

*Document Version: 1.0*
*Last Updated: 2025-01-XX*
*Author: Claude Code*