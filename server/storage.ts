import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction, gameHistory, type GameHistory, type InsertGameHistory, kycDocuments, type KycDocument, type InsertKycDocument, sportsEvents, type SportsEvent, type InsertSportsEvent, sportsBets, type SportsBet, type InsertSportsBet, favorites, type Favorite, type InsertFavorite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Create the memory store and assign the return type
const MemoryStore = createMemoryStore(session) as ReturnType<typeof createMemoryStore>;

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
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  setUserAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined>;
  banUser(id: number, reason: string): Promise<User | undefined>;
  unbanUser(id: number): Promise<User | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  getAllGameHistory(): Promise<GameHistory[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  
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
  updateLiveEventData(id: number, liveScore: any, liveStats?: any): Promise<SportsEvent | undefined>;
  
  createSportsBet(bet: InsertSportsBet): Promise<SportsBet>;
  getUserSportsBets(userId: number): Promise<SportsBet[]>;
  settleSportsBet(id: number, status: string, settledAmount: number): Promise<SportsBet | undefined>;
  
  // Favorites operations
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  getUserFavorites(userId: number): Promise<Favorite[]>;
  getFavorite(id: number): Promise<Favorite | undefined>;
  removeFavorite(id: number): Promise<boolean>;
  isFavorite(userId: number, gameType: string, gameId?: string): Promise<boolean>;
  
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
  private favorites: Map<number, Favorite>;
  public sessionStore: ReturnType<typeof createMemoryStore>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentGameHistoryId: number;
  private currentKycDocumentId: number;
  private currentSportsEventId: number;
  private currentSportsBetId: number;
  private currentFavoriteId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.gameHistories = new Map();
    this.kycDocuments = new Map();
    this.sportsEvents = new Map();
    this.sportsBets = new Map();
    this.favorites = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentGameHistoryId = 1;
    this.currentKycDocumentId = 1;
    this.currentSportsEventId = 1;
    this.currentSportsBetId = 1;
    this.currentFavoriteId = 1;
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
      username: insertUser.username,
      email: insertUser.email || '', 
      password: insertUser.password,
      phoneNumber: insertUser.phoneNumber || null,
      phoneVerified: false,
      country: insertUser.country || null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      language: "en",
      balance: 5000, // Initial balance for new users
      googleId: null,
      facebookId: null,
      profileImage: null,
      btcAddress: null,
      ethAddress: null,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: now,
      isVerified: false,
      isAdmin: false,
      isBanned: false,
      banReason: null,
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
  
  async enableTwoFactor(id: number, secret: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      twoFactorEnabled: true,
      twoFactorSecret: secret
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async disableTwoFactor(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      twoFactorEnabled: false,
      twoFactorSecret: null
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateLanguage(id: number, language: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, language };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => a.id - b.id);
  }

  async setUserAdminStatus(id: number, isAdmin: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isAdmin };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async banUser(id: number, reason: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isBanned: true,
      banReason: reason
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async unbanUser(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isBanned: false,
      banReason: null
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllGameHistory(): Promise<GameHistory[]> {
    return Array.from(this.gameHistories.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      gameType: insertTransaction.gameType || null,
      gameData: insertTransaction.gameData || null
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
  
  // Sports event methods
  async createSportsEvent(event: InsertSportsEvent): Promise<SportsEvent> {
    const id = this.currentSportsEventId++;
    const now = new Date();
    
    const sportsEvent: SportsEvent = {
      ...event,
      id,
      status: event.status || 'upcoming',
      results: null,
      liveScore: event.liveScore || null,
      liveStats: event.liveStats || null,
      featured: event.featured || false,
      markets: event.markets || null,
      createdAt: now,
      updatedAt: null
    };
    
    this.sportsEvents.set(id, sportsEvent);
    return sportsEvent;
  }
  
  async getSportsEvents(sportType?: string, status?: string): Promise<SportsEvent[]> {
    let events = Array.from(this.sportsEvents.values());
    
    if (sportType) {
      events = events.filter(event => event.sportType === sportType);
    }
    
    if (status) {
      events = events.filter(event => event.status === status);
    }
    
    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  
  async getSportsEvent(id: number): Promise<SportsEvent | undefined> {
    return this.sportsEvents.get(id);
  }
  
  async updateSportsEventStatus(id: number, status: string, results?: any): Promise<SportsEvent | undefined> {
    const event = this.sportsEvents.get(id);
    if (!event) return undefined;
    
    const now = new Date();
    const updatedEvent = {
      ...event,
      status,
      results: results || event.results,
      updatedAt: now
    };
    
    this.sportsEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async updateLiveEventData(id: number, liveScore: any, liveStats?: any): Promise<SportsEvent | undefined> {
    const event = this.sportsEvents.get(id);
    if (!event) return undefined;
    
    const now = new Date();
    const updatedEvent = {
      ...event,
      liveScore,
      liveStats: liveStats || event.liveStats,
      updatedAt: now
    };
    
    this.sportsEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  // Sports bet methods
  async createSportsBet(bet: InsertSportsBet): Promise<SportsBet> {
    const id = this.currentSportsBetId++;
    const now = new Date();
    
    const sportsBet: SportsBet = {
      ...bet,
      id,
      status: bet.status || 'pending',
      settledAmount: null,
      createdAt: now,
      settledAt: null
    };
    
    this.sportsBets.set(id, sportsBet);
    return sportsBet;
  }
  
  async getUserSportsBets(userId: number): Promise<SportsBet[]> {
    return Array.from(this.sportsBets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async settleSportsBet(id: number, status: string, settledAmount: number): Promise<SportsBet | undefined> {
    const bet = this.sportsBets.get(id);
    if (!bet) return undefined;
    
    const now = new Date();
    const updatedBet = {
      ...bet,
      status,
      settledAmount,
      settledAt: now
    };
    
    this.sportsBets.set(id, updatedBet);
    return updatedBet;
  }

  // Favorites methods
  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const now = new Date();
    
    const newFavorite: Favorite = {
      ...favorite,
      id,
      gameId: favorite.gameId || null,
      gameImage: favorite.gameImage || null,
      addedAt: now
    };
    
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }
  
  async getUserFavorites(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }
  
  async getFavorite(id: number): Promise<Favorite | undefined> {
    return this.favorites.get(id);
  }
  
  async removeFavorite(id: number): Promise<boolean> {
    return this.favorites.delete(id);
  }
  
  async isFavorite(userId: number, gameType: string, gameId?: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      favorite => 
        favorite.userId === userId && 
        favorite.gameType === gameType && 
        (gameId ? favorite.gameId === gameId : true)
    );
  }
}

export const storage = new MemStorage();
