import { Router } from "express";
import { db, trainsTable, sectionsTable, conflictsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/kpis", async (req, res) => {
  try {
    const trains = await db.select().from(trainsTable);
    const sections = await db.select().from(sectionsTable);
    const conflicts = await db.select().from(conflictsTable).where(eq(conflictsTable.status, "active"));

    const totalTrains = trains.length;
    const onTime = trains.filter(t => t.status === "on_time").length;
    const delayed = trains.filter(t => t.status === "delayed").length;
    const halted = trains.filter(t => t.status === "halted").length;
    const avgDelay = totalTrains > 0
      ? trains.reduce((sum, t) => sum + t.delayMinutes, 0) / totalTrains
      : 0;
    const punctuality = totalTrains > 0 ? (onTime / totalTrains) * 100 : 100;
    const totalCapacity = sections.reduce((sum, s) => sum + s.lineCapacity, 0);
    const totalUsed = sections.reduce((sum, s) => sum + s.currentTrainCount, 0);
    const utilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
    const throughput = sections.length > 0 ? totalUsed / Math.max(sections.length * 0.5, 1) : 0;

    res.json({
      punctualityPct: parseFloat(punctuality.toFixed(1)),
      avgDelayMinutes: parseFloat(avgDelay.toFixed(1)),
      throughputTrainsPerHour: parseFloat(throughput.toFixed(1)),
      sectionUtilizationPct: parseFloat(utilization.toFixed(1)),
      activeConflicts: conflicts.length,
      trainsOnTime: onTime,
      trainsDelayed: delayed,
      trainsHalted: halted,
      totalActiveTrains: totalTrains,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to compute KPIs" });
  }
});

router.get("/kpis/history", async (_req, res) => {
  try {
    const now = new Date();
    const history = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now);
      hour.setHours(now.getHours() - (23 - i));
      const base = 75 + Math.sin(i * 0.5) * 10 + Math.random() * 5;
      return {
        hour: hour.toISOString(),
        punctualityPct: parseFloat(Math.min(100, base + Math.random() * 8).toFixed(1)),
        avgDelayMinutes: parseFloat((Math.max(0, 8 - Math.sin(i * 0.4) * 4 + Math.random() * 3)).toFixed(1)),
        throughputTrainsPerHour: parseFloat((12 + Math.sin(i * 0.6) * 4 + Math.random() * 2).toFixed(1)),
        sectionUtilizationPct: parseFloat((55 + Math.sin(i * 0.3) * 15 + Math.random() * 5).toFixed(1)),
      };
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
