import { Router } from "express";
import { db, conflictsTable, trainsTable, sectionsTable, auditTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ResolveConflictBody } from "@workspace/api-zod";

const router = Router();

router.get("/conflicts", async (req, res) => {
  try {
    const conflicts = await db.select().from(conflictsTable).orderBy(conflictsTable.detectedAt);
    const trains = await db.select().from(trainsTable);
    const sections = await db.select().from(sectionsTable);
    const trainMap = Object.fromEntries(trains.map(t => [t.id, t]));
    const sectionMap = Object.fromEntries(sections.map(s => [s.id, s]));
    const result = conflicts.map(c => ({
      ...c,
      trainANumber: trainMap[c.trainAId]?.trainNumber ?? "Unknown",
      trainBNumber: c.trainBId ? (trainMap[c.trainBId]?.trainNumber ?? "Unknown") : null,
      sectionName: sectionMap[c.sectionId]?.name ?? "Unknown",
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch conflicts" });
  }
});

router.post("/conflicts/:id/resolve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = ResolveConflictBody.parse(req.body);
    const [conflict] = await db.update(conflictsTable)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(conflictsTable.id, id))
      .returning();
    if (!conflict) { res.status(404).json({ error: "Conflict not found" }); return; }

    await db.insert(auditTable).values({
      action: "conflict_resolved",
      entityType: "conflict",
      entityId: id,
      performedBy: body.resolvedBy,
      details: body.resolution,
    });

    const trains = await db.select().from(trainsTable);
    const sections = await db.select().from(sectionsTable);
    const trainMap = Object.fromEntries(trains.map(t => [t.id, t]));
    const sectionMap = Object.fromEntries(sections.map(s => [s.id, s]));

    res.json({
      ...conflict,
      trainANumber: trainMap[conflict.trainAId]?.trainNumber ?? "Unknown",
      trainBNumber: conflict.trainBId ? (trainMap[conflict.trainBId]?.trainNumber ?? "Unknown") : null,
      sectionName: sectionMap[conflict.sectionId]?.name ?? "Unknown",
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Resolution failed" });
  }
});

export default router;
