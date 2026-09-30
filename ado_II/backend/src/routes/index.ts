import { Router } from "express";
import { CentripetalSystem } from "../physics/CentripetalSystem.js";
import { DragSystem } from "../physics/DragSystem.js";
import { InclinedPlaneSystem } from "../physics/InclinedPlaneSystem.js";
import { centripetalSchema, dragSchema, inclinedPlaneSchema } from "./schemas.js";
import { simulationRoute } from "./simulationRoute.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/inclined-plane", simulationRoute(inclinedPlaneSchema, new InclinedPlaneSystem()));
apiRouter.use("/centripetal", simulationRoute(centripetalSchema, new CentripetalSystem()));
apiRouter.use("/drag", simulationRoute(dragSchema, new DragSystem()));
