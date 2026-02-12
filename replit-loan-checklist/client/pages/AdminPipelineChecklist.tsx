// ============================================================
// AdminPipelineChecklist — Admin's view of a loan's checklist
//
// This is the page/panel an admin sees when they click into a
// loan/deal in the pipeline. It shows the EXACT same checklist
// the borrower sees, plus admin-only actions (review, waive,
// set due dates, create checklist).
//
// Drop into: client/pages/AdminPipelineChecklist.tsx
// (or embed as a tab/panel in your existing deal detail page)
// ============================================================

import React, { useState } from "react";
import LoanChecklist from "../components/LoanChecklist";
import { useChecklist } from "../hooks/useChecklist";
import type { LoanProgram } from "../../shared/types";

interface Props {
  /** The loan/deal ID from your pipeline */
  loanId: number;
  /** The loan program (used when creating a new checklist) */
  loanProgram: LoanProgram;
  /** Loan data for conditional item evaluation */
  loanData?: Record<string, unknown>;
}

export default function AdminPipelineChecklist({
  loanId,
  loanProgram,
  loanData,
}: Props) {
  const {
    checklist,
    loading,
    error,
    createChecklist,
    updateItem,
    completeTask,
    uploadDocument,
    reviewDocument,
    waiveItem,
  } = useChecklist(loanId);

  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      await createChecklist(loanId, loanProgram, loanData);
    } catch (err: any) {
      alert(`Failed to create checklist: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">Loading checklist...</span>
      </div>
    );
  }

  if (error && !checklist) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-2">Error loading checklist</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  // No checklist yet — offer to create one
  if (!checklist) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mb-4">
          <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          No Checklist Created Yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Generate the document and task checklist for this{" "}
          <strong>{loanProgram === "DSCR" ? "DSCR Rental" : "Fix & Flip"}</strong> loan.
          The borrower will see the same checklist in their portal.
        </p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Creating..." : `Generate ${loanProgram} Checklist`}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Loan #{loanId} — Checklist
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">
            Last updated:{" "}
            {new Date(checklist.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <LoanChecklist
        checklist={checklist}
        viewerRole="admin"
        onUpload={async (itemId, file) => uploadDocument(itemId, file, loanId)}
        onCompleteTask={completeTask}
        onReviewDocument={reviewDocument}
        onWaive={waiveItem}
        onUpdateNotes={async (itemId, notes) =>
          updateItem(itemId, { adminNotes: notes })
        }
      />
    </div>
  );
}
