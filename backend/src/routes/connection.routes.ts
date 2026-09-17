import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  createCalendarConnectUrl,
  getCalendarConnection,
  refreshCalendarConnection,
} from "../services/connection.service.js";

export const connectionRouter = Router();

connectionRouter.use(requireSession);

connectionRouter.get("/", async (req, res) => {
  try {
    const auth = (req as any).auth;
    const connection = await getCalendarConnection(auth.userId);

    res.json({ connection });
  } catch (error) {
    console.error("Error in GET connections route:", error);
    res.status(500).json({ error: "could not load connections" });
  }
});

connectionRouter.post("/connect", async (req, res) => {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const redirectUrl =
      typeof req.body?.redirectUrl === "string"
        ? req.body.redirectUrl
        : `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const auth = (req as any).auth;
    const result = await createCalendarConnectUrl({
      userId: auth.userId,
      refreshToken,
      redirectUrl,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in connect route:", error);
    res.status(500).json({ error: "could not start connection" });
  }
});

connectionRouter.post("/refresh-status", async (req, res) => {
  try {
    const auth = (req as any).auth;
    const connection = await refreshCalendarConnection({
      userId: auth.userId,
      authUserId: auth.authUserId,
    });

    res.json({ connection });
  } catch {
    res.status(500).json({ error: "failed to refresh the status" });
  }
});
