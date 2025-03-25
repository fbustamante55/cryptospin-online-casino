import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(5000),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // deposit, withdraw, bet, win
  gameType: text("game_type"), // slots, dice, crash
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(), // slots, dice, crash
  bet: integer("bet").notNull(),
  outcome: text("outcome").notNull(), // JSON string with game-specific outcome details
  multiplier: doublePrecision("multiplier"), // For crash, dice games
  win: boolean("win").notNull(),
  winAmount: integer("win_amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  gameType: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).pick({
  userId: true,
  gameType: true,
  bet: true,
  outcome: true,
  multiplier: true,
  win: true,
  winAmount: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
