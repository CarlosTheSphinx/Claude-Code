// ============================================================
// ChecklistItemRow — renders a single document or task line
//
// Used by both admin and borrower views. The `viewerRole` prop
// controls which actions are visible.
//
// Drop into: client/components/ChecklistItemRow.tsx
// ============================================================

import React, { useRef, useState } from "react";
import type { ChecklistItem, DocumentUpload } from "../../shared/types";

interface Props {
  item: ChecklistItem;
  viewerRole: "admin" | "borrower" | "broker";
  onUpload: (itemId: number, file: File) => Promise<void>;
  onCompleteTask: (itemId: number, notes?: string) => Promise<void>;
  onReviewDocument: (
    docId: number,
    status: "approved" | "rejected",
    notes?: string,
  ) => Promise<void>;
  onWaive: (itemId: number, reason: string) => Promise<void>;
  onUpdateNotes: (itemId: number, notes: string) => Promise<void>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-gray-500", bg: "bg-gray-100" },
  uploaded: { label: "Uploaded", color: "text-blue-600", bg: "bg-blue-50" },
  in_review: { label: "In Review", color: "text-yellow-600", bg: "bg-yellow-50" },
  approved: { label: "Approved", color: "text-green-600", bg: "bg-green-50" },
  rejected: { label: "Needs Revision", color: "text-red-600", bg: "bg-red-50" },
  completed: { label: "Complete", color: "text-green-600", bg: "bg-green-50" },
  waived: { label: "Waived", color: "text-purple-600", bg: "bg-purple-50" },
  not_applicable: { label: "N/A", color: "text-gray-400", bg: "bg-gray-50" },
};

export default function ChecklistItemRow({
  item,
  viewerRole,
  onUpload,
  onCompleteTask,
  onReviewDocument,
  onWaive,
  onUpdateNotes,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [waiveReason, setWaiveReason] = useState("");
  const [showWaiveInput, setShowWaiveInput] = useState(false);

  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const isDocument = item.category === "document";
  const isTask = item.category === "task";
  const isDone =
    item.status === "approved" ||
    item.status === "completed" ||
    item.status === "waived" ||
    item.status === "not_applicable";

  const canUpload =
    isDocument &&
    !isDone &&
    (viewerRole === "borrower" || viewerRole === "broker") &&
    item.assignedTo !== "admin";

  const canCompleteTask =
    isTask &&
    !isDone &&
    (viewerRole === "borrower" || viewerRole === "broker") &&
    (item.status === "pending" || item.status === "rejected");

  const canReview =
    viewerRole === "admin" &&
    (item.status === "uploaded" || item.status === "in_review");

  const canWaive = viewerRole === "admin" && !isDone;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(item.id, file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div
      className={`border rounded-lg p-4 mb-2 transition-colors ${
        isDone ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"
      } ${item.status === "rejected" ? "border-red-200 bg-red-50/30" : ""}`}
    >
      {/* Main row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status indicator */}
          <div className="mt-0.5">
            {isDone ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : item.status === "rejected" ? (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                {item.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              {item.required && !isDone && (
                <span className="text-xs text-red-500 font-medium">Required</span>
              )}
              <span className="text-xs text-gray-400">
                {isDocument ? "Document" : "Task"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>

            {/* Show rejection notes */}
            {item.status === "rejected" && item.adminNotes && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                <strong>Admin feedback:</strong> {item.adminNotes}
              </div>
            )}

            {/* Uploaded documents */}
            {item.documents.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    canReview={canReview}
                    reviewNote={reviewNote}
                    onReviewNoteChange={setReviewNote}
                    onReview={async (status) => {
                      await onReviewDocument(doc.id, status, reviewNote);
                      setReviewNote("");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </>
          )}

          {canCompleteTask && (
            <button
              onClick={() => onCompleteTask(item.id)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Mark Complete
            </button>
          )}

          {canWaive && (
            <>
              {showWaiveInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={waiveReason}
                    onChange={(e) => setWaiveReason(e.target.value)}
                    placeholder="Reason..."
                    className="text-sm border rounded px-2 py-1 w-32"
                  />
                  <button
                    onClick={async () => {
                      if (waiveReason.trim()) {
                        await onWaive(item.id, waiveReason);
                        setShowWaiveInput(false);
                        setWaiveReason("");
                      }
                    }}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Waive
                  </button>
                  <button
                    onClick={() => setShowWaiveInput(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWaiveInput(true)}
                  className="px-2 py-1.5 text-xs text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50"
                >
                  Waive
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-2">
          <div className="flex gap-4 text-gray-500">
            <span>Assigned to: <strong className="text-gray-700 capitalize">{item.assignedTo}</strong></span>
            {item.dueDate && <span>Due: <strong className="text-gray-700">{new Date(item.dueDate).toLocaleDateString()}</strong></span>}
            {item.completedAt && <span>Completed: <strong className="text-gray-700">{new Date(item.completedAt).toLocaleDateString()}</strong></span>}
          </div>
          {item.adminNotes && item.status !== "rejected" && (
            <div className="text-gray-600">
              <strong>Admin notes:</strong> {item.adminNotes}
            </div>
          )}
          {item.borrowerNotes && (
            <div className="text-gray-600">
              <strong>Borrower notes:</strong> {item.borrowerNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline document row ──

function DocumentRow({
  doc,
  canReview,
  reviewNote,
  onReviewNoteChange,
  onReview,
}: {
  doc: DocumentUpload;
  canReview: boolean;
  reviewNote: string;
  onReviewNoteChange: (v: string) => void;
  onReview: (status: "approved" | "rejected") => Promise<void>;
}) {
  const docStatus = {
    pending_review: { label: "Pending Review", color: "text-yellow-600" },
    approved: { label: "Approved", color: "text-green-600" },
    rejected: { label: "Rejected", color: "text-red-600" },
  }[doc.status];

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-50 rounded px-3 py-2">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline truncate flex-1"
      >
        {doc.fileName}
      </a>
      <span className="text-xs text-gray-400">
        {(doc.fileSize / 1024).toFixed(0)} KB
      </span>
      <span className={`text-xs font-medium ${docStatus.color}`}>
        {docStatus.label}
      </span>

      {canReview && doc.status === "pending_review" && (
        <div className="flex items-center gap-1 ml-2">
          <input
            type="text"
            value={reviewNote}
            onChange={(e) => onReviewNoteChange(e.target.value)}
            placeholder="Notes (optional)"
            className="text-xs border rounded px-2 py-1 w-28"
          />
          <button
            onClick={() => onReview("approved")}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => onReview("rejected")}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      )}

      {doc.reviewNotes && (
        <span className="text-xs text-gray-500 italic ml-1">
          "{doc.reviewNotes}"
        </span>
      )}
    </div>
  );
}
