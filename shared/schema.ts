import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, primaryKey } from "drizzle-orm/pg-core";
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
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  language: text("language").default("en"),
  balance: integer("balance").notNull().default(5000),
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  profileImage: text("profile_image"),
  btcAddress: text("btc_address"),
  ethAddress: text("eth_address"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  banReason: text("ban_reason"),
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
  gameType: text("game_type"), // slots, dice, crash, roulette, blackjack, keno, baccarat
  gameData: jsonb("game_data"), // Additional data for transactions
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(), // slots, dice, crash, roulette, blackjack, keno, baccarat
  gameId: text("game_id"), // Specific game ID (slotopol, bookofra, etc.)
  bet: integer("bet").notNull(),
  outcome: text("outcome").notNull(), // JSON string with game-specific outcome details
  multiplier: doublePrecision("multiplier"), // For crash, dice games
  win: boolean("win").notNull(),
  winAmount: integer("win_amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const slotGames = pgTable("slot_games", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(), // Unique identifier for the slot game
  provider: text("provider").notNull(), // AGT, Novomatic, NetEnt, etc.
  name: text("name").notNull(), // Display name
  description: text("description"),
  thumbnail: text("thumbnail"), // Path to thumbnail image
  paylines: integer("paylines").notNull(), // Number of paylines
  reels: integer("reels").notNull(), // Number of reels
  minBet: integer("min_bet").notNull(),
  maxBet: integer("max_bet").notNull(),
  rtp: doublePrecision("rtp").notNull(), // Return to player percentage
  volatility: text("volatility").notNull(), // low, medium, high
  features: jsonb("features"), // Array of special features like free spins, wilds, etc.
  symbols: jsonb("symbols"), // Information about symbols and payouts
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const slotSessions = pgTable("slot_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: text("game_id").notNull().references(() => slotGames.gameId),
  currentBet: integer("current_bet").notNull(),
  selectedLines: integer("selected_lines").notNull(),
  lastWin: integer("last_win").default(0),
  lastOutcome: jsonb("last_outcome"), // Last spin result
  totalWagered: integer("total_wagered").default(0),
  totalWon: integer("total_won").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const sportsEvents = pgTable("sports_events", {
  id: serial("id").primaryKey(),
  sportType: text("sport_type").notNull(), // mma, mlb, nfl, tennis, soccer, hockey
  eventName: text("event_name").notNull(),
  competition: text("competition").notNull(), // League, tournament, etc.
  teamA: text("team_a").notNull(),
  teamB: text("team_b").notNull(),
  startTime: timestamp("start_time").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed, cancelled
  results: jsonb("results"), // Store match results
  odds: jsonb("odds").notNull(), // Store odds for different bet types
  liveScore: jsonb("live_score"), // For live events: current score, time remaining, etc.
  liveStats: jsonb("live_stats"), // Additional live statistics
  featured: boolean("featured").default(false), // Featured events shown prominently
  markets: jsonb("markets"), // Available betting markets (moneyline, spread, props, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const sportsBets = pgTable("sports_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => sportsEvents.id),
  betType: text("bet_type").notNull(), // moneyline, spread, over_under, etc.
  betOn: text("bet_on").notNull(), // teamA, teamB, draw, etc.
  amount: integer("amount").notNull(),
  odds: doublePrecision("odds").notNull(),
  potentialWin: integer("potential_win").notNull(),
  status: text("status").notNull().default("pending"), // pending, won, lost, cancelled
  settledAmount: integer("settled_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settledAt: timestamp("settled_at")
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull(), // slots, dice, crash, roulette, blackjack, baccarat, etc.
  gameId: text("game_id"), // Specific game ID if needed (for multiple versions of the same game type)
  gameTitle: text("game_title").notNull(), // Display name of the game
  gameImage: text("game_image"), // Path to game image/thumbnail
  addedAt: timestamp("added_at").notNull().defaultNow()
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
  gameData: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).pick({
  userId: true,
  gameType: true,
  gameId: true,
  bet: true,
  outcome: true,
  multiplier: true,
  win: true,
  winAmount: true,
});

export const insertSportsEventSchema = createInsertSchema(sportsEvents).pick({
  sportType: true,
  eventName: true,
  competition: true,
  teamA: true,
  teamB: true,
  startTime: true,
  status: true,
  odds: true,
  liveScore: true,
  liveStats: true,
  featured: true,
  markets: true
});

export const insertSportsBetSchema = createInsertSchema(sportsBets).pick({
  userId: true,
  eventId: true,
  betType: true,
  betOn: true,
  amount: true,
  odds: true,
  potentialWin: true,
  status: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  gameType: true,
  gameId: true,
  gameTitle: true,
  gameImage: true,
});

export const insertSlotGameSchema = createInsertSchema(slotGames).pick({
  gameId: true,
  provider: true,
  name: true,
  description: true,
  thumbnail: true,
  paylines: true,
  reels: true,
  minBet: true,
  maxBet: true,
  rtp: true,
  volatility: true,
  features: true,
  symbols: true,
  isActive: true,
});

export const insertSlotSessionSchema = createInsertSchema(slotSessions).pick({
  userId: true,
  gameId: true,
  currentBet: true,
  selectedLines: true,
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

export type InsertSportsEvent = z.infer<typeof insertSportsEventSchema>;
export type SportsEvent = typeof sportsEvents.$inferSelect;

export type InsertSportsBet = z.infer<typeof insertSportsBetSchema>;
export type SportsBet = typeof sportsBets.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertSlotGame = z.infer<typeof insertSlotGameSchema>;
export type SlotGame = typeof slotGames.$inferSelect;

export type InsertSlotSession = z.infer<typeof insertSlotSessionSchema>;
export type SlotSession = typeof slotSessions.$inferSelect;

// Auth schemas for login, password reset, etc.
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  phoneNumber: z.string().min(6, "Please enter a valid international phone number")
    .refine(value => /^\+?[0-9\s\-()]+$/.test(value), "Phone number can only contain digits, spaces, and characters +()-"),
  verificationCode: z.string().length(6, "Verification code must be 6 digits").optional()
});

export const profileUpdateSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
});

export const twoFactorSetupSchema = z.object({
  twoFactorCode: z.string().length(6, "Verification code must be 6 digits"),
});

export const kycUploadSchema = z.object({
  documentType: z.enum(["passport", "id_card", "driver_license", "address_proof"]),
  documentFile: z.any(), // File handling will be done server-side
});

export type Login = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type PhoneVerification = z.infer<typeof phoneVerificationSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;
export type KycUpload = z.infer<typeof kycUploadSchema>;

// Slot game-specific schemas
export const slotSpinSchema = z.object({
  gameId: z.string(),
  bet: z.number().min(1),
  lines: z.number().min(1),
});

export const slotDoubleUpSchema = z.object({
  gameId: z.string(),
  sessionId: z.number(),
  multiplier: z.number().min(2).max(10),
  choice: z.enum(['red', 'black']),
});

export const slotCollectSchema = z.object({
  gameId: z.string(),
  sessionId: z.number(),
});

export type SlotSpin = z.infer<typeof slotSpinSchema>;
export type SlotDoubleUp = z.infer<typeof slotDoubleUpSchema>;
export type SlotCollect = z.infer<typeof slotCollectSchema>;
