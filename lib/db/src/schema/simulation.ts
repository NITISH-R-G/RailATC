import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disruptionTypeEnum = pgEnum("disruption_type", ["breakdown", "weather_delay", "track_block", "increased_traffic", "signal_failure"]);

export const simulationScenariosTable = pgTable("simulation_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  disruptionType: disruptionTypeEnum("disruption_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSimulationScenarioSchema = createInsertSchema(simulationScenariosTable).omit({ id: true, createdAt: true });
export type InsertSimulationScenario = z.infer<typeof insertSimulationScenarioSchema>;
export type SimulationScenario = typeof simulationScenariosTable.$inferSelect;
