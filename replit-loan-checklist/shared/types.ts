// ============================================================
// Shared Types — used by server AND client
// Drop this file into: shared/types.ts (or wherever your
// shared types live in Replit)
// ============================================================

export type LoanProgram = "DSCR" | "RTL";

export type ChecklistItemCategory = "document" | "task";

export type AssignedRole = "borrower" | "broker" | "admin";

export type ChecklistItemStatus =
  | "pending"
  | "uploaded"
  | "in_review"
  | "approved"
  | "rejected"
  | "completed"
  | "waived"
  | "not_applicable";

export type DocumentUploadStatus =
  | "pending_review"
  | "approved"
  | "rejected";

// ---------- Template definitions (what a program REQUIRES) ----------

export interface ChecklistTemplateItem {
  key: string;                 // unique machine key, e.g. "dscr_rent_roll"
  name: string;                // human-readable label
  description: string;         // helper text shown to borrower
  category: ChecklistItemCategory;
  assignedTo: AssignedRole;
  required: boolean;
  section: string;             // grouping header, e.g. "Property Documents"
  sortOrder: number;
  /** If present, this item only applies when the loan data matches */
  conditional?: {
    field: string;             // field on the loan/quote, e.g. "transactionType"
    value: string;             // required value, e.g. "purchase"
  };
}

export interface ChecklistTemplate {
  loanProgram: LoanProgram;
  programLabel: string;
  sections: string[];          // ordered section names
  items: ChecklistTemplateItem[];
}

// ---------- Runtime checklist (what a specific loan HAS) ----------

export interface LoanChecklist {
  id: number;
  loanId: number;
  loanProgram: LoanProgram;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
  progress: ChecklistProgress;
}

export interface ChecklistItem {
  id: number;
  checklistId: number;
  itemKey: string;
  name: string;
  description: string;
  category: ChecklistItemCategory;
  section: string;
  assignedTo: AssignedRole;
  required: boolean;
  status: ChecklistItemStatus;
  dueDate: string | null;
  completedAt: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  borrowerNotes: string | null;
  sortOrder: number;
  documents: DocumentUpload[];
}

export interface DocumentUpload {
  id: number;
  checklistItemId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: number;
  uploadedByName: string | null;
  uploadedAt: string;
  status: DocumentUploadStatus;
  reviewNotes: string | null;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  pending: number;
  inReview: number;
  rejected: number;
  waived: number;
  percentage: number;
}

// ---------- API request / response shapes ----------

export interface CreateChecklistRequest {
  loanId: number;
  loanProgram: LoanProgram;
  /** Loan data used to evaluate conditional items */
  loanData?: Record<string, unknown>;
}

export interface UpdateChecklistItemRequest {
  status?: ChecklistItemStatus;
  adminNotes?: string;
  borrowerNotes?: string;
  dueDate?: string | null;
}

export interface ReviewDocumentRequest {
  status: "approved" | "rejected";
  reviewNotes?: string;
}
