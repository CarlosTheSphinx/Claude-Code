// ============================================================
// LoanChecklist — the shared checklist component
//
// This is the SAME component used by both admin and borrower.
// The `viewerRole` prop determines which actions are available.
// Both sides see the identical list, progress, and statuses —
// this is the "single source of truth."
//
// Drop into: client/components/LoanChecklist.tsx
// ============================================================

import React, { useMemo, useState } from "react";
import type { LoanChecklist as LoanChecklistType, ChecklistItem } from "../../shared/types";
import ChecklistItemRow from "./ChecklistItemRow";

interface Props {
  checklist: LoanChecklistType;
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

type FilterMode = "all" | "pending" | "action_needed" | "completed";

export default function LoanChecklist({
  checklist,
  viewerRole,
  onUpload,
  onCompleteTask,
  onReviewDocument,
  onWaive,
  onUpdateNotes,
}: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { progress } = checklist;

  // Group items by section
  const sections = useMemo(() => {
    const grouped = new Map<string, ChecklistItem[]>();
    for (const item of checklist.items) {
      const list = grouped.get(item.section) ?? [];
      list.push(item);
      grouped.set(item.section, list);
    }
    return grouped;
  }, [checklist.items]);

  // Filter items
  const filteredSections = useMemo(() => {
    const result = new Map<string, ChecklistItem[]>();
    for (const [section, items] of sections) {
      const filtered = items.filter((item) => {
        switch (filter) {
          case "pending":
            return item.status === "pending";
          case "action_needed":
            return (
              item.status === "pending" ||
              item.status === "rejected" ||
              (viewerRole === "admin" &&
                (item.status === "uploaded" || item.status === "in_review"))
            );
          case "completed":
            return (
              item.status === "completed" ||
              item.status === "approved" ||
              item.status === "waived"
            );
          default:
            return true;
        }
      });
      if (filtered.length > 0) result.set(section, filtered);
    }
    return result;
  }, [sections, filter, viewerRole]);

  function toggleSection(section: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  // Section progress
  function sectionProgress(items: ChecklistItem[]) {
    const total = items.length;
    const done = items.filter(
      (i) =>
        i.status === "completed" ||
        i.status === "approved" ||
        i.status === "waived",
    ).length;
    return { done, total };
  }

  return (
    <div className="space-y-6">
      {/* ── Progress bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Loan Checklist
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({checklist.loanProgram === "DSCR" ? "DSCR Rental" : "Fix & Flip"})
            </span>
          </h3>
          <span className="text-2xl font-bold text-gray-900">
            {progress.percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Stats chips */}
        <div className="flex gap-3 flex-wrap text-sm">
          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700">
            {progress.completed} completed
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            {progress.inReview} in review
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {progress.pending} pending
          </span>
          {progress.rejected > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700">
              {progress.rejected} needs revision
            </span>
          )}
          {progress.waived > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
              {progress.waived} waived
            </span>
          )}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: "All Items" },
            { key: "action_needed", label: viewerRole === "admin" ? "Needs Review" : "Action Needed" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
          ] as { key: FilterMode; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Sections ── */}
      {[...filteredSections.entries()].map(([section, items]) => {
        const sp = sectionProgress(sections.get(section) ?? items);
        const isCollapsed = collapsedSections.has(section);

        return (
          <div key={section} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h4 className="font-semibold text-gray-800">{section}</h4>
              </div>
              <span className="text-sm text-gray-500">
                {sp.done}/{sp.total} complete
              </span>
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="p-4 space-y-2">
                {items.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    viewerRole={viewerRole}
                    onUpload={onUpload}
                    onCompleteTask={onCompleteTask}
                    onReviewDocument={onReviewDocument}
                    onWaive={onWaive}
                    onUpdateNotes={onUpdateNotes}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filteredSections.size === 0 && (
        <div className="text-center py-12 text-gray-400">
          No items match the current filter.
        </div>
      )}
    </div>
  );
}
