import { Router } from "express";
import { db, auditTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/audit", async (req, res) => {
  try {
    const entries = await db.select().from(auditTable).orderBy(desc(auditTable.createdAt)).limit(100);
    res.json(entries);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

export default router;
