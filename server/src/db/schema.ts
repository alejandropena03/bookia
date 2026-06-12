import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["active", "paused"] }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
