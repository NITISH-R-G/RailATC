import { Router } from "express";
import { db, sectionsTable } from "@workspace/db";

const router = Router();

router.get("/sections", async (req, res) => {
  try {
    const sections = await db.select().from(sectionsTable).orderBy(sectionsTable.id);
    res.json(sections);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

export default router;
