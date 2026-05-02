import { Router } from "express";
import { db, simulationScenariosTable, auditTable } from "@workspace/db";
import { RunSimulationBody } from "@workspace/api-zod";

const router = Router();

const DISRUPTION_IMPACTS: Record<string, { trains: number; delay: number; throughput: number; actions: string[]; routes: string[] }> = {
  breakdown: {
    trains: 8, delay: 25, throughput: -18,
    actions: ["Hold trailing trains at preceding stations", "Dispatch maintenance crew to site", "Reroute freight trains via alternate corridor", "Notify passengers of expected delays"],
    routes: ["Via Loop Line A through Viramgam", "Express corridor bypass via Gandhidham"],
  },
  weather_delay: {
    trains: 12, delay: 15, throughput: -10,
    actions: ["Reduce permitted speed to 60 km/h on affected sections", "Increase headway between trains", "Pre-position recovery engines at key junctions"],
    routes: ["Inland route via Vadodara (weather-shielded)", "Southern bypass avoiding coastal sections"],
  },
  track_block: {
    trains: 6, delay: 40, throughput: -30,
    actions: ["Implement single-line working on blocked section", "Stage trains at nearest loops", "Deploy engineering department immediately", "Issue POSIX for affected section"],
    routes: ["Emergency diversion via Section B-12", "Parallel track activation on Section C-7"],
  },
  increased_traffic: {
    trains: 20, delay: 8, throughput: -5,
    actions: ["Activate additional crossing loops", "Re-sequence train priorities", "Deploy additional traffic controllers", "Extend loop dwell times by 3 minutes"],
    routes: ["Additional pathing via Section D-4 loop", "Freight pre-clearance on Section F-2"],
  },
  signal_failure: {
    trains: 10, delay: 35, throughput: -25,
    actions: ["Issue pilot working authority on affected block", "Deploy signal inspectors", "Implement caution orders for all trains in section", "Coordinate with signal department for restoration ETA"],
    routes: ["Absolute block working via adjacent section", "Token-based working on secondary line"],
  },
};

router.get("/simulation/scenarios", async (req, res) => {
  try {
    const scenarios = await db.select().from(simulationScenariosTable).orderBy(simulationScenariosTable.id);
    res.json(scenarios);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch scenarios" });
  }
});

router.post("/simulation/run", async (req, res) => {
  try {
    const body = RunSimulationBody.parse(req.body);
    const impact = DISRUPTION_IMPACTS[body.disruptionType] ?? DISRUPTION_IMPACTS.breakdown;
    const durationFactor = body.durationMinutes / 30;

    const result = {
      scenarioName: body.name,
      disruptionType: body.disruptionType,
      impactedTrains: Math.round(impact.trains * Math.min(durationFactor, 2)),
      delayMinutesAdded: parseFloat((impact.delay * Math.min(durationFactor, 1.5)).toFixed(1)),
      throughputImpactPct: parseFloat((impact.throughput * Math.min(durationFactor, 1.2)).toFixed(1)),
      recommendedActions: impact.actions,
      alternativeRoutes: impact.routes,
      estimatedRecoveryMinutes: Math.round(body.durationMinutes * 1.4 + 15),
    };

    await db.insert(auditTable).values({
      action: "simulation_run",
      entityType: "simulation",
      performedBy: "controller",
      details: `Ran what-if simulation: ${body.name} (${body.disruptionType}, ${body.durationMinutes}min)`,
    });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Simulation failed" });
  }
});

export default router;
