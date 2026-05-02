import { pgTable, text, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainTypeEnum = pgEnum("train_type", ["express", "passenger", "freight", "suburban", "maintenance"]);
export const trainStatusEnum = pgEnum("train_status", ["on_time", "delayed", "halted", "rerouted", "cancelled"]);

export const trainsTable = pgTable("trains", {
  id: serial("id").primaryKey(),
  trainNumber: text("train_number").notNull().unique(),
  type: trainTypeEnum("type").notNull(),
  priority: integer("priority").notNull().default(3),
  currentSectionId: integer("current_section_id"),
  status: trainStatusEnum("status").notNull().default("on_time"),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  speedKmh: real("speed_kmh").notNull().default(80),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainSchema = createInsertSchema(trainsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrain = z.infer<typeof insertTrainSchema>;
export type Train = typeof trainsTable.$inferSelect;
