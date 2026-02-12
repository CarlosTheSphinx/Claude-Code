// ============================================================
// Drizzle ORM Schema — Loan Checklist Tables
//
// Add these table definitions to your existing shared/schema.ts
// (or db/schema.ts) in Replit, alongside your existing tables
// like esignEnvelopes, users, loans, etc.
// ============================================================

import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────────────────────
// loanChecklists — one checklist per loan/deal
// ──────────────────────────────────────────────────────────────

export const loanChecklists = pgTable(
  "loan_checklists",
  {
    id: serial("id").primaryKey(),
    loanId: integer("loan_id").notNull(), // FK to your loans/deals table
    loanProgram: varchar("loan_program", { length: 20 }).notNull(), // "DSCR" | "RTL"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    loanIdIdx: index("loan_checklists_loan_id_idx").on(table.loanId),
  }),
);

export const loanChecklistsRelations = relations(loanChecklists, ({ many }) => ({
  items: many(checklistItems),
}));

// ──────────────────────────────────────────────────────────────
// checklistItems — individual documents or tasks in a checklist
// ──────────────────────────────────────────────────────────────

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: serial("id").primaryKey(),
    checklistId: integer("checklist_id")
      .notNull()
      .references(() => loanChecklists.id, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").default(""),
    category: varchar("category", { length: 20 }).notNull(), // "document" | "task"
    section: varchar("section", { length: 100 }).notNull(),
    assignedTo: varchar("assigned_to", { length: 20 }).notNull(), // "borrower" | "broker" | "admin"
    required: boolean("required").default(true).notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    reviewedBy: integer("reviewed_by"), // FK to your users table
    reviewedAt: timestamp("reviewed_at"),
    adminNotes: text("admin_notes"),
    borrowerNotes: text("borrower_notes"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    checklistIdIdx: index("checklist_items_checklist_id_idx").on(table.checklistId),
    statusIdx: index("checklist_items_status_idx").on(table.status),
  }),
);

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  checklist: one(loanChecklists, {
    fields: [checklistItems.checklistId],
    references: [loanChecklists.id],
  }),
  documents: many(documentUploads),
}));

// ──────────────────────────────────────────────────────────────
// documentUploads — files uploaded against a checklist item
// ──────────────────────────────────────────────────────────────

export const documentUploads = pgTable(
  "document_uploads",
  {
    id: serial("id").primaryKey(),
    checklistItemId: integer("checklist_item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 500 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(), // bytes
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    uploadedBy: integer("uploaded_by").notNull(), // FK to users table
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    status: varchar("status", { length: 30 }).default("pending_review").notNull(),
    reviewNotes: text("review_notes"),
  },
  (table) => ({
    checklistItemIdIdx: index("document_uploads_checklist_item_id_idx").on(
      table.checklistItemId,
    ),
  }),
);

export const documentUploadsRelations = relations(documentUploads, ({ one }) => ({
  checklistItem: one(checklistItems, {
    fields: [documentUploads.checklistItemId],
    references: [checklistItems.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// checklistActivity — audit log for status changes
// ──────────────────────────────────────────────────────────────

export const checklistActivity = pgTable(
  "checklist_activity",
  {
    id: serial("id").primaryKey(),
    checklistItemId: integer("checklist_item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(), // "status_change", "document_uploaded", "note_added", "review"
    fromStatus: varchar("from_status", { length: 30 }),
    toStatus: varchar("to_status", { length: 30 }),
    performedBy: integer("performed_by").notNull(), // FK to users
    performedByRole: varchar("performed_by_role", { length: 20 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    checklistItemIdIdx: index("checklist_activity_item_id_idx").on(
      table.checklistItemId,
    ),
  }),
);

export const checklistActivityRelations = relations(checklistActivity, ({ one }) => ({
  checklistItem: one(checklistItems, {
    fields: [checklistActivity.checklistItemId],
    references: [checklistItems.id],
  }),
}));
