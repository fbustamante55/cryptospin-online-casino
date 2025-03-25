import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  country: text("country"),
  balance: integer("balance").notNull().default(5000),
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  profileImage: text("profile_image"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // passport, id_card, driver_license
  documentPath: text("document_path").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  metadata: jsonb("metadata"), // Additional document metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
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
  email: true,
  password: true,
  phoneNumber: true,
  country: true,
});

export const registrationSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  recaptchaToken: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).pick({
  userId: true,
  documentType: true,
  documentPath: true,
  metadata: true,
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

export type Registration = z.infer<typeof registrationSchema>;

export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistory.$inferSelect;

// Auth schemas for login, password reset, etc.
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  recaptchaToken: z.string().optional(),
  rememberMe: z.boolean().optional().default(false)
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const phoneVerificationSchema = z.object({
  phoneNumber: z.string().min(8, "Please enter a valid phone number"),
  verificationCode: z.string().length(6, "Verification code must be 6 digits")
});

export type Login = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type PhoneVerification = z.infer<typeof phoneVerificationSchema>;
