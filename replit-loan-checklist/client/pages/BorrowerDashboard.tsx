// ============================================================
// BorrowerDashboard — Borrower/Broker's view of their checklist
//
// This is the page the borrower (or their broker) sees when
// they log into the portal and go to "My Loans" > a specific
// loan. They see the EXACT same items and statuses the admin
// sees, but with borrower-appropriate actions (upload, complete
// task) instead of admin actions (review, waive).
//
// Drop into: client/pages/BorrowerDashboard.tsx
// (or embed as a section in your borrower portal layout)
// ============================================================

import React from "react";
import LoanChecklist from "../components/LoanChecklist";
import { useChecklist } from "../hooks/useChecklist";

interface Props {
  /** The loan/deal ID this borrower is viewing */
  loanId: number;
  /** The role of the currently logged-in user */
  viewerRole: "borrower" | "broker";
  /** Display name for the borrower (for greeting) */
  borrowerName?: string;
}

export default function BorrowerDashboard({
  loanId,
  viewerRole,
  borrowerName,
}: Props) {
  const {
    checklist,
    loading,
    error,
    completeTask,
    uploadDocument,
    reviewDocument,
    waiveItem,
    updateItem,
  } = useChecklist(loanId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">Loading your checklist...</span>
      </div>
    );
  }

  if (error && !checklist) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-2">Unable to load your checklist</p>
        <p className="text-sm text-gray-400">
          Please contact your loan officer if this continues.
        </p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mb-4">
          <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Checklist Coming Soon
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Your loan officer is preparing your document checklist.
          You'll see it here once it's ready.
        </p>
      </div>
    );
  }

  // Count items that need borrower action
  const actionNeeded = checklist.items.filter(
    (i) =>
      i.assignedTo !== "admin" &&
      (i.status === "pending" || i.status === "rejected"),
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-900">
          {borrowerName ? `Welcome, ${borrowerName}` : "Your Loan Checklist"}
        </h2>
        <p className="text-gray-500 mt-1">
          {checklist.loanProgram === "DSCR"
            ? "DSCR Rental Loan"
            : "Fix & Flip / Bridge Loan"}{" "}
          — Loan #{loanId}
        </p>

        {/* Action summary */}
        {actionNeeded > 0 ? (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-medium">
              You have {actionNeeded} item{actionNeeded !== 1 ? "s" : ""} that need
              {actionNeeded === 1 ? "s" : ""} your attention.
            </p>
            <p className="text-amber-600 text-sm mt-0.5">
              Upload the required documents and complete tasks below to keep your
              loan moving forward.
            </p>
          </div>
        ) : checklist.progress.percentage === 100 ? (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              All items are complete! Your loan is ready for final processing.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              All items on your end have been submitted. We're reviewing your
              documents.
            </p>
          </div>
        )}
      </div>

      {/* The shared checklist — same component the admin uses */}
      <LoanChecklist
        checklist={checklist}
        viewerRole={viewerRole}
        onUpload={async (itemId, file) => uploadDocument(itemId, file, loanId)}
        onCompleteTask={completeTask}
        onReviewDocument={reviewDocument}  // no-op for borrower (buttons hidden by viewerRole)
        onWaive={waiveItem}                // no-op for borrower (buttons hidden by viewerRole)
        onUpdateNotes={async (itemId, notes) =>
          updateItem(itemId, { borrowerNotes: notes })
        }
      />
    </div>
  );
}
