import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTransactionSchema, 
  insertGameHistorySchema, 
  insertSportsBetSchema, 
  insertSportsEventSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Wallet-related routes
  
  // Deposit funds
  app.post("/api/wallet/deposit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const depositSchema = z.object({
      amount: z.number().min(10).max(100000),
      method: z.string().min(1),
    });
    
    try {
      const { amount, method } = depositSchema.parse(req.body);
      
      // Create deposit transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: amount,
        type: "deposit",
        gameType: null,
        gameData: { method }
      });
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, req.user.balance + amount);
      
      res.status(200).json({
        message: "Deposit successful",
        transaction,
        balance: updatedUser?.balance
      });
    } catch (error) {
      console.error("Deposit error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deposit data", errors: error.errors });
      }
      res.status(500).json({ message: "Error processing deposit" });
    }
  });
  
  // Withdraw funds
  app.post("/api/wallet/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const withdrawSchema = z.object({
      amount: z.number().min(10).max(100000),
      address: z.string().min(10),
      currency: z.string().min(1),
    });
    
    try {
      const { amount, address, currency } = withdrawSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create withdrawal transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: -amount, // Negative amount for withdrawal
        type: "withdraw",
        gameType: null,
        gameData: { address, currency }
      });
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, req.user.balance - amount);
      
      res.status(200).json({
        message: "Withdrawal request submitted",
        transaction,
        balance: updatedUser?.balance
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid withdrawal data", errors: error.errors });
      }
      res.status(500).json({ message: "Error processing withdrawal" });
    }
  });

  // Game-related routes
  
  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get user game history
  app.get("/api/game-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const history = await storage.getUserGameHistory(req.user.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  // Play slots game
  app.post("/api/games/slots", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bet: z.number().min(10).max(10000),
    });

    try {
      const { bet } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Game logic for slots
      const reels = [
        generateReelResult(),
        generateReelResult(),
        generateReelResult()
      ];
      
      // Determine win amount based on reel combination
      const { win, multiplier, winAmount } = calculateSlotsWin(reels, bet);
      
      // Update user balance
      const amountChange = win ? winAmount - bet : -bet;
      const updatedUser = await storage.updateUserBalance(req.user.id, amountChange);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        gameType: "slots"
      });

      if (win) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: winAmount,
          type: "win",
          gameType: "slots"
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "slots",
        bet,
        outcome: JSON.stringify(reels),
        multiplier,
        win,
        winAmount: win ? winAmount : 0
      });

      res.json({
        reels,
        win,
        multiplier,
        winAmount: win ? winAmount : 0,
        balance: updatedUser.balance
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Play dice game
  app.post("/api/games/dice", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bet: z.number().min(10).max(10000),
      target: z.number().min(1).max(99),
      isOver: z.boolean()
    });

    try {
      const { bet, target, isOver } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Game logic for dice
      const result = Math.floor(Math.random() * 100) + 1; // 1-100
      
      // Determine if the player won
      const win = isOver ? result > target : result < target;
      
      // Calculate multiplier and win amount
      const edge = 1.5; // House edge percentage
      const multiplier = isOver
        ? (100 - edge) / (100 - target)
        : (100 - edge) / target;
      
      const winAmount = win ? Math.floor(bet * multiplier) : 0;
      
      // Update user balance
      const amountChange = win ? winAmount - bet : -bet;
      const updatedUser = await storage.updateUserBalance(req.user.id, amountChange);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        gameType: "dice"
      });

      if (win) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: winAmount,
          type: "win",
          gameType: "dice"
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "dice",
        bet,
        outcome: JSON.stringify({ result, target, isOver }),
        multiplier,
        win,
        winAmount: win ? winAmount : 0
      });

      res.json({
        result,
        target,
        isOver,
        win,
        multiplier,
        winAmount: win ? winAmount : 0,
        balance: updatedUser.balance
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Play crash game
  app.post("/api/games/crash/bet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bet: z.number().min(10).max(10000),
      autoCashout: z.number().optional()
    });

    try {
      const { bet, autoCashout } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Generate crash point (will be revealed to the user later)
      // House edge built into the algorithm
      const crashPoint = generateCrashPoint();
      
      // Update user balance (deduct bet)
      const updatedUser = await storage.updateUserBalance(req.user.id, -bet);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        gameType: "crash"
      });

      // Don't record game history yet as we don't know the outcome

      res.json({
        success: true,
        crashPoint, // This would normally be kept server-side in a real implementation
        bet,
        autoCashout,
        balance: updatedUser.balance
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/games/crash/cashout", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const cashoutSchema = z.object({
      bet: z.number().min(10).max(10000),
      crashPoint: z.number().min(1),
      cashoutPoint: z.number().min(1),
    });

    try {
      const { bet, crashPoint, cashoutPoint } = cashoutSchema.parse(req.body);
      
      // Validate the cashout
      if (cashoutPoint > crashPoint) {
        return res.status(400).json({ message: "Invalid cashout" });
      }

      // Calculate winnings
      const winAmount = Math.floor(bet * cashoutPoint);
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, winAmount);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Record transaction and game history
      await storage.createTransaction({
        userId: req.user.id,
        amount: winAmount,
        type: "win",
        gameType: "crash"
      });

      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "crash",
        bet,
        outcome: JSON.stringify({ crashPoint, cashoutPoint }),
        multiplier: cashoutPoint,
        win: true,
        winAmount
      });

      res.json({
        success: true,
        cashoutPoint,
        winAmount,
        balance: updatedUser.balance
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/games/crash/bust", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const bustSchema = z.object({
      bet: z.number().min(10).max(10000),
      crashPoint: z.number().min(1),
    });

    try {
      const { bet, crashPoint } = bustSchema.parse(req.body);

      // Record game history for a loss
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "crash",
        bet,
        outcome: JSON.stringify({ crashPoint, cashoutPoint: 0 }),
        multiplier: 0,
        win: false,
        winAmount: 0
      });

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Sports betting routes
  
  // Get all upcoming sports events with filters
  app.get("/api/sports/events", async (req, res) => {
    try {
      const sportType = req.query.sportType as string | undefined;
      const status = req.query.status as string | undefined;
      
      const events = await storage.getSportsEvents(sportType, status);
      res.json(events);
    } catch (error) {
      console.error("Error fetching sports events:", error);
      res.status(500).json({ message: "Failed to fetch sports events" });
    }
  });
  
  // Get a single sports event by ID
  app.get("/api/sports/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getSportsEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching sports event:", error);
      res.status(500).json({ message: "Failed to fetch sports event" });
    }
  });
  
  // Create a bet on a sports event
  app.post("/api/sports/bets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      eventId: z.number().int().positive(),
      stake: z.number().min(10).max(10000),
      odds: z.number().min(1.01),
      betType: z.string().min(1),
      selection: z.string().min(1),
      marketId: z.string().optional()
    });
    
    try {
      const { eventId, stake, odds, betType, selection, marketId } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < stake) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Check if event exists and is still open for betting
      const event = await storage.getSportsEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.status !== 'upcoming' && event.status !== 'live') {
        return res.status(400).json({ message: "Event is not open for betting" });
      }
      
      // Create the bet
      const bet = await storage.createSportsBet({
        userId: req.user.id,
        eventId,
        amount: stake, // Using "amount" instead of "stake" to match schema
        odds,
        betType,
        betOn: selection, // Using "betOn" instead of "selection" to match schema
        potentialWin: Math.floor(stake * odds),
        status: 'pending'
      });
      
      // Update user balance (deduct stake)
      const updatedUser = await storage.updateUserBalance(req.user.id, -stake);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }
      
      // Create transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -stake,
        type: "bet",
        gameType: "sports"
      });
      
      res.status(201).json({
        bet,
        balance: updatedUser.balance
      });
    } catch (error) {
      console.error("Error placing sports bet:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });
  
  // Get user bets
  app.get("/api/sports/bets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const bets = await storage.getUserSportsBets(req.user.id);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching user bets:", error);
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });
  
  // Update live event data (admin only in real system)
  app.patch("/api/sports/events/:id/live", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real system, you would check for admin privileges here
    
    const liveDataSchema = z.object({
      liveScore: z.any(),
      liveStats: z.any().optional()
    });
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const { liveScore, liveStats } = liveDataSchema.parse(req.body);
      
      const event = await storage.getSportsEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Update live data
      const updatedEvent = await storage.updateLiveEventData(eventId, liveScore, liveStats);
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating live event data:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid live data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update live event data" });
    }
  });
  
  // Complete an event and settle bets (admin only in real system)
  app.patch("/api/sports/events/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real system, you would check for admin privileges here
    
    const completeSchema = z.object({
      results: z.any(),
      winners: z.array(z.object({
        betId: z.number().int().positive(),
        settledAmount: z.number().min(0)
      }))
    });
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const { results, winners } = completeSchema.parse(req.body);
      
      const event = await storage.getSportsEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Update event status
      const updatedEvent = await storage.updateSportsEventStatus(eventId, 'completed', results);
      
      // Settle all winning bets
      for (const winner of winners) {
        const bet = await storage.settleSportsBet(winner.betId, 'won', winner.settledAmount);
        
        if (bet) {
          // Pay out winnings
          await storage.updateUserBalance(bet.userId, winner.settledAmount);
          
          // Record transaction
          await storage.createTransaction({
            userId: bet.userId,
            amount: winner.settledAmount,
            type: "win",
            gameType: "sports"
          });
        }
      }
      
      // Get all pending bets for this event and mark them as lost
      const userBets = await Promise.all((await storage.getUserSportsBets(req.user.id))
        .filter(bet => bet.eventId === eventId && bet.status === 'pending')
        .map(bet => storage.settleSportsBet(bet.id, 'lost', 0)));
      
      res.json({
        event: updatedEvent,
        settledBets: winners.length + userBets.length
      });
    } catch (error) {
      console.error("Error completing sports event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for game logic

function generateReelResult(): string {
  const symbols = ["7", "BAR", "2xBAR", "3xBAR", "CHERRY", "LEMON", "ORANGE", "PLUM"];
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex];
}

function calculateSlotsWin(reels: string[], bet: number): { win: boolean; multiplier: number; winAmount: number } {
  // Check for winning combinations
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // All three symbols match
    switch (reels[0]) {
      case "7":
        return { win: true, multiplier: 10, winAmount: bet * 10 };
      case "BAR":
        return { win: true, multiplier: 5, winAmount: bet * 5 };
      case "2xBAR":
        return { win: true, multiplier: 4, winAmount: bet * 4 };
      case "3xBAR":
        return { win: true, multiplier: 3, winAmount: bet * 3 };
      case "CHERRY":
        return { win: true, multiplier: 2.5, winAmount: Math.floor(bet * 2.5) };
      default:
        return { win: true, multiplier: 2, winAmount: bet * 2 };
    }
  } else if (
    (reels[0] === "BAR" || reels[0] === "2xBAR" || reels[0] === "3xBAR") &&
    (reels[1] === "BAR" || reels[1] === "2xBAR" || reels[1] === "3xBAR") &&
    (reels[2] === "BAR" || reels[2] === "2xBAR" || reels[2] === "3xBAR")
  ) {
    // Any three BAR symbols
    return { win: true, multiplier: 1.5, winAmount: Math.floor(bet * 1.5) };
  } else if (reels.filter(r => r === "CHERRY").length >= 2) {
    // At least two CHERRY symbols
    return { win: true, multiplier: 1.2, winAmount: Math.floor(bet * 1.2) };
  }
  
  // No win
  return { win: false, multiplier: 0, winAmount: 0 };
}

function generateCrashPoint(): number {
  // Generate a random crash point with house edge
  // Using a distribution where:
  // - Most rounds crash at low multipliers (1x-3x)
  // - Some rounds go to medium multipliers (3x-10x)
  // - Rarely goes to high multipliers (10x+)
  
  // Random number between 0 and 1
  const r = Math.random();
  
  // House edge factor (lower means more house edge)
  const houseEdgeFactor = 0.97;
  
  // Formula based on a modified exponential distribution
  const crashPoint = Math.max(1, Math.floor((100 * houseEdgeFactor / (1 - r * houseEdgeFactor)) / 100 * 100) / 100);
  
  return parseFloat(crashPoint.toFixed(2));
}
