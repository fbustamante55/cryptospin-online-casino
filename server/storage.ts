import { users, type User, type InsertUser, transactions, type Transaction, type InsertTransaction, gameHistory, type GameHistory, type InsertGameHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Game history operations
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  getUserGameHistory(userId: number): Promise<GameHistory[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private gameHistories: Map<number, GameHistory>;
  public sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentGameHistoryId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.gameHistories = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentGameHistoryId = 1;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 5000, // Initial balance for new users
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

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = { ...insertTransaction, id, createdAt: now };
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
    const history: GameHistory = { ...insertGameHistory, id, createdAt: now };
    this.gameHistories.set(id, history);
    return history;
  }

  async getUserGameHistory(userId: number): Promise<GameHistory[]> {
    return Array.from(this.gameHistories.values())
      .filter((history) => history.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
