import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduleStatusEnum = pgEnum("schedule_status", ["scheduled", "in_progress", "completed", "overridden", "cancelled"]);

export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  trainId: integer("train_id").notNull(),
  sectionId: integer("section_id").notNull(),
  plannedArrival: timestamp("planned_arrival").notNull(),
  plannedDeparture: timestamp("planned_departure").notNull(),
  actualArrival: timestamp("actual_arrival"),
  actualDeparture: timestamp("actual_departure"),
  status: scheduleStatusEnum("status").notNull().default("scheduled"),
  aiRecommendation: text("ai_recommendation"),
  overrideReason: text("override_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScheduleSchema = createInsertSchema(scheduleTable).omit({ id: true, createdAt: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type ScheduleEntry = typeof scheduleTable.$inferSelect;
