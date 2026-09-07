import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
export const studyProgress = sqliteTable("study_progress", {
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  stageId: integer("stage_id").notNull(),
  completedAt: text("completed_at").notNull(),
}, table => [primaryKey({ columns: [table.userId, table.lessonId, table.stageId] })]);

export const vocabulary = sqliteTable("vocabulary", {
  userId: text("user_id").notNull(),
  wordKey: text("word_key").notNull(),
  english: text("english").notNull(),
  meaning: text("meaning").notNull(),
  example: text("example").notNull(),
  exampleKo: text("example_ko").notNull(),
  known: integer("known").notNull().default(0),
  saved: integer("saved").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
}, table => [primaryKey({ columns: [table.userId, table.wordKey] })]);

export const aiConnections = sqliteTable("ai_connections", {
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  encryptedSecret: text("encrypted_secret").notNull(),
  endpoint: text("endpoint").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
}, table => [primaryKey({ columns: [table.userId, table.provider] })]);

export const aiUsage = sqliteTable("ai_usage", {
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  window: text("window").notNull(),
  count: integer("count").notNull().default(0),
}, table => [primaryKey({ columns: [table.userId, table.provider, table.window] })]);

export const cloudflareDailyUsage = sqliteTable("cloudflare_daily_usage", {
  accountId: text("account_id").notNull(),
  day: text("day").notNull(),
  calls: integer("calls").notNull().default(0),
  reservedNeurons: integer("reserved_neurons").notNull().default(0),
}, table => [primaryKey({ columns: [table.accountId, table.day] })]);
