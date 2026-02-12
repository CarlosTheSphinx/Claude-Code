// ============================================================
// Checklist Service — Core business logic
//
// Drop into: server/services/checklist-service.ts
// (or server/checklist/checklist-service.ts)
//
// Assumes Drizzle ORM with the schema from db/checklist-schema.ts
// and a `db` instance exported from your db connection module.
// ============================================================

import { eq, and, sql } from "drizzle-orm";
import { db } from "@db"; // adjust import to match your project
import {
  loanChecklists,
  checklistItems,
  documentUploads,
  checklistActivity,
} from "@db/schema"; // adjust to wherever you merge the schema
import {
  resolveChecklistItems,
  getChecklistTemplate,
} from "../../shared/loan-program-checklists";
import type {
  LoanProgram,
  LoanChecklist,
  ChecklistItem,
  ChecklistProgress,
  ChecklistItemStatus,
  UpdateChecklistItemRequest,
} from "../../shared/types";

// ──────────────────────────────────────────────────────────────
// CREATE — generate a new checklist for a loan
// ──────────────────────────────────────────────────────────────

export async function createChecklistForLoan(
  loanId: number,
  loanProgram: LoanProgram,
  loanData: Record<string, unknown> = {},
): Promise<LoanChecklist> {
  // Prevent duplicate checklists for the same loan
  const existing = await db
    .select()
    .from(loanChecklists)
    .where(eq(loanChecklists.loanId, loanId))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Checklist already exists for loan ${loanId}. Use regenerate instead.`);
  }

  // Resolve which template items apply (evaluates conditionals)
  const templateItems = resolveChecklistItems(loanProgram, loanData);
  const template = getChecklistTemplate(loanProgram);

  // Insert the checklist header
  const [checklist] = await db
    .insert(loanChecklists)
    .values({ loanId, loanProgram })
    .returning();

  // Bulk-insert all resolved items
  if (templateItems.length > 0) {
    await db.insert(checklistItems).values(
      templateItems.map((t) => ({
        checklistId: checklist.id,
        itemKey: t.key,
        name: t.name,
        description: t.description,
        category: t.category,
        section: t.section,
        assignedTo: t.assignedTo,
        required: t.required,
        status: "pending" as const,
        sortOrder: t.sortOrder,
      })),
    );
  }

  return getChecklistByLoanId(loanId);
}

// ──────────────────────────────────────────────────────────────
// READ — fetch full checklist with items, documents, progress
// ──────────────────────────────────────────────────────────────

export async function getChecklistByLoanId(
  loanId: number,
): Promise<LoanChecklist> {
  const [checklist] = await db
    .select()
    .from(loanChecklists)
    .where(eq(loanChecklists.loanId, loanId))
    .limit(1);

  if (!checklist) {
    throw new Error(`No checklist found for loan ${loanId}`);
  }

  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.checklistId, checklist.id))
    .orderBy(checklistItems.sortOrder);

  // Fetch documents for all items in one query
  const itemIds = items.map((i) => i.id);
  const docs =
    itemIds.length > 0
      ? await db
          .select()
          .from(documentUploads)
          .where(
            sql`${documentUploads.checklistItemId} IN (${sql.join(
              itemIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];

  // Group documents by checklist item
  const docsByItem = new Map<number, typeof docs>();
  for (const doc of docs) {
    const list = docsByItem.get(doc.checklistItemId) ?? [];
    list.push(doc);
    docsByItem.set(doc.checklistItemId, list);
  }

  // Build the full item objects
  const fullItems: ChecklistItem[] = items.map((item) => ({
    id: item.id,
    checklistId: item.checklistId,
    itemKey: item.itemKey,
    name: item.name,
    description: item.description ?? "",
    category: item.category as ChecklistItem["category"],
    section: item.section,
    assignedTo: item.assignedTo as ChecklistItem["assignedTo"],
    required: item.required,
    status: item.status as ChecklistItemStatus,
    dueDate: item.dueDate?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    reviewedBy: item.reviewedBy,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    adminNotes: item.adminNotes,
    borrowerNotes: item.borrowerNotes,
    sortOrder: item.sortOrder,
    documents: (docsByItem.get(item.id) ?? []).map((d) => ({
      id: d.id,
      checklistItemId: d.checklistItemId,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedBy: d.uploadedBy,
      uploadedByName: null, // join with users table if needed
      uploadedAt: d.uploadedAt.toISOString(),
      status: d.status as "pending_review" | "approved" | "rejected",
      reviewNotes: d.reviewNotes,
    })),
  }));

  const progress = computeProgress(fullItems);

  return {
    id: checklist.id,
    loanId: checklist.loanId,
    loanProgram: checklist.loanProgram as LoanProgram,
    createdAt: checklist.createdAt.toISOString(),
    updatedAt: checklist.updatedAt.toISOString(),
    items: fullItems,
    progress,
  };
}

// ──────────────────────────────────────────────────────────────
// UPDATE — change status, notes, due dates on a single item
// ──────────────────────────────────────────────────────────────

export async function updateChecklistItem(
  itemId: number,
  update: UpdateChecklistItemRequest,
  performedBy: number,
  performedByRole: "admin" | "borrower" | "broker",
): Promise<ChecklistItem> {
  const [current] = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.id, itemId))
    .limit(1);

  if (!current) throw new Error(`Checklist item ${itemId} not found`);

  const values: Record<string, unknown> = {};
  if (update.status) {
    values.status = update.status;
    if (
      update.status === "completed" ||
      update.status === "approved"
    ) {
      values.completedAt = new Date();
    }
    if (update.status === "approved" || update.status === "rejected") {
      values.reviewedBy = performedBy;
      values.reviewedAt = new Date();
    }
  }
  if (update.adminNotes !== undefined) values.adminNotes = update.adminNotes;
  if (update.borrowerNotes !== undefined) values.borrowerNotes = update.borrowerNotes;
  if (update.dueDate !== undefined) {
    values.dueDate = update.dueDate ? new Date(update.dueDate) : null;
  }

  const [updated] = await db
    .update(checklistItems)
    .set(values)
    .where(eq(checklistItems.id, itemId))
    .returning();

  // Record activity
  if (update.status) {
    await db.insert(checklistActivity).values({
      checklistItemId: itemId,
      action: "status_change",
      fromStatus: current.status,
      toStatus: update.status,
      performedBy,
      performedByRole,
    });
  }

  // Update the parent checklist's updatedAt timestamp
  await db
    .update(loanChecklists)
    .set({ updatedAt: new Date() })
    .where(eq(loanChecklists.id, current.checklistId));

  // Return the full item with documents
  return (await getChecklistItemById(itemId))!;
}

// ──────────────────────────────────────────────────────────────
// DOCUMENTS — upload and review
// ──────────────────────────────────────────────────────────────

export async function addDocumentUpload(
  checklistItemId: number,
  file: { fileName: string; fileUrl: string; fileSize: number; mimeType: string },
  uploadedBy: number,
): Promise<void> {
  const [item] = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.id, checklistItemId))
    .limit(1);

  if (!item) throw new Error(`Checklist item ${checklistItemId} not found`);

  await db.insert(documentUploads).values({
    checklistItemId,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    uploadedBy,
    status: "pending_review",
  });

  // Auto-advance item status to "uploaded" if currently pending
  if (item.status === "pending" || item.status === "rejected") {
    await db
      .update(checklistItems)
      .set({ status: "uploaded" })
      .where(eq(checklistItems.id, checklistItemId));
  }

  await db.insert(checklistActivity).values({
    checklistItemId,
    action: "document_uploaded",
    fromStatus: item.status,
    toStatus: "uploaded",
    performedBy: uploadedBy,
    performedByRole: "borrower", // could be dynamic
    note: `Uploaded: ${file.fileName}`,
  });
}

export async function reviewDocument(
  documentId: number,
  reviewerId: number,
  status: "approved" | "rejected",
  reviewNotes?: string,
): Promise<void> {
  const [doc] = await db
    .select()
    .from(documentUploads)
    .where(eq(documentUploads.id, documentId))
    .limit(1);

  if (!doc) throw new Error(`Document ${documentId} not found`);

  await db
    .update(documentUploads)
    .set({ status, reviewNotes: reviewNotes ?? null })
    .where(eq(documentUploads.id, documentId));

  // If all documents for this item are approved, mark item as approved
  if (status === "approved") {
    const allDocs = await db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.checklistItemId, doc.checklistItemId));

    const allApproved = allDocs.every(
      (d) => d.id === documentId || d.status === "approved",
    );

    if (allApproved) {
      await db
        .update(checklistItems)
        .set({
          status: "approved",
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(checklistItems.id, doc.checklistItemId));
    } else {
      await db
        .update(checklistItems)
        .set({ status: "in_review" })
        .where(eq(checklistItems.id, doc.checklistItemId));
    }
  }

  if (status === "rejected") {
    await db
      .update(checklistItems)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(checklistItems.id, doc.checklistItemId));
  }

  await db.insert(checklistActivity).values({
    checklistItemId: doc.checklistItemId,
    action: "review",
    toStatus: status,
    performedBy: reviewerId,
    performedByRole: "admin",
    note: reviewNotes ?? `Document ${status}`,
  });
}

// ──────────────────────────────────────────────────────────────
// WAIVE — admin can waive a non-critical item
// ──────────────────────────────────────────────────────────────

export async function waiveChecklistItem(
  itemId: number,
  adminId: number,
  reason: string,
): Promise<void> {
  await db
    .update(checklistItems)
    .set({
      status: "waived",
      adminNotes: reason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    })
    .where(eq(checklistItems.id, itemId));

  await db.insert(checklistActivity).values({
    checklistItemId: itemId,
    action: "status_change",
    toStatus: "waived",
    performedBy: adminId,
    performedByRole: "admin",
    note: `Waived: ${reason}`,
  });
}

// ──────────────────────────────────────────────────────────────
// ACTIVITY LOG — for timeline display
// ──────────────────────────────────────────────────────────────

export async function getChecklistActivity(checklistItemId: number) {
  return db
    .select()
    .from(checklistActivity)
    .where(eq(checklistActivity.checklistItemId, checklistItemId))
    .orderBy(checklistActivity.createdAt);
}

export async function getFullChecklistActivity(loanId: number) {
  const [checklist] = await db
    .select()
    .from(loanChecklists)
    .where(eq(loanChecklists.loanId, loanId))
    .limit(1);

  if (!checklist) return [];

  const items = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(eq(checklistItems.checklistId, checklist.id));

  const itemIds = items.map((i) => i.id);
  if (itemIds.length === 0) return [];

  return db
    .select()
    .from(checklistActivity)
    .where(
      sql`${checklistActivity.checklistItemId} IN (${sql.join(
        itemIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    )
    .orderBy(checklistActivity.createdAt);
}

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

function computeProgress(items: ChecklistItem[]): ChecklistProgress {
  const total = items.length;
  const completed = items.filter(
    (i) =>
      i.status === "completed" ||
      i.status === "approved" ||
      i.status === "waived" ||
      i.status === "not_applicable",
  ).length;
  const pending = items.filter((i) => i.status === "pending").length;
  const inReview = items.filter(
    (i) => i.status === "uploaded" || i.status === "in_review",
  ).length;
  const rejected = items.filter((i) => i.status === "rejected").length;
  const waived = items.filter((i) => i.status === "waived").length;

  return {
    total,
    completed,
    pending,
    inReview,
    rejected,
    waived,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

async function getChecklistItemById(
  itemId: number,
): Promise<ChecklistItem | null> {
  const [item] = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.id, itemId))
    .limit(1);

  if (!item) return null;

  const docs = await db
    .select()
    .from(documentUploads)
    .where(eq(documentUploads.checklistItemId, itemId));

  return {
    id: item.id,
    checklistId: item.checklistId,
    itemKey: item.itemKey,
    name: item.name,
    description: item.description ?? "",
    category: item.category as ChecklistItem["category"],
    section: item.section,
    assignedTo: item.assignedTo as ChecklistItem["assignedTo"],
    required: item.required,
    status: item.status as ChecklistItemStatus,
    dueDate: item.dueDate?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    reviewedBy: item.reviewedBy,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    adminNotes: item.adminNotes,
    borrowerNotes: item.borrowerNotes,
    sortOrder: item.sortOrder,
    documents: docs.map((d) => ({
      id: d.id,
      checklistItemId: d.checklistItemId,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedBy: d.uploadedBy,
      uploadedByName: null,
      uploadedAt: d.uploadedAt.toISOString(),
      status: d.status as "pending_review" | "approved" | "rejected",
      reviewNotes: d.reviewNotes,
    })),
  };
}
