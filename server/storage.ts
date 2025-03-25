import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction, gameHistory, type GameHistory, type InsertGameHistory, kycDocuments, type KycDocument, type InsertKycDocument, sportsEvents, type SportsEvent, type InsertSportsEvent, sportsBets, type SportsBet, type InsertSportsBet } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>; 
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  updateUserProfile(id: number, updates: Partial<User>): Promise<User | undefined>;
  updatePassword(id: number, password: string): Promise<User | undefined>;
  updateResetToken(id: number, token: string | null, expiry: Date | null): Promise<User | undefined>;
  verifyPhone(id: number): Promise<User | undefined>;
  verifyUser(id: number): Promise<User | undefined>;
  enableTwoFactor(id: number, secret: string): Promise<User | undefined>;
  disableTwoFactor(id: number): Promise<User | undefined>;
  updateLanguage(id: number, language: string): Promise<User | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Game history operations
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  getUserGameHistory(userId: number): Promise<GameHistory[]>;
  
  // KYC operations
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  getKycDocuments(userId: number): Promise<KycDocument[]>;
  updateKycDocumentStatus(id: number, status: string, rejectionReason?: string): Promise<KycDocument | undefined>;
  
  // Sports betting operations
  createSportsEvent(event: InsertSportsEvent): Promise<SportsEvent>;
  getSportsEvents(sportType?: string, status?: string): Promise<SportsEvent[]>;
  getSportsEvent(id: number): Promise<SportsEvent | undefined>;
  updateSportsEventStatus(id: number, status: string, results?: any): Promise<SportsEvent | undefined>;
  
  createSportsBet(bet: InsertSportsBet): Promise<SportsBet>;
  getUserSportsBets(userId: number): Promise<SportsBet[]>;
  settleSportsBet(id: number, status: string, settledAmount: number): Promise<SportsBet | undefined>;
  
  // Session store
  sessionStore: ReturnType<typeof createMemoryStore>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private gameHistories: Map<number, GameHistory>;
  private kycDocuments: Map<number, KycDocument>;
  private sportsEvents: Map<number, SportsEvent>;
  private sportsBets: Map<number, SportsBet>;
  public sessionStore: ReturnType<typeof createMemoryStore>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentGameHistoryId: number;
  private currentKycDocumentId: number;
  private currentSportsEventId: number;
  private currentSportsBetId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.gameHistories = new Map();
    this.kycDocuments = new Map();
    this.sportsEvents = new Map();
    this.sportsBets = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentGameHistoryId = 1;
    this.currentKycDocumentId = 1;
    this.currentSportsEventId = 1;
    this.currentSportsBetId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }
  
  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.facebookId === facebookId,
    );
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && user.resetTokenExpiry && user.resetTokenExpiry > new Date(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    // Initialize default values for all required User fields
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email || '', // Ensure email is always set
      phoneNumber: insertUser.phoneNumber || null,
      phoneVerified: false,
      country: insertUser.country || null,
      balance: 5000, // Initial balance for new users
      googleId: null,
      facebookId: null,
      profileImage: null,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: now,
      isVerified: false,
      createdAt: now
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, balance: user.balance + amount };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updatePassword(id: number, password: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateResetToken(id: number, token: string | null, expiry: Date | null): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, resetToken: token, resetTokenExpiry: expiry };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async verifyPhone(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, phoneVerified: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async verifyUser(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isVerified: true };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      gameType: insertTransaction.gameType || null 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Game history methods
  async createGameHistory(insertGameHistory: InsertGameHistory): Promise<GameHistory> {
    const id = this.currentGameHistoryId++;
    const now = new Date();
    const history: GameHistory = { 
      ...insertGameHistory, 
      id, 
      createdAt: now,
      multiplier: insertGameHistory.multiplier || null
    };
    this.gameHistories.set(id, history);
    return history;
  }

  async getUserGameHistory(userId: number): Promise<GameHistory[]> {
    return Array.from(this.gameHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // KYC document methods
  async createKycDocument(document: InsertKycDocument): Promise<KycDocument> {
    const id = this.currentKycDocumentId++;
    const now = new Date();
    
    const kycDocument: KycDocument = {
      ...document,
      id,
      verificationStatus: 'pending',
      rejectionReason: null,
      createdAt: now,
      updatedAt: null,
      // Ensure metadata is always present
      metadata: document.metadata || {}
    };
    
    this.kycDocuments.set(id, kycDocument);
    return kycDocument;
  }
  
  async getKycDocuments(userId: number): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values())
      .filter((doc) => doc.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateKycDocumentStatus(id: number, status: string, rejectionReason?: string): Promise<KycDocument | undefined> {
    const document = this.kycDocuments.get(id);
    if (!document) return undefined;
    
    const now = new Date();
    const updatedDocument = { 
      ...document, 
      verificationStatus: status, 
      rejectionReason: status === 'rejected' ? (rejectionReason || null) : null,
      updatedAt: now
    };
    
    this.kycDocuments.set(id, updatedDocument);
    return updatedDocument;
  }
}

export const storage = new MemStorage();
