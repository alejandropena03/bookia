import { Hono } from "hono";
import { runReminders } from "../workers/reminder.js";
import { queryClient } from "../db/client.js";

const workerRuns: Array<{
  worker: string;
  startedAt: string;
  status: string;
  result: any;
}> = [];

const MAX_LOG = 20;

export const workers = new Hono();

workers.post("/reminders/run", async (c) => {
  const startedAt = new Date().toISOString();
  try {
    const result = await runReminders(queryClient);
    const entry = {
      worker: "reminder",
      startedAt,
      status: "ok",
      result,
    };
    workerRuns.unshift(entry);
    if (workerRuns.length > MAX_LOG) workerRuns.length = MAX_LOG;
    return c.json({ ok: true, result });
  } catch (err: any) {
    const entry = {
      worker: "reminder",
      startedAt,
      status: "error",
      result: { error: err.message },
    };
    workerRuns.unshift(entry);
    if (workerRuns.length > MAX_LOG) workerRuns.length = MAX_LOG;
    return c.json({ ok: false, error: err.message }, 500);
  }
});

workers.get("/reminders/status", (c) => {
  return c.json({ runs: workerRuns });
});
