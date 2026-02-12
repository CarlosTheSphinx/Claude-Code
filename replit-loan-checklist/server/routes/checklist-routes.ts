// ============================================================
// Checklist API Routes — Express router
//
// Drop into: server/routes/checklist-routes.ts
// Then register in your main server file:
//   import checklistRoutes from "./routes/checklist-routes";
//   app.use("/api/checklists", checklistRoutes);
//
// Assumes req.user is populated by your auth middleware with
// { id, role } where role is "admin" | "borrower" | "broker"
// ============================================================

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import {
  createChecklistForLoan,
  getChecklistByLoanId,
  updateChecklistItem,
  addDocumentUpload,
  reviewDocument,
  waiveChecklistItem,
  getChecklistActivity,
  getFullChecklistActivity,
} from "../services/checklist-service";
import {
  getChecklistTemplate,
  getAllTemplates,
} from "../../shared/loan-program-checklists";
import type { LoanProgram } from "../../shared/types";

const router = Router();

// ── File upload config (adjust storage for your setup) ──
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/checklist-docs",
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Helper to get authenticated user from request
function getUser(req: Request): { id: number; role: "admin" | "borrower" | "broker" } {
  const user = (req as any).user;
  if (!user?.id) throw new Error("Unauthorized");
  return user;
}

// Require admin role
function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = getUser(req);
  if (user.role !== "admin") {
    return _res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ──────────────────────────────────────────────────────────────
// TEMPLATE ENDPOINTS (public, read-only)
// ──────────────────────────────────────────────────────────────

/** GET /api/checklists/templates — list all program templates */
router.get("/templates", (_req: Request, res: Response) => {
  const templates = getAllTemplates();
  res.json(templates);
});

/** GET /api/checklists/templates/:program — get template for a specific program */
router.get("/templates/:program", (req: Request, res: Response) => {
  try {
    const template = getChecklistTemplate(req.params.program as LoanProgram);
    res.json(template);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// CHECKLIST CRUD
// ──────────────────────────────────────────────────────────────

/** POST /api/checklists — create a new checklist for a loan (admin only) */
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { loanId, loanProgram, loanData } = req.body;

    if (!loanId || !loanProgram) {
      return res.status(400).json({ error: "loanId and loanProgram are required" });
    }

    const checklist = await createChecklistForLoan(loanId, loanProgram, loanData ?? {});
    res.status(201).json(checklist);
  } catch (err: any) {
    const status = err.message.includes("already exists") ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

/** GET /api/checklists/loan/:loanId — get checklist for a loan */
router.get("/loan/:loanId", async (req: Request, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);
    if (isNaN(loanId)) return res.status(400).json({ error: "Invalid loanId" });

    const checklist = await getChecklistByLoanId(loanId);
    res.json(checklist);
  } catch (err: any) {
    const status = err.message.includes("No checklist") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// CHECKLIST ITEM UPDATES
// ──────────────────────────────────────────────────────────────

/** PATCH /api/checklists/items/:itemId — update an item's status/notes */
router.patch("/items/:itemId", async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const itemId = parseInt(req.params.itemId, 10);
    if (isNaN(itemId)) return res.status(400).json({ error: "Invalid itemId" });

    const updated = await updateChecklistItem(
      itemId,
      req.body,
      user.id,
      user.role as "admin" | "borrower" | "broker",
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/checklists/items/:itemId/waive — admin waives an item */
router.post("/items/:itemId/waive", requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const itemId = parseInt(req.params.itemId, 10);
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ error: "Reason is required" });

    await waiveChecklistItem(itemId, user.id, reason);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/checklists/items/:itemId/complete — borrower marks task complete */
router.post("/items/:itemId/complete", async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const itemId = parseInt(req.params.itemId, 10);
    const { borrowerNotes } = req.body;

    const updated = await updateChecklistItem(
      itemId,
      { status: "completed", borrowerNotes },
      user.id,
      user.role as "admin" | "borrower" | "broker",
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────
// DOCUMENT UPLOAD & REVIEW
// ──────────────────────────────────────────────────────────────

/** POST /api/checklists/items/:itemId/upload — upload a document */
router.post(
  "/items/:itemId/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const itemId = parseInt(req.params.itemId, 10);
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file provided" });

      await addDocumentUpload(
        itemId,
        {
          fileName: file.originalname,
          fileUrl: `/uploads/checklist-docs/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
        user.id,
      );

      // Return the updated item
      const checklist = await getChecklistByLoanId(
        parseInt(req.body.loanId || "0", 10),
      );
      const updatedItem = checklist.items.find((i) => i.id === itemId);
      res.json(updatedItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

/** POST /api/checklists/documents/:docId/review — admin approves/rejects */
router.post(
  "/documents/:docId/review",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = getUser(req);
      const docId = parseInt(req.params.docId, 10);
      const { status, reviewNotes } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      await reviewDocument(docId, user.id, status, reviewNotes);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ──────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ──────────────────────────────────────────────────────────────

/** GET /api/checklists/items/:itemId/activity — activity for one item */
router.get("/items/:itemId/activity", async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const activity = await getChecklistActivity(itemId);
    res.json(activity);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/checklists/loan/:loanId/activity — all activity for a loan */
router.get("/loan/:loanId/activity", async (req: Request, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);
    const activity = await getFullChecklistActivity(loanId);
    res.json(activity);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
