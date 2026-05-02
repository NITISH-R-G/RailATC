import { pgTable, text, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradientEnum = pgEnum("gradient_type", ["flat", "mild", "steep"]);
export const sectionStatusEnum = pgEnum("section_status", ["clear", "occupied", "blocked", "maintenance"]);

export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fromStation: text("from_station").notNull(),
  toStation: text("to_station").notNull(),
  lineCapacity: integer("line_capacity").notNull().default(2),
  currentTrainCount: integer("current_train_count").notNull().default(0),
  lengthKm: real("length_km").notNull(),
  gradient: gradientEnum("gradient").notNull().default("flat"),
  status: sectionStatusEnum("status").notNull().default("clear"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSectionSchema = createInsertSchema(sectionsTable).omit({ id: true, createdAt: true });
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sectionsTable.$inferSelect;
