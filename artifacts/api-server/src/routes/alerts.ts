import { Router } from "express";
import { db, alertsTable, trainsTable, sectionsTable, auditTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/alerts", async (req, res) => {
  try {
    const alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
    const trains = await db.select().from(trainsTable);
    const sections = await db.select().from(sectionsTable);
    const trainMap = Object.fromEntries(trains.map(t => [t.id, t]));
    const sectionMap = Object.fromEntries(sections.map(s => [s.id, s]));
    const result = alerts.map(a => ({
      ...a,
      trainNumber: a.trainId ? (trainMap[a.trainId]?.trainNumber ?? null) : null,
      sectionName: a.sectionId ? (sectionMap[a.sectionId]?.name ?? null) : null,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

router.post("/alerts/:id/acknowledge", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [alert] = await db.update(alertsTable)
      .set({ status: "acknowledged" })
      .where(eq(alertsTable.id, id))
      .returning();
    if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }

    await db.insert(auditTable).values({
      action: "alert_acknowledged",
      entityType: "alert",
      entityId: id,
      performedBy: "controller",
      details: `Alert "${alert.title}" acknowledged`,
    });

    const trains = await db.select().from(trainsTable);
    const sections = await db.select().from(sectionsTable);
    const trainMap = Object.fromEntries(trains.map(t => [t.id, t]));
    const sectionMap = Object.fromEntries(sections.map(s => [s.id, s]));
    res.json({
      ...alert,
      trainNumber: alert.trainId ? (trainMap[alert.trainId]?.trainNumber ?? null) : null,
      sectionName: alert.sectionId ? (sectionMap[alert.sectionId]?.name ?? null) : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Acknowledge failed" });
  }
});

export default router;
