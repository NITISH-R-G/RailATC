import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trainsRouter from "./trains";
import sectionsRouter from "./sections";
import scheduleRouter from "./schedule";
import conflictsRouter from "./conflicts";
import kpisRouter from "./kpis";
import alertsRouter from "./alerts";
import auditRouter from "./audit";
import simulationRouter from "./simulation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trainsRouter);
router.use(sectionsRouter);
router.use(scheduleRouter);
router.use(conflictsRouter);
router.use(kpisRouter);
router.use(alertsRouter);
router.use(auditRouter);
router.use(simulationRouter);

export default router;
