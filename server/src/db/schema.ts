import {
  pgTable, pgEnum, uuid, text, timestamp, jsonb, numeric, integer, uniqueIndex, index, boolean
} from "drizzle-orm/pg-core";

// ── Enums ──

export const tenantStatusEnum = pgEnum("tenant_status", ["active", "paused"]);
export const channelTypeEnum = pgEnum("channel_type", ["whatsapp", "instagram", "messenger", "mock"]);
export const channelModeEnum = pgEnum("channel_mode", ["mock", "live"]);
export const channelStatusEnum = pgEnum("channel_status", ["connected", "disconnected", "error"]);
export const conversationStatusEnum = pgEnum("conversation_status", ["bot_active", "human_active", "escalated", "closed"]);
export const messageDirectionEnum = pgEnum("message_direction", ["inbound", "outbound"]);
export const senderTypeEnum = pgEnum("sender_type", ["contact", "bot", "human"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "agent"]);
export const bookingModeEnum = pgEnum("booking_mode", ["mock", "handoff"]);

// ── Tables ──

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: tenantStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const channelAccounts = pgTable("channel_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  channel: channelTypeEnum("channel").notNull(),
  mode: channelModeEnum("mode").default("mock").notNull(),
  externalAccountId: text("external_account_id"),
  credentials: jsonb("credentials").$type<Record<string, string> | null>(),
  status: channelStatusEnum("status").default("disconnected").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  channel: channelTypeEnum("channel").notNull(),
  externalId: text("external_id").notNull(),
  name: text("name"),
  phone: text("phone"),
  repurchaseSentAt: timestamp("repurchase_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("contacts_tenant_channel_external_idx").on(table.tenantId, table.channel, table.externalId),
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  channelAccountId: uuid("channel_account_id").notNull().references(() => channelAccounts.id, { onDelete: "cascade" }),
  status: conversationStatusEnum("status").default("bot_active").notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  replyWindowExpiresAt: timestamp("reply_window_expires_at", { withTimezone: true }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  handoffSummary: text("handoff_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("conversations_tenant_status_idx").on(table.tenantId, table.status),
]);

export const conversationState = pgTable("conversation_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }).unique(),
  flowKey: text("flow_key"),
  currentState: text("current_state").notNull(),
  slots: jsonb("slots").$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  reengagementStep: integer("reengagement_step").default(0).notNull(),
  lastReengagementAt: timestamp("last_reengagement_at", { withTimezone: true }),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  direction: messageDirectionEnum("direction").notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  providerMessageId: text("provider_message_id"),
  contentType: text("content_type").default("text").notNull(),
  text: text("text"),
  mediaUrl: text("media_url"),
  raw: jsonb("raw").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("messages_provider_idempotency").on(table.tenantId, table.providerMessageId),
  index("messages_conversation_idx").on(table.tenantId, table.conversationId, table.createdAt),
]);

export const flows = pgTable("flows", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  definition: jsonb("definition").$type<Record<string, unknown>>().notNull(),
  isActive: integer("is_active").default(1).notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const catalogItems = pgTable("catalog_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("COP").notNull(),
  category: text("category"),
  durationMinutes: integer("duration_minutes"),
  imageUrl: text("image_url"),
  cities: jsonb("cities").$type<string[]>().default([]).notNull(),
  imageKeys: jsonb("image_keys").$type<string[]>().default([]).notNull(),
  promoLabel: text("promo_label"),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const businessProfile = pgTable("business_profile", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  persona: text("persona").notNull(),
  rules: jsonb("rules").$type<Record<string, unknown>>().default({}).notNull(),
  hours: jsonb("hours").$type<Record<string, unknown>>().default({}).notNull(),
  bookingMode: bookingModeEnum("booking_mode").default("mock").notNull(),
  systemPromptOverrides: text("system_prompt_overrides"),
  cannedResponses: jsonb("canned_responses").$type<Record<string, string>>().default({}).notNull(),
  offHoursMessage: text("off_hours_message"),
  googleMapsUrl: text("google_maps_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workerLogs = pgTable("worker_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  worker: text("worker").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").default("running").notNull(),
  summary: jsonb("summary").$type<Record<string, unknown>>().default({}).notNull(),
});

export const patientMemory = pgTable("patient_memory", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  memoryJson: jsonb("memory_json").$type<Record<string, unknown>>().default({}).notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastConversationId: uuid("last_conversation_id").references(() => conversations.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("patient_memory_tenant_contact_idx").on(table.tenantId, table.contactId),
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  servicePrice: text("service_price"),
  city: text("city"),
  datetime: text("datetime"),
  status: text("status").default("pending").notNull(),
  bookingProviderRef: text("booking_provider_ref"),
  data: jsonb("data").$type<Record<string, unknown>>().default({}).notNull(),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  reminderStatus: text("reminder_status").default("none").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(),
  paymentUrl: text("payment_url"),
  paymentTransactionId: text("payment_transaction_id"),
  postServiceSentAt: timestamp("post_service_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("bookings_tenant_idx").on(table.tenantId),
]);
