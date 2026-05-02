import { Router } from "express";
import { db, trainsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTrainBody, UpdateTrainBody } from "@workspace/api-zod";

const router = Router();

router.get("/trains", async (req, res) => {
  try {
    const trains = await db.select().from(trainsTable).orderBy(trainsTable.id);
    res.json(trains);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch trains" });
  }
});

router.post("/trains", async (req, res) => {
  try {
    const body = CreateTrainBody.parse(req.body);
    const [train] = await db.insert(trainsTable).values(body).returning();
    res.status(201).json(train);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid train data" });
  }
});

router.get("/trains/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [train] = await db.select().from(trainsTable).where(eq(trainsTable.id, id));
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json(train);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch train" });
  }
});

router.patch("/trains/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateTrainBody.parse(req.body);
    const [train] = await db.update(trainsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(trainsTable.id, id))
      .returning();
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json(train);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid update data" });
  }
});

export default router;
