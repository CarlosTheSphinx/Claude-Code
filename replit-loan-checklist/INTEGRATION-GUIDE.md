# Loan Checklist Integration Guide

## Overview

This is a **shared loan checklist system** where admin and borrower/broker see the **exact same list** of required documents and tasks. The admin sees review/waive controls; the borrower sees upload/complete controls. Both see real-time status and progress.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   SHARED LAYER                           │
│  shared/types.ts           — TypeScript types            │
│  shared/loan-program-checklists.ts — DSCR & RTL templates│
└──────────────────────────┬───────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────┴────────┐                 ┌──────────┴──────────┐
│    SERVER      │                 │      CLIENT         │
│                │                 │                     │
│ db/schema      │  ◄── REST ──►  │ hooks/useChecklist  │
│ services/      │    /api/       │ components/         │
│ routes/        │  checklists    │   LoanChecklist     │
│                │                │   ChecklistItemRow  │
│                │                │ pages/              │
│                │                │   AdminPipeline     │
│                │                │   BorrowerDashboard │
└────────────────┘                └─────────────────────┘
```

## Step-by-Step Integration

### 1. Install dependencies (if not already present)

```bash
npm install multer
npm install -D @types/multer
```

### 2. Add the database schema

Copy the table definitions from `db/checklist-schema.ts` into your existing schema file (likely `shared/schema.ts` or `db/schema.ts`).

Then push the migration:

```bash
npx drizzle-kit push
```

### 3. Copy the shared types and templates

Copy these files into your project's `shared/` directory:
- `shared/types.ts`
- `shared/loan-program-checklists.ts`

### 4. Copy the server files

Copy into your `server/` directory:
- `server/services/checklist-service.ts`
- `server/routes/checklist-routes.ts`

**Fix the imports** in `checklist-service.ts` to match your project:
```ts
// Change this:
import { db } from "@db";
import { loanChecklists, ... } from "@db/schema";

// To match your actual paths, e.g.:
import { db } from "../../db";
import { loanChecklists, ... } from "../../shared/schema";
```

### 5. Register the routes

In your main server file (e.g., `server/index.ts` or `server/routes.ts`):

```ts
import checklistRoutes from "./routes/checklist-routes";

// After your auth middleware is set up:
app.use("/api/checklists", checklistRoutes);
```

Make sure your auth middleware populates `req.user` with `{ id, role }` where `role` is `"admin"`, `"borrower"`, or `"broker"`.

### 6. Create the uploads directory

```bash
mkdir -p uploads/checklist-docs
```

And serve it statically:
```ts
app.use("/uploads", express.static("uploads"));
```

### 7. Copy the client files

Copy into your `client/` directory:
- `client/hooks/useChecklist.ts`
- `client/components/LoanChecklist.tsx`
- `client/components/ChecklistItemRow.tsx`
- `client/pages/AdminPipelineChecklist.tsx`
- `client/pages/BorrowerDashboard.tsx`

### 8. Wire into your existing pages

**Admin side** — in your deal/loan detail page:

```tsx
import AdminPipelineChecklist from "./pages/AdminPipelineChecklist";

// Inside your deal detail component:
<AdminPipelineChecklist
  loanId={deal.id}
  loanProgram={deal.loanProgram}   // "DSCR" or "RTL"
  loanData={{
    transactionType: deal.transactionType,  // "purchase" or "refinance"
    // ... any other fields used by conditionals
  }}
/>
```

**Borrower/broker side** — in your borrower portal:

```tsx
import BorrowerDashboard from "./pages/BorrowerDashboard";

// Inside your borrower loan view:
<BorrowerDashboard
  loanId={loan.id}
  viewerRole={currentUser.role}   // "borrower" or "broker"
  borrowerName={currentUser.name}
/>
```

## How It Works

### Single source of truth

Both the admin `AdminPipelineChecklist` and borrower `BorrowerDashboard` pages use the **same** `LoanChecklist` component. They hit the **same** API endpoint (`GET /api/checklists/loan/:loanId`). The only difference is the `viewerRole` prop:

- `viewerRole="admin"` → shows Approve/Reject/Waive buttons
- `viewerRole="borrower"` → shows Upload/Complete buttons

### Checklist creation flow

1. Admin converts a quote to a deal (or creates a loan)
2. Admin clicks "Generate DSCR Checklist" (or RTL)
3. The system evaluates conditionals against loan data (e.g., purchase vs refinance) and creates only the relevant items
4. Borrower immediately sees the checklist in their portal

### Document flow

```
Borrower uploads file
  → Item status: "pending" → "uploaded"
  → Document status: "pending_review"

Admin reviews document
  → If approved: document "approved", item "approved" (if all docs approved)
  → If rejected: document "rejected", item "rejected" + admin feedback shown to borrower

Borrower re-uploads after rejection
  → Item status: "rejected" → "uploaded"
  → New document: "pending_review"
```

### Task flow

```
Borrower clicks "Mark Complete"
  → Item status: "pending" → "completed"
  → Admin sees it as complete in their view
```

### Conditional items

Some items only appear for certain loan configurations:
- "Purchase Contract" — only for `transactionType: "purchase"`
- "Payoff Statement" — only for `transactionType: "refinance"`
- "Wire Earnest Money" — only for purchases

Pass your loan data when creating the checklist and only the relevant items will be generated.

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/checklists/templates` | any | List all program templates |
| GET | `/api/checklists/templates/:program` | any | Get template for DSCR or RTL |
| POST | `/api/checklists` | admin | Create checklist for a loan |
| GET | `/api/checklists/loan/:loanId` | any | Get full checklist with items & docs |
| PATCH | `/api/checklists/items/:itemId` | any | Update item status/notes |
| POST | `/api/checklists/items/:itemId/complete` | borrower/broker | Mark task complete |
| POST | `/api/checklists/items/:itemId/waive` | admin | Waive an item |
| POST | `/api/checklists/items/:itemId/upload` | borrower/broker | Upload a document |
| POST | `/api/checklists/documents/:docId/review` | admin | Approve/reject a document |
| GET | `/api/checklists/items/:itemId/activity` | any | Get activity log for an item |
| GET | `/api/checklists/loan/:loanId/activity` | any | Get all activity for a loan |

## Adding a New Loan Program

1. Open `shared/loan-program-checklists.ts`
2. Add your new program's type to `LoanProgram` in `shared/types.ts` (e.g., `"BRIDGE"`)
3. Define the sections and items array following the DSCR/RTL pattern
4. Add it to the `CHECKLIST_TEMPLATES` record
5. That's it — everything else (API, UI, hooks) works automatically

## File Structure

```
replit-loan-checklist/
├── shared/
│   ├── types.ts                          # Shared TypeScript types
│   └── loan-program-checklists.ts        # DSCR + RTL checklist templates
├── db/
│   └── checklist-schema.ts               # Drizzle ORM table definitions
├── server/
│   ├── services/
│   │   └── checklist-service.ts          # Business logic (CRUD, review, waive)
│   └── routes/
│       └── checklist-routes.ts           # Express API routes
├── client/
│   ├── hooks/
│   │   └── useChecklist.ts               # React data fetching hook
│   ├── components/
│   │   ├── LoanChecklist.tsx             # Main checklist (shared component)
│   │   └── ChecklistItemRow.tsx          # Individual item row
│   └── pages/
│       ├── AdminPipelineChecklist.tsx     # Admin deal detail panel
│       └── BorrowerDashboard.tsx         # Borrower portal view
└── INTEGRATION-GUIDE.md                  # This file
```
