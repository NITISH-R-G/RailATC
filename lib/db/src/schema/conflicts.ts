import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conflictTypeEnum = pgEnum("conflict_type", ["capacity_breach", "crossing_conflict", "precedence_violation", "schedule_overlap"]);
export const conflictSeverityEnum = pgEnum("conflict_severity", ["low", "medium", "high", "critical"]);
export const conflictStatusEnum = pgEnum("conflict_status", ["active", "resolved", "acknowledged"]);

export const conflictsTable = pgTable("conflicts", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  trainAId: integer("train_a_id").notNull(),
  trainBId: integer("train_b_id"),
  type: conflictTypeEnum("type").notNull(),
  severity: conflictSeverityEnum("severity").notNull(),
  aiSuggestion: text("ai_suggestion").notNull(),
  status: conflictStatusEnum("status").notNull().default("active"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertConflictSchema = createInsertSchema(conflictsTable).omit({ id: true });
export type InsertConflict = z.infer<typeof insertConflictSchema>;
export type Conflict = typeof conflictsTable.$inferSelect;
