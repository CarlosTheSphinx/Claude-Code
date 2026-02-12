// ============================================================
// React Hook — useChecklist
//
// Drop into: client/hooks/useChecklist.ts
//
// Provides data fetching + mutation helpers for the checklist.
// Works with any React setup. If you use TanStack Query,
// you can wrap these in useQuery/useMutation instead.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type {
  LoanChecklist,
  LoanProgram,
  ChecklistItemStatus,
  UpdateChecklistItemRequest,
} from "../../shared/types";

interface UseChecklistResult {
  checklist: LoanChecklist | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createChecklist: (
    loanId: number,
    program: LoanProgram,
    loanData?: Record<string, unknown>,
  ) => Promise<LoanChecklist>;
  updateItem: (
    itemId: number,
    update: UpdateChecklistItemRequest,
  ) => Promise<void>;
  completeTask: (itemId: number, notes?: string) => Promise<void>;
  uploadDocument: (
    itemId: number,
    file: File,
    loanId: number,
  ) => Promise<void>;
  reviewDocument: (
    docId: number,
    status: "approved" | "rejected",
    notes?: string,
  ) => Promise<void>;
  waiveItem: (itemId: number, reason: string) => Promise<void>;
}

export function useChecklist(loanId: number | null): UseChecklistResult {
  const [checklist, setChecklist] = useState<LoanChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!loanId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/checklists/loan/${loanId}`);
      if (res.status === 404) {
        setChecklist(null);
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChecklist(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createChecklist = useCallback(
    async (
      targetLoanId: number,
      program: LoanProgram,
      loanData?: Record<string, unknown>,
    ) => {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: targetLoanId,
          loanProgram: program,
          loanData,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChecklist(data);
      return data;
    },
    [],
  );

  const updateItem = useCallback(
    async (itemId: number, update: UpdateChecklistItemRequest) => {
      const res = await fetch(`/api/checklists/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    },
    [refresh],
  );

  const completeTask = useCallback(
    async (itemId: number, notes?: string) => {
      const res = await fetch(`/api/checklists/items/${itemId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowerNotes: notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    },
    [refresh],
  );

  const uploadDocument = useCallback(
    async (itemId: number, file: File, targetLoanId: number) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("loanId", String(targetLoanId));

      const res = await fetch(`/api/checklists/items/${itemId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    },
    [refresh],
  );

  const reviewDocument = useCallback(
    async (docId: number, status: "approved" | "rejected", notes?: string) => {
      const res = await fetch(`/api/checklists/documents/${docId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    },
    [refresh],
  );

  const waiveItem = useCallback(
    async (itemId: number, reason: string) => {
      const res = await fetch(`/api/checklists/items/${itemId}/waive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    },
    [refresh],
  );

  return {
    checklist,
    loading,
    error,
    refresh,
    createChecklist,
    updateItem,
    completeTask,
    uploadDocument,
    reviewDocument,
    waiveItem,
  };
}
