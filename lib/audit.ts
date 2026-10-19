import "server-only";
import { db, schema } from "./db";

/** Record an admin or system action. Never throws: auditing must not break the action. */
export async function audit(actor: string, action: string, target?: string, detail?: Record<string, unknown>) {
  try {
    await db().insert(schema.auditLog).values({ actor, action, target, detail });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
