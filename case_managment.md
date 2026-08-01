# LGA — Case Management Module: Implementation Guide

**Project:** Laal Global Advisory (LGA) — Internal Firm Management System
**Module:** Case Management (Matters, Hearings, Tasks, Documents, Timeline)
**Stack:** NestJS (TypeScript) + Prisma 7 + PostgreSQL
**Status:** Design finalized, ready for implementation
**Phase:** Phase 2 (built after HR + Expense Tracking MVP ships)

---

## 1. Purpose & Scope

This module extends the existing LGA system (which already has `Firm`, `User`, `Associate`, HR, and Expense modules) with case/matter management tailored to the **Pakistani legal system** (District Courts, High Courts, Supreme Court — Civil/CPC and Criminal/CrPC procedure).

It covers five connected areas:
1. **Matters** — the core case record (client, court, parties, status)
2. **Hearings** — the chronological legal ledger ("Tareekh-e-Pesh" / next-date engine)
3. **Tasks** — Jira/ClickUp-style delegation, optionally linked to a matter or hearing, or fully independent
4. **Documents** — version-controlled case file storage
5. **Timeline** — an aggregated, read-only chronological view of everything above

**Explicitly out of scope for this phase:** Cause List scraping/parsing from court websites, SMS/WhatsApp delivery integration (design the trigger points, not the delivery mechanism), invoicing/billing tied to matters.

**Multi-tenancy rule (non-negotiable, inherited from the rest of the system):** every table below carries `firmId`. Every service method takes the caller's `firmId` (sourced from the authenticated JWT, never from the request body) and bakes it into the Prisma `where` clause of every query. Never fetch-by-id-then-check-firm; always fetch-with-firm-in-the-query.

---

## 2. Domain Model

### 2.1 Entity relationship summary

```
Firm
 └── Matter (the case)
      ├── MatterAssociate (many-to-many: which associates work this case)
      ├── MatterParty (many-to-many: litigants, opposing counsel, witnesses)
      ├── Hearing (one-to-many: chronological court events)
      │    └── HearingAttendee (many-to-many: who attended)
      ├── Task (one-to-many: can ALSO exist independent of a matter)
      │    ├── TaskNote (comment thread)
      │    └── TaskAttachment (proof-of-completion files)
      └── CaseDocument (one-to-many)
           └── CaseDocumentVersion (one-to-many: version history)

CourtStage (lookup table, seeded with CPC/CrPC procedural stages, firm-customizable)
AuditLog (immutable log of state changes across Matter/Task/Hearing)
```

### 2.2 Full Prisma schema

```prisma
// ==========================================
// CASE MANAGEMENT: LOOKUP DATA
// ==========================================

enum CaseType {
  CIVIL
  CRIMINAL
  WRIT
  FAMILY
  SERVICE
  CORPORATE
  TAXATION
}

model CourtStage {
  id            String   @id @default(uuid())
  firmId        String?  // null = system default, set = firm-specific custom stage
  caseType      CaseType
  name          String   // e.g. "Framing of Issues (Tanqeehat)"
  sequenceOrder Int
  isDefault     Boolean  @default(true)

  matters Matter[]

  @@index([caseType, sequenceOrder])
}

// ==========================================
// MATTER (CASE)
// ==========================================

enum MatterStatus {
  ACTIVE
  ARCHIVED
  DECIDED
  CLOSED
}

model Matter {
  id                String       @id @default(uuid())
  firmId            String
  firmCaseNumber    String       // internal firm reference
  courtCaseNumber   String?      // e.g. "Civil Suit No. 124/2024"
  cnr               String?      // Case Number Record
  caseType          CaseType
  court             String?      // "District & Sessions Court Islamabad"
  bench             String?      // "Lahore High Court (Rawalpindi Bench)"
  presidingJudge    String?
  currentStageId    String?
  status            MatterStatus @default(ACTIVE)
  filingDate        DateTime?
  clientName        String
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  firm         Firm              @relation(fields: [firmId], references: [id], onDelete: Cascade)
  currentStage CourtStage?       @relation(fields: [currentStageId], references: [id])
  associates   MatterAssociate[]
  parties      MatterParty[]
  hearings     Hearing[]
  tasks        Task[]
  documents    CaseDocument[]

  @@index([firmId, status])
}

model MatterAssociate {
  id          String  @id @default(uuid())
  matterId    String
  associateId String
  role        String? // "Lead Counsel", "Associate", "Co-Counsel"

  matter    Matter    @relation(fields: [matterId], references: [id], onDelete: Cascade)
  associate Associate @relation(fields: [associateId], references: [id])

  @@unique([matterId, associateId])
}

// ==========================================
// PARTIES
// ==========================================

enum PartyRole {
  PLAINTIFF
  DEFENDANT
  PETITIONER
  RESPONDENT
  ACCUSED
  COMPLAINANT
  OPPOSING_COUNSEL
  CO_COUNSEL
  WITNESS
  COURT_CLERK
}

model Party {
  id         String  @id @default(uuid())
  firmId     String
  name       String
  phone      String?
  email      String?
  isExternal Boolean @default(true)

  firm        Firm          @relation(fields: [firmId], references: [id], onDelete: Cascade)
  matterLinks MatterParty[]
}

model MatterParty {
  id        String    @id @default(uuid())
  matterId  String
  partyId   String
  partyRole PartyRole

  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  party  Party  @relation(fields: [partyId], references: [id])

  @@unique([matterId, partyId, partyRole])
}

// ==========================================
// HEARINGS (Tareekh-e-Pesh / Legal Ledger)
// ==========================================

enum HearingStatus {
  SCHEDULED
  HELD
  ADJOURNED
  SINE_DIE
  DECIDED
}

model Hearing {
  id                 String        @id @default(uuid())
  matterId           String
  hearingDate        DateTime
  purpose            String
  presidingJudge     String?
  proceedingsSummary String?
  orderSheetUrl      String?
  nextDate           DateTime?
  nextPurpose        String?
  status             HearingStatus @default(SCHEDULED)
  createdById        String
  createdAt          DateTime      @default(now())

  matter    Matter            @relation(fields: [matterId], references: [id], onDelete: Cascade)
  attendees HearingAttendee[]

  @@index([matterId, hearingDate(sort: Desc)])
}

model HearingAttendee {
  id          String @id @default(uuid())
  hearingId   String
  associateId String

  hearing   Hearing   @relation(fields: [hearingId], references: [id], onDelete: Cascade)
  associate Associate @relation(fields: [associateId], references: [id])

  @@unique([hearingId, associateId])
}

// ==========================================
// TASKS
// ==========================================

enum TaskType {
  DOCUMENT_FILING
  PRINTING_BINDING
  CLIENT_FOLLOWUP
  WITNESS_BRIEFING
  LEGAL_RESEARCH
  OTHER
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  UNDER_REVIEW
  COMPLETED
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Task {
  id              String       @id @default(uuid())
  firmId          String
  matterId        String?      // nullable: independent tasks allowed
  hearingId       String?      // optional: task tied to hearing prep
  assignedById    String
  assignedToId    String
  title           String
  description     String?
  taskType        TaskType?
  status          TaskStatus   @default(PENDING)
  priority        TaskPriority @default(MEDIUM)
  dueDate         DateTime?
  estimatedHours  Decimal?     @db.Decimal(6, 2)
  completionNotes String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  firm        Firm             @relation(fields: [firmId], references: [id], onDelete: Cascade)
  matter      Matter?          @relation(fields: [matterId], references: [id])
  hearing     Hearing?         @relation(fields: [hearingId], references: [id])
  assignedTo  Associate        @relation("TaskAssignee", fields: [assignedToId], references: [id])
  assignedBy  Associate        @relation("TaskAssigner", fields: [assignedById], references: [id])
  notes       TaskNote[]
  attachments TaskAttachment[]

  @@index([assignedToId, status, dueDate])
  @@index([matterId])
}

model TaskNote {
  id        String   @id @default(uuid())
  taskId    String
  authorId  String
  note      String
  createdAt DateTime @default(now())

  task   Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author Associate @relation(fields: [authorId], references: [id])
}

model TaskAttachment {
  id           String   @id @default(uuid())
  taskId       String
  fileUrl      String
  label        String?  // "Court stamp copy", "Filed petition scan"
  uploadedById String
  createdAt    DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

// ==========================================
// DOCUMENTS (versioned)
// ==========================================

enum DocumentCategory {
  PLEADING
  EVIDENCE
  CORRESPONDENCE
  ORDER_SHEET
  AFFIDAVIT
  CONTRACT
  OTHER
}

model CaseDocument {
  id        String           @id @default(uuid())
  matterId  String
  title     String
  category  DocumentCategory
  createdAt DateTime         @default(now())

  matter   Matter                @relation(fields: [matterId], references: [id], onDelete: Cascade)
  versions CaseDocumentVersion[]
}

model CaseDocumentVersion {
  id            String   @id @default(uuid())
  documentId    String
  versionNumber Int
  fileUrl       String
  uploadedById  String
  changeNotes   String?
  isCurrent     Boolean  @default(true)
  createdAt     DateTime @default(now())

  document CaseDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId, isCurrent])
}

// ==========================================
// AUDIT LOG
// ==========================================

model AuditLog {
  id            String   @id @default(uuid())
  firmId        String
  entityType    String   // "Matter" | "Task" | "Hearing" | "CaseDocument"
  entityId      String
  action        String   // "STAGE_CHANGED" | "TASK_COMPLETED" | "DOCUMENT_VERSIONED" | "MATTER_ARCHIVED"
  performedById String
  beforeState   Json?
  afterState    Json?
  createdAt     DateTime @default(now())

  @@index([firmId, entityType, entityId])
}
```

> **Note:** all `Matter`, `Task`, `Party`, `AuditLog` models need a corresponding `matters`, `parties`, `tasks` relation array added to the existing `Firm` model when merging this into the main `schema.prisma`.

---

## 3. Case (Matter) Flow

### 3.1 Lifecycle

```
CREATE MATTER
   ↓
ACTIVE  ──────────────────────────────►  DECIDED / CLOSED
   │                                            │
   │  (hearings logged, tasks worked,           │
   │   documents versioned throughout)          │
   │                                            ▼
   └────────────────►  ARCHIVED  ◄──────────────┘
                     (soft-delete: data stays queryable,
                      just filtered from default views)
```

- A Matter is **never hard-deleted**. `status` moves between `ACTIVE`, `DECIDED`, `CLOSED`, `ARCHIVED`. Archiving is reversible (unarchive = set back to `ACTIVE`).
- `currentStageId` is freely reassignable at any point — the CPC/CrPC stage list is a *default seed*, not an enforced state machine. An associate can skip, repeat, or jump stages, since real litigation doesn't always move linearly.
- Every stage change writes an `AuditLog` row (`action: "STAGE_CHANGED"`, `beforeState`/`afterState` capturing the old/new `currentStageId`).

### 3.2 Creation flow

1. `OWNER` or `ADMIN` creates a Matter: client name, case type, court info, filing date.
2. Assigns one or more Associates via `MatterAssociate` (with an optional per-matter role label like "Lead Counsel").
3. Optionally adds Parties (opposing counsel, defendant, witnesses) via `MatterParty`.
4. System auto-suggests a starting `CourtStage` based on `caseType` (e.g., CIVIL → "Institution/Filing"), but this is just a default, editable immediately.

### 3.3 Ongoing case work (the day-to-day loop)

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Log a       │────►│  System sets │────►│  Reminder job │
│  Hearing     │     │  next Hearing│     │  scheduled for│
│  outcome     │     │  as SCHEDULED│     │  nextDate      │
└─────────────┘     └──────────────┘     └───────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Create Task │────►│  Associate   │
│  (optionally │     │  works task, │
│  linked to   │     │  attaches    │
│  the hearing)│     │  proof files │
└─────────────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│  Upload/     │
│  revise a    │
│  Document    │
└─────────────┘
```

This loop (hearing → tasks → documents) repeats for the life of the matter. All three feed the **Timeline** (Section 5).

### 3.4 Hearing logging — the "Tareekh-e-Pesh" engine

This is the most important business rule in the module:

**When a hearing outcome is logged with a `nextDate` set, the service must, in a single transaction:**
1. Update the just-logged `Hearing` row's `status` (HELD / ADJOURNED / SINE_DIE / DECIDED) and fill in `proceedingsSummary`, `orderSheetUrl`.
2. Create a **new** `Hearing` row for the matter with `hearingDate = nextDate`, `purpose = nextPurpose`, `status = SCHEDULED`.
3. Emit a domain event / call a notification-scheduling method so a reminder can be sent to the assigned associate(s) and (later) the client ahead of that date. **This phase only needs the trigger point built (e.g. an internal `NotificationsService.scheduleHearingReminder()` stub) — actual SMS/WhatsApp delivery integration is a future phase.**

If `DECIDED` or `SINE_DIE` is the outcome, no next hearing is auto-created.

---

## 4. Task Flow & Assignment

### 4.1 Task types (per firm's real workflow)

`DOCUMENT_FILING`, `PRINTING_BINDING`, `CLIENT_FOLLOWUP`, `WITNESS_BRIEFING`, `LEGAL_RESEARCH`, `OTHER`.

### 4.2 Two ways a task comes into existence

**A. Matter-linked task** (most common): created from within a Matter's page, `matterId` set, optionally `hearingId` set if it's prep for a specific hearing.

**B. Independent task**: created from a general "My Tasks" / firm-wide task board, `matterId` is `null`. Same table, same board UI, just not scoped to a case. This supports internal/admin work that isn't case-specific (e.g., "renew bar council membership," "prepare firm newsletter").

### 4.3 Assignment flow

```
OWNER / ADMIN                          ASSOCIATE
      │                                     │
      │  1. Creates task                    │
      │     - title, description            │
      │     - assignedToId (an associate)   │
      │     - dueDate, priority, taskType    │
      │     - matterId (optional)           │
      ├────────────────────────────────────►│
      │                                     │
      │                                     │ 2. Sees task in their board
      │                                     │    (status: PENDING)
      │                                     │
      │                                     │ 3. Moves to IN_PROGRESS
      │                                     │
      │                                     │ 4. Completes work, adds
      │                                     │    completionNotes +
      │                                     │    TaskAttachment(s)
      │                                     │    (proof: scans, receipts,
      │                                     │     filed petition copies)
      │                                     │
      │                                     │ 5. Moves to UNDER_REVIEW
      │                                     │    (or straight to
      │                                     │     COMPLETED if no
      │                                     │     review step needed)
      │                                     │
      │  6. Reviews, approves               │
      │◄────────────────────────────────────┤
      │                                     │
      │  7. Marks COMPLETED                 │
      │     (or reopens → PENDING           │
      │      with a TaskNote explaining     │
      │      what's missing)                │
      ▼                                     ▼
```

**Who can assign to whom:**
- `OWNER`/`ADMIN` can assign a task to any Associate in the firm.
- An `ASSOCIATE` can create tasks too, but only assign to **themselves** or (if you want collaborative delegation) to peers — recommended default for MVP: associates can only create tasks assigned to themselves; only `OWNER`/`ADMIN` can assign to others. This keeps delegation authority clear and matches the brief's "senior managers delegate operational workload" framing.

**Overdue tasks:** don't store a stale `OVERDUE` status in the DB. Compute it at query/read time: `status IN (PENDING, IN_PROGRESS, UNDER_REVIEW) AND dueDate < now()`. Surface this as a derived `isOverdue: boolean` field in API responses, not a persisted column — avoids needing a sweep job that can silently fail or drift.

### 4.4 Task comment thread

`TaskNote` — any associate with visibility on the task (assignee, assigner, matter-assigned associates) can add notes. Simple append-only thread, no editing/deleting notes (audit trail integrity).

---

## 5. Document Management Flow

### 5.1 The versioning problem this solves

The pain point: multiple people revise the same document over time, and everyone needs to trust they're looking at the current version while still being able to reference history.

### 5.2 Model

- `CaseDocument` = the logical document ("Settlement Agreement Draft", "Plaintiff's Affidavit")
- `CaseDocumentVersion` = each actual uploaded file, one row per revision

### 5.3 Flow

```
1. Associate creates a CaseDocument
   (title, category, matterId)
        │
        ▼
2. Uploads first file
   → CaseDocumentVersion #1 created, isCurrent = true
        │
        ▼
3. Another associate revises it
   → Uploads new file with optional changeNotes
   → TRANSACTION:
       a. Set ALL existing versions for this document → isCurrent = false
       b. Insert new CaseDocumentVersion,
          versionNumber = MAX(existing) + 1,
          isCurrent = true
        │
        ▼
4. Anyone opening the document is served
   whichever version has isCurrent = true
   (the API's "get document" endpoint should
   default to returning the current version,
   with a separate endpoint to list/fetch history)
        │
        ▼
5. Full version history remains queryable —
   who uploaded what, when, and why (changeNotes)
```

**Enforcement note:** the "only one `isCurrent = true` per document" rule is enforced in the **service layer via a transaction**, not a DB constraint (Prisma/Postgres partial unique indexes across a boolean flag are possible but add complexity not worth it here — application-level transaction enforcement is sufficient given writes go through a single controlled endpoint).

---

## 6. Timeline View

**Design decision: do NOT create a dedicated `TimelineEvent` table.** The timeline is a **read-time aggregation** of data that already lives in its proper table. This avoids data duplication and sync bugs.

### 6.1 What feeds the timeline, per matter

| Source | Event type shown |
|---|---|
| `Hearing` rows | `HEARING` (date = `hearingDate`) |
| `Task` rows where `status = COMPLETED` | `TASK_COMPLETED` (date = `updatedAt`) |
| `CaseDocumentVersion` rows | `DOCUMENT_UPLOADED` (date = `createdAt`) |
| `AuditLog` rows where `entityType = 'Matter'` and `action = 'STAGE_CHANGED'` | `STAGE_CHANGE` (date = `createdAt`) |

### 6.2 Aggregation logic (service method)

```typescript
async getMatterTimeline(matterId: string, firmId: string) {
  // always verify the matter belongs to firmId first
  const matter = await this.prisma.matter.findFirst({ where: { id: matterId, firmId } });
  if (!matter) throw new NotFoundException();

  const [hearings, completedTasks, docVersions, stageChanges] = await Promise.all([
    this.prisma.hearing.findMany({ where: { matterId }, include: { attendees: { include: { associate: true } } } }),
    this.prisma.task.findMany({ where: { matterId, status: "COMPLETED" } }),
    this.prisma.caseDocumentVersion.findMany({ where: { document: { matterId } } }),
    this.prisma.auditLog.findMany({ where: { entityId: matterId, action: "STAGE_CHANGED" } }),
  ]);

  const events = [
    ...hearings.map(h => ({ date: h.hearingDate, type: "HEARING" as const, data: h })),
    ...completedTasks.map(t => ({ date: t.updatedAt, type: "TASK_COMPLETED" as const, data: t })),
    ...docVersions.map(d => ({ date: d.createdAt, type: "DOCUMENT_UPLOADED" as const, data: d })),
    ...stageChanges.map(s => ({ date: s.createdAt, type: "STAGE_CHANGE" as const, data: s })),
  ];

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

This is deliberately generic — new event sources (e.g. future Cause List matches) plug in as another array in the `Promise.all`, no schema change needed.

---

## 7. Access Control

Uses the existing `AccessTokenGuard` + `RolesGuard` + `@Roles()` pattern already established in the Auth module. `firmId` always comes from `@CurrentUser()`, never from the request.

| Action | SUPER_ADMIN | OWNER | ADMIN | ASSOCIATE |
|---|---|---|---|---|
| Create/edit Matter | ❌ | ✅ | ✅ | ❌ |
| Archive/close Matter | ❌ | ✅ | ✅ | ❌ |
| Assign associates to Matter | ❌ | ✅ | ✅ | ❌ |
| View Matters they're assigned to | ❌ | ✅ (all) | ✅ (all) | ✅ (own only) |
| Log a Hearing | ❌ | ✅ | ✅ | ✅ (if assigned to matter) |
| Create Task assigned to self | ❌ | ✅ | ✅ | ✅ |
| Create Task assigned to others | ❌ | ✅ | ✅ | ❌ |
| Update own Task status | ❌ | ✅ | ✅ | ✅ (own tasks only) |
| Review/approve Task | ❌ | ✅ | ✅ | ❌ |
| Upload/version a Document | ❌ | ✅ | ✅ | ✅ (if assigned to matter) |
| View Timeline / Summary Report | ❌ | ✅ | ✅ | ✅ (assigned matters only) |

**Row-level restriction beyond role:** an `ASSOCIATE` should only see Matters/Tasks they are assigned to (via `MatterAssociate` / `Task.assignedToId`), not every case in the firm. This is enforced in the service layer as an additional `where` filter when the caller's role is `ASSOCIATE`:

```typescript
async listMatters(firmId: string, callerRole: string, callerAssociateId?: string) {
  const where: Prisma.MatterWhereInput = { firmId };
  if (callerRole === "ASSOCIATE") {
    where.associates = { some: { associateId: callerAssociateId } };
  }
  return this.prisma.matter.findMany({ where });
}
```

---

## 8. API Endpoints

All routes prefixed `/api` (global prefix), all require `AccessTokenGuard` unless noted. `firmId` is always taken from the JWT.

### 8.1 Matters

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/matters` | OWNER, ADMIN | Create matter |
| GET | `/matters` | all | List (row-filtered for ASSOCIATE, see §7) |
| GET | `/matters/:id` | all (assigned only if ASSOCIATE) | Full detail |
| PATCH | `/matters/:id` | OWNER, ADMIN | Edit metadata |
| PATCH | `/matters/:id/stage` | OWNER, ADMIN | Change `currentStageId`, writes AuditLog |
| PATCH | `/matters/:id/status` | OWNER, ADMIN | Archive/close/reopen |
| POST | `/matters/:id/associates` | OWNER, ADMIN | Assign an associate |
| DELETE | `/matters/:id/associates/:associateId` | OWNER, ADMIN | Remove |
| POST | `/matters/:id/parties` | OWNER, ADMIN | Add a party |
| GET | `/matters/:id/timeline` | all (assigned only if ASSOCIATE) | Aggregated timeline (§6) |
| GET | `/matters/:id/summary-report` | OWNER, ADMIN | Generates PDF |

### 8.2 Hearings

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/matters/:matterId/hearings` | OWNER, ADMIN, assigned ASSOCIATE | Log outcome; if `nextDate` set, auto-creates next `Hearing` (§3.4) |
| GET | `/matters/:matterId/hearings` | all (assigned only if ASSOCIATE) | List, sorted by date |
| PATCH | `/hearings/:id` | OWNER, ADMIN, assigned ASSOCIATE | Edit before it's held |
| POST | `/hearings/:id/attendees` | OWNER, ADMIN | Log who attended |

### 8.3 Tasks

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/tasks` | all | `matterId` optional. Non-admin roles can only set `assignedToId = self` |
| GET | `/tasks` | all | Filterable by `matterId`, `status`, `assignedToId`; ASSOCIATE sees own only |
| GET | `/tasks/:id` | assignee, assigner, OWNER, ADMIN | Detail |
| PATCH | `/tasks/:id/status` | assignee, OWNER, ADMIN | Move through lifecycle |
| POST | `/tasks/:id/notes` | assignee, assigner, matter associates | Add comment |
| POST | `/tasks/:id/attachments` | assignee | Upload proof-of-completion file |
| PATCH | `/tasks/:id/complete` | assignee | Sets status=COMPLETED + `completionNotes` |

### 8.4 Documents

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/matters/:matterId/documents` | OWNER, ADMIN, assigned ASSOCIATE | Create logical document |
| POST | `/case-documents/:id/versions` | OWNER, ADMIN, assigned ASSOCIATE | New version (transactional, §5.3) |
| GET | `/case-documents/:id` | all (assigned only if ASSOCIATE) | Returns current version by default |
| GET | `/case-documents/:id/versions` | all (assigned only if ASSOCIATE) | Full version history |

---

## 9. NestJS Module Structure

Follow the existing project convention (`nest g resource`, `PrismaService` injection, DTOs with `class-validator`):

```
src/modules/
  matters/
    dto/
    matters.controller.ts
    matters.service.ts
    matters.module.ts
    hearings/
      dto/
      hearings.controller.ts
      hearings.service.ts
      hearings.module.ts
    court-stages/
      court-stages.service.ts   (mostly read-only lookup + seed data)
  tasks/
    dto/
    tasks.controller.ts
    tasks.service.ts
    tasks.module.ts
  case-documents/
    dto/
    case-documents.controller.ts
    case-documents.service.ts
    case-documents.module.ts
```

**Cross-module rule (inherited from existing architecture):** modules never import each other's internals directly. `TasksService` needing matter data calls a public method on `MattersService` (injected), never reaches into Prisma models owned by another module directly. Same discipline as the existing HR/Expenses separation.

---

## 10. Business Rules Summary (implementation checklist)

- [x] Matter is never hard-deleted; `status` field only, `ARCHIVED` is reversible
- [x] `CourtStage` seeded with real CPC and CrPC sequences as `isDefault: true`, `firmId: null`
- [x] Stage changes on a Matter always write an `AuditLog` row
- [x] Logging a Hearing with `nextDate` auto-creates the next `Hearing` row in the same transaction, and triggers a notification-scheduling stub
- [x] Tasks: `matterId` nullable, independent tasks fully supported
- [x] Non-admin roles can only create tasks assigned to themselves
- [x] `isOverdue` is computed at read time, never stored
- [x] Document version upload is transactional: unset all `isCurrent`, insert new version as `isCurrent: true`, `versionNumber = max + 1`
- [x] Timeline is aggregated at read time from Hearing/Task/CaseDocumentVersion/AuditLog — no dedicated timeline table
- [x] ASSOCIATE role is row-restricted to matters/tasks they're assigned to, on top of the role check
- [x] Every service method takes `firmId` explicitly and filters every query by it

---

## 11. Implementation Status & API Reference

### 11.1 What Has Been Done
The entire backend module for Case Management has been implemented within the NestJS API framework:
*   **Database Schema updated & validated:** The Prisma schema (`apps/api/prisma/schema.prisma`) now includes lookup tables, matters, associations, hearings, tasks, comments, documents, and audit logs.
*   **Non-destructive seed data:** Seeded the database with standard CPC/CrPC legal sequences for Pakistan, and seeded dummy matters, hearings, and tasks using a non-destructive skip-if-exists strategy.
*   **NestJS Modules Registered:** `MattersModule`, `HearingsModule`, `TasksModule`, and `CaseDocumentsModule` are registered in the global `AppModule`.
*   **Security Integration Tests Added:** Created integration assertions in `app.security.spec.ts` validating that matters, tasks, and reports require valid JWT tokens, check tenant context (`firmId`), and row-filter appropriately for the `ASSOCIATE` role.

---

### 11.2 API Catalog

All endpoints require JWT authorization and inherit global rate limiting (Throttler).

#### Matters (`MattersController` under `/api/matters`)
*   `POST /matters` — Create a matter (OWNER, ADMIN only).
*   `GET /matters` — List matters. Associates only see matters they are assigned to.
*   `GET /matters/:id` — Detail view of a matter (assigned only if ASSOCIATE).
*   `PATCH /matters/:id` — Edit matter metadata (OWNER, ADMIN only).
*   `PATCH /matters/:id/stage` — Change stage of a case (writes to `AuditLog`; OWNER, ADMIN only).
*   `PATCH /matters/:id/status` — Archive/close/reopen matter (writes to `AuditLog`; OWNER, ADMIN only).
*   `POST /matters/:id/associates` — Assign an associate (OWNER, ADMIN only).
*   `DELETE /matters/:id/associates/:associateId` — Unassign an associate (OWNER, ADMIN only).
*   `POST /matters/:id/parties` — Add/create a litigant/party (OWNER, ADMIN only).
*   `GET /matters/:id/timeline` — Retrieve unified matter timeline (assigned only if ASSOCIATE).
*   `GET /matters/:id/summary-report` — Download dynamically generated, dependency-free PDF report (OWNER, ADMIN only).

#### Hearings (`HearingsController` under `/api`)
*   `POST /matters/:matterId/hearings` — Log a hearing outcome. If a `nextDate` is specified, triggers the *Tareekh-e-Pesh* transactional engine.
*   `GET /matters/:matterId/hearings` — List all hearings for a case.
*   `PATCH /hearings/:id` — Update/edit a hearing before it occurs or log its outcome.
*   `POST /hearings/:id/attendees` — Log associates who attended (OWNER, ADMIN only).

#### Tasks (`TasksController` under `/api/tasks`)
*   `POST /tasks` — Create a task (can be independent or matter-scoped). Associates can only assign tasks to themselves.
*   `GET /tasks` — List tasks, filterable by `matterId`, `status`, and `assignedToId`. Associates see own tasks only.
*   `GET /tasks/:id` — Task details (assignee, assigner, OWNER, ADMIN).
*   `PATCH /tasks/:id/status` — Update task status. If a task is `UNDER_REVIEW`, associates cannot force-complete it without admin approval.
*   `POST /tasks/:id/notes` — Add comments/notes to a task (assignee, assigner, or matter associates).
*   `POST /tasks/:id/attachments` — Upload completion proof (assignee only).
*   `PATCH /tasks/:id/complete` — Mark complete and add completion notes (assignee only).

#### Case Documents (`CaseDocumentsController` under `/api`)
*   `POST /matters/:matterId/documents` — Create a logical document with its initial file version.
*   `POST /case-documents/:id/versions` — Upload a new revision. Transactionally marks previous versions as inactive (`isCurrent = false`) and marks the new version as active (`isCurrent = true`).
*   `GET /case-documents/:id` — Fetch the current active version.
*   `GET /case-documents/:id/versions` — List the full revision history.

---

### 11.3 Core API Workflows

#### Scenario A: Setting up a Case
```
[Client/Matter Info] ──► POST /matters ──► Default CourtStage suggested
                              │
                    POST /matters/:id/associates ──► Associate assigned
                              │
                    POST /matters/:id/parties ──► Litigant links created
```

#### Scenario B: The "Tareekh-e-Pesh" (Hearing Outcome) Cycle
```
GET /matters/:id/hearings (shows SCHEDULED hearing)
                     │
PATCH /hearings/:id (Log outcome: status = HELD, proceedingsSummary, orderSheetUrl, nextDate, nextPurpose)
                     │
           [DB Transaction]
            ├── Update current hearing record
            ├── Insert NEW Hearing (hearingDate = nextDate, status = SCHEDULED, purpose = nextPurpose)
            └── Invoke NotificationsService.scheduleHearingReminder()
```

#### Scenario C: Task Delegation & Review
```
POST /tasks (Admin assigns to Associate; status = PENDING)
                  │
PATCH /tasks/:id/status (Associate moves to IN_PROGRESS)
                  │
POST /tasks/:id/notes (Collaborators discuss progress)
                  │
POST /tasks/:id/attachments (Associate uploads proof scans)
                  │
PATCH /tasks/:id/status (Associate moves to UNDER_REVIEW)
                  │
PATCH /tasks/:id/status (Admin reviews and moves to COMPLETED)
```

#### Scenario D: Document Versioning
```
POST /matters/:id/documents (creates document & version 1: isCurrent=true)
                  │
POST /case-documents/:id/versions (uploads version 2)
                  │
           [DB Transaction]
            ├── Set version 1 -> isCurrent=false
            ├── Insert version 2 -> isCurrent=true, versionNumber = 2
            └── Create AuditLog entry ("DOCUMENT_VERSIONED")
```

#### Scenario E: Matter Timeline & Reporting
```
GET /matters/:id/timeline
       ├── Read Hearings (outcome logs)
       ├── Read Completed Tasks (from updatedAt)
       ├── Read CaseDocumentVersions (file revisions)
       └── Read AuditLogs (stage changes)
       └── [Sort all chronologically in memory] ──► Render unified feed
                                                          │
                                            GET /matters/:id/summary-report
                                                          ▼
                                            Dynamically generate PDF Stream
```