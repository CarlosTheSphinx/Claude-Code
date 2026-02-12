// ============================================================
// Loan Program Checklist Templates
// Defines exactly which documents and tasks are required for
// each loan program. Add new programs by adding a new entry.
//
// Drop into: shared/loan-program-checklists.ts
// ============================================================

import type { ChecklistTemplate, ChecklistTemplateItem, LoanProgram } from "./types";

// ──────────────────────────────────────────────────────────────
// DSCR (Debt Service Coverage Ratio) Loan
// ──────────────────────────────────────────────────────────────

const DSCR_SECTIONS = [
  "Borrower & Entity",
  "Property Documents",
  "Financial Documents",
  "Insurance & Title",
  "Loan Execution",
] as const;

const dscrItems: ChecklistTemplateItem[] = [
  // ── Borrower & Entity ──
  {
    key: "dscr_loan_application",
    name: "Completed Loan Application",
    description: "Fill out the full loan application form with borrower and property details.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 1,
  },
  {
    key: "dscr_government_id",
    name: "Government-Issued Photo ID",
    description: "Valid driver's license or passport for all guarantors/signers.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 2,
  },
  {
    key: "dscr_entity_docs",
    name: "Entity Documents",
    description: "Articles of Organization, Operating Agreement, EIN letter, and Certificate of Good Standing.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 3,
  },
  {
    key: "dscr_credit_authorization",
    name: "Credit Authorization Form",
    description: "Signed authorization to pull credit for all guarantors.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 4,
  },
  {
    key: "dscr_authorize_credit_task",
    name: "Authorize Credit Pull",
    description: "Sign and return the credit authorization form so we can pull your credit report.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 5,
  },

  // ── Property Documents ──
  {
    key: "dscr_purchase_contract",
    name: "Executed Purchase Contract",
    description: "Fully executed purchase agreement for the subject property.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Property Documents",
    sortOrder: 10,
    conditional: { field: "transactionType", value: "purchase" },
  },
  {
    key: "dscr_payoff_statement",
    name: "Current Mortgage Payoff Statement",
    description: "Payoff statement from current lender showing exact payoff amount and per-diem.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Property Documents",
    sortOrder: 11,
    conditional: { field: "transactionType", value: "refinance" },
  },
  {
    key: "dscr_rent_roll",
    name: "Rent Roll / Lease Agreements",
    description: "Current rent roll and copies of all executed leases for the property.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Property Documents",
    sortOrder: 12,
  },
  {
    key: "dscr_appraisal",
    name: "Property Appraisal",
    description: "Full appraisal report (ordered by lender). Borrower pays the appraisal fee upfront.",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Property Documents",
    sortOrder: 13,
  },
  {
    key: "dscr_schedule_appraisal_task",
    name: "Schedule & Pay for Appraisal",
    description: "Pay the appraisal deposit so we can order the appraisal for the subject property.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Property Documents",
    sortOrder: 14,
  },
  {
    key: "dscr_property_photos",
    name: "Property Photos",
    description: "Interior and exterior photos of the property (if available).",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Property Documents",
    sortOrder: 15,
  },

  // ── Financial Documents ──
  {
    key: "dscr_bank_statements",
    name: "Bank Statements (2 Months)",
    description: "Most recent 2 months of bank statements showing reserves/liquidity.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Financial Documents",
    sortOrder: 20,
  },
  {
    key: "dscr_proof_of_funds",
    name: "Proof of Funds for Down Payment / Closing Costs",
    description: "Documentation showing sufficient funds available for down payment and closing costs.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Financial Documents",
    sortOrder: 21,
    conditional: { field: "transactionType", value: "purchase" },
  },
  {
    key: "dscr_track_record",
    name: "Real Estate Owned (REO) Schedule",
    description: "List of all investment properties currently owned with addresses, values, and loan balances.",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Financial Documents",
    sortOrder: 22,
  },

  // ── Insurance & Title ──
  {
    key: "dscr_property_insurance",
    name: "Property Insurance Binder",
    description: "Evidence of property/hazard insurance with lender listed as mortgagee/loss payee.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Insurance & Title",
    sortOrder: 30,
  },
  {
    key: "dscr_flood_insurance",
    name: "Flood Insurance (if applicable)",
    description: "Flood insurance policy if property is in a FEMA flood zone.",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Insurance & Title",
    sortOrder: 31,
  },
  {
    key: "dscr_title_commitment",
    name: "Title Commitment / Preliminary Title Report",
    description: "Title commitment from the title company showing clear title.",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Insurance & Title",
    sortOrder: 32,
  },

  // ── Loan Execution ──
  {
    key: "dscr_review_term_sheet",
    name: "Review Term Sheet / LOI",
    description: "Review the term sheet outlining rate, fees, and loan terms.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 40,
  },
  {
    key: "dscr_sign_term_sheet",
    name: "Sign Term Sheet / LOI",
    description: "Electronically sign the term sheet via PandaDoc to lock in terms.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 41,
  },
  {
    key: "dscr_signed_term_sheet",
    name: "Signed Term Sheet / LOI",
    description: "Executed term sheet document (auto-generated after signing).",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Loan Execution",
    sortOrder: 42,
  },
  {
    key: "dscr_wire_deposit",
    name: "Wire Earnest Money / Deposit",
    description: "Wire the required deposit to the escrow/title company.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 43,
    conditional: { field: "transactionType", value: "purchase" },
  },
  {
    key: "dscr_closing_disclosure",
    name: "Review & Sign Closing Disclosure",
    description: "Review and sign the final Closing Disclosure before funding.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 44,
  },
];

const DSCR_TEMPLATE: ChecklistTemplate = {
  loanProgram: "DSCR",
  programLabel: "DSCR Rental Loan",
  sections: [...DSCR_SECTIONS],
  items: dscrItems,
};

// ──────────────────────────────────────────────────────────────
// RTL (Residential Transitional Loan) — Fix & Flip / Bridge
// ──────────────────────────────────────────────────────────────

const RTL_SECTIONS = [
  "Borrower & Entity",
  "Property & Acquisition",
  "Renovation / Construction",
  "Financial Documents",
  "Insurance & Title",
  "Loan Execution",
] as const;

const rtlItems: ChecklistTemplateItem[] = [
  // ── Borrower & Entity ──
  {
    key: "rtl_loan_application",
    name: "Completed Loan Application",
    description: "Fill out the full loan application with borrower, property, and project details.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 1,
  },
  {
    key: "rtl_government_id",
    name: "Government-Issued Photo ID",
    description: "Valid driver's license or passport for all guarantors/signers.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 2,
  },
  {
    key: "rtl_entity_docs",
    name: "Entity Documents",
    description: "Articles of Organization, Operating Agreement, EIN letter, and Certificate of Good Standing.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 3,
  },
  {
    key: "rtl_credit_authorization",
    name: "Credit Authorization Form",
    description: "Signed authorization to pull credit for all guarantors.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 4,
  },
  {
    key: "rtl_authorize_credit_task",
    name: "Authorize Credit Pull",
    description: "Sign and return the credit authorization form.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 5,
  },
  {
    key: "rtl_experience_resume",
    name: "Rehab / Flip Experience Resume",
    description: "List of past fix & flip or construction projects with addresses, purchase price, rehab cost, and sale price.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Borrower & Entity",
    sortOrder: 6,
  },

  // ── Property & Acquisition ──
  {
    key: "rtl_purchase_contract",
    name: "Executed Purchase Contract",
    description: "Fully executed purchase contract for the subject property.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Property & Acquisition",
    sortOrder: 10,
    conditional: { field: "transactionType", value: "purchase" },
  },
  {
    key: "rtl_settlement_statement",
    name: "Settlement Statement (HUD-1 / ALTA)",
    description: "Closing statement from original purchase if recently acquired.",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Property & Acquisition",
    sortOrder: 11,
    conditional: { field: "transactionType", value: "refinance" },
  },
  {
    key: "rtl_property_photos",
    name: "Property Photos (Before Renovation)",
    description: "Interior and exterior photos showing current as-is condition.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Property & Acquisition",
    sortOrder: 12,
  },
  {
    key: "rtl_appraisal",
    name: "Appraisal (As-Is & ARV)",
    description: "Dual-value appraisal showing both as-is value and after-repair value (ARV). Ordered by lender.",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Property & Acquisition",
    sortOrder: 13,
  },
  {
    key: "rtl_schedule_appraisal_task",
    name: "Schedule & Pay for Appraisal",
    description: "Pay the appraisal deposit so we can order the dual-value appraisal.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Property & Acquisition",
    sortOrder: 14,
  },

  // ── Renovation / Construction ──
  {
    key: "rtl_scope_of_work",
    name: "Detailed Scope of Work",
    description: "Itemized renovation budget broken down by trade/category with line-item costs.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Renovation / Construction",
    sortOrder: 20,
  },
  {
    key: "rtl_contractor_bids",
    name: "Contractor Bids / Estimates",
    description: "Licensed contractor bids or estimates supporting the scope of work.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Renovation / Construction",
    sortOrder: 21,
  },
  {
    key: "rtl_contractor_license",
    name: "Contractor License & Insurance",
    description: "Copy of general contractor license and liability insurance certificate.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Renovation / Construction",
    sortOrder: 22,
  },
  {
    key: "rtl_draw_schedule",
    name: "Draw Schedule",
    description: "Proposed draw/disbursement schedule tied to renovation milestones.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Renovation / Construction",
    sortOrder: 23,
  },
  {
    key: "rtl_permits",
    name: "Building Permits (if applicable)",
    description: "Required building/renovation permits from the local municipality.",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Renovation / Construction",
    sortOrder: 24,
  },
  {
    key: "rtl_submit_sow_task",
    name: "Submit Scope of Work for Review",
    description: "Upload your itemized scope of work and contractor bids for underwriting review.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Renovation / Construction",
    sortOrder: 25,
  },

  // ── Financial Documents ──
  {
    key: "rtl_bank_statements",
    name: "Bank Statements (2 Months)",
    description: "Most recent 2 months of bank statements showing liquidity for down payment, closing costs, and reserves.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Financial Documents",
    sortOrder: 30,
  },
  {
    key: "rtl_proof_of_funds",
    name: "Proof of Funds",
    description: "Documentation showing sufficient funds for acquisition, rehab carry, and reserves.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Financial Documents",
    sortOrder: 31,
  },

  // ── Insurance & Title ──
  {
    key: "rtl_builders_risk_insurance",
    name: "Builder's Risk / Vacant Property Insurance",
    description: "Builder's risk or vacant property insurance policy with lender as mortgagee.",
    category: "document",
    assignedTo: "borrower",
    required: true,
    section: "Insurance & Title",
    sortOrder: 40,
  },
  {
    key: "rtl_flood_insurance",
    name: "Flood Insurance (if applicable)",
    description: "Flood insurance policy if property is in a FEMA flood zone.",
    category: "document",
    assignedTo: "borrower",
    required: false,
    section: "Insurance & Title",
    sortOrder: 41,
  },
  {
    key: "rtl_title_commitment",
    name: "Title Commitment / Preliminary Title Report",
    description: "Title commitment from the title company showing clear title.",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Insurance & Title",
    sortOrder: 42,
  },

  // ── Loan Execution ──
  {
    key: "rtl_review_term_sheet",
    name: "Review Term Sheet / LOI",
    description: "Review the term sheet outlining rate, points, rehab holdback, and loan terms.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 50,
  },
  {
    key: "rtl_sign_term_sheet",
    name: "Sign Term Sheet / LOI",
    description: "Electronically sign the term sheet via PandaDoc to lock in terms.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 51,
  },
  {
    key: "rtl_signed_term_sheet",
    name: "Signed Term Sheet / LOI",
    description: "Executed term sheet document (auto-generated after signing).",
    category: "document",
    assignedTo: "admin",
    required: true,
    section: "Loan Execution",
    sortOrder: 52,
  },
  {
    key: "rtl_wire_deposit",
    name: "Wire Earnest Money / Deposit",
    description: "Wire the required deposit to the escrow/title company.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 53,
    conditional: { field: "transactionType", value: "purchase" },
  },
  {
    key: "rtl_closing_disclosure",
    name: "Review & Sign Closing Disclosure",
    description: "Review and sign the final Closing Disclosure before funding.",
    category: "task",
    assignedTo: "borrower",
    required: true,
    section: "Loan Execution",
    sortOrder: 54,
  },
];

const RTL_TEMPLATE: ChecklistTemplate = {
  loanProgram: "RTL",
  programLabel: "Fix & Flip / Bridge Loan",
  sections: [...RTL_SECTIONS],
  items: rtlItems,
};

// ──────────────────────────────────────────────────────────────
// Registry — look up templates by program
// ──────────────────────────────────────────────────────────────

const CHECKLIST_TEMPLATES: Record<LoanProgram, ChecklistTemplate> = {
  DSCR: DSCR_TEMPLATE,
  RTL: RTL_TEMPLATE,
};

export function getChecklistTemplate(program: LoanProgram): ChecklistTemplate {
  const template = CHECKLIST_TEMPLATES[program];
  if (!template) throw new Error(`No checklist template for program: ${program}`);
  return template;
}

export function getAllTemplates(): ChecklistTemplate[] {
  return Object.values(CHECKLIST_TEMPLATES);
}

/**
 * Resolve which items apply for a specific loan by evaluating conditionals
 * against the loan data. Items with no conditional always apply.
 */
export function resolveChecklistItems(
  program: LoanProgram,
  loanData: Record<string, unknown> = {},
): ChecklistTemplateItem[] {
  const template = getChecklistTemplate(program);
  return template.items.filter((item) => {
    if (!item.conditional) return true;
    const actual = String(loanData[item.conditional.field] ?? "").toLowerCase();
    return actual === item.conditional.value.toLowerCase();
  });
}

export { CHECKLIST_TEMPLATES };
