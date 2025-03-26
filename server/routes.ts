import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTransactionSchema, 
  insertGameHistorySchema, 
  insertSportsBetSchema, 
  insertSportsEventSchema,
  insertFavoriteSchema
} from "@shared/schema";

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Special admin setup route
  app.post("/api/setup-admin", async (req, res) => {
    try {
      const adminSetupSchema = z.object({
        username: z.string(),
        password: z.string(),
      });
      
      const { username, password } = adminSetupSchema.parse(req.body);
      
      // Check if the credentials match our predefined admin credentials
      if (username === "BUSTAXADMINDEUZ" && password === "Todopoderoso99@") {
        // Find the user by username
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return res.status(404).json({ message: "Admin user not found. Please register with this username first." });
        }
        
        // Make the user an admin
        const updatedUser = await storage.setUserAdminStatus(user.id, true);
        
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update admin status" });
        }
        
        // Remove sensitive data
        const { password, ...safeUser } = updatedUser;
        return res.status(200).json({ 
          message: "Admin setup successful!", 
          user: safeUser 
        });
      }
      
      // Invalid credentials
      return res.status(403).json({ message: "Invalid admin credentials" });
    } catch (error) {
      console.error("Error in admin setup:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to set up admin" });
    }
  });
  
  // Ruta para enviar notificaciones desde el panel de administración
  app.post("/api/admin/notifications/send", isAdmin, async (req, res) => {
    try {
      const notificationSchema = z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(["info", "success", "warning", "error"]),
        targetType: z.enum(["all", "specific"]),
        specificUsers: z.array(z.number()).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        scheduleSend: z.boolean().optional(),
        scheduledTime: z.string().optional(),
        requiresAction: z.boolean().optional(),
        actionUrl: z.string().optional(),
        actionText: z.string().optional(),
        persistent: z.boolean().optional()
      });
      
      const validatedData = notificationSchema.parse(req.body);
      
      console.log("Admin sending notification:", validatedData);
      
      // En una implementación real, aquí guardaríamos la notificación en la base de datos
      // y luego la enviaríamos a los usuarios específicos a través de WebSockets u otro sistema
      
      // Para esta demostración, simplemente devolvemos éxito
      return res.status(200).json({ 
        success: true, 
        message: "Notificación enviada correctamente",
        notification: {
          id: Date.now(),
          title: validatedData.title,
          message: validatedData.message,
          type: validatedData.type === 'info' ? 'system' : 
                validatedData.type === 'success' ? 'reward' : 
                validatedData.type === 'warning' ? 'promo' : 'alert',
          read: false,
          createdAt: new Date().toISOString(),
          sentBy: req.user.id
        }
      });
    } catch (error) {
      console.error("Error sending admin notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de notificación inválidos", errors: error.errors });
      }
      return res.status(500).json({ message: "Error al enviar la notificación" });
    }
  });

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
      
      // Check if user is verified (KYC completed)
      if (!req.user.isVerified) {
        return res.status(403).json({ message: "KYC verification required before withdrawals" });
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

  // Roulette game routes
  
  // Generate a random roulette spin result (0-36)
  function generateRouletteResult(): number {
    return Math.floor(Math.random() * 37);
  }

  // Check if a roulette bet is valid and determine if it's a winner
  function checkRouletteBet(bet: any, winningNumber: number): { win: boolean; payout: number } {
    // Validate bet has required fields
    if (!bet || !bet.type || !bet.numbers || !bet.odds || !bet.amount) {
      return { win: false, payout: 0 };
    }
    
    // Check if the winning number is in the bet numbers
    const win = bet.numbers.includes(winningNumber);
    
    // Calculate payout based on bet amount and odds
    const payout = win ? bet.amount + (bet.amount * bet.odds) : 0;
    
    return { win, payout };
  }

  // Place a bet in roulette
  app.post("/api/games/roulette/bet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bet: z.object({
        id: z.string(),
        type: z.string(),
        numbers: z.array(z.number()),
        odds: z.number(),
        amount: z.number().min(5).max(10000)
      })
    });

    try {
      const { bet } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < bet.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error placing roulette bet:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Spin the roulette wheel
  app.post("/api/games/roulette/spin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const spinSchema = z.object({
      bets: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          numbers: z.array(z.number()),
          odds: z.number(),
          amount: z.number().min(5).max(10000)
        })
      )
    });

    try {
      const { bets } = spinSchema.parse(req.body);
      
      // Check if user has enough balance for all bets
      const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
      if (req.user.balance < totalBet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Generate the winning number
      const winningNumber = generateRouletteResult();
      
      // Color of the winning number
      const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const color = RED_NUMBERS.includes(winningNumber) 
        ? 'red' 
        : winningNumber === 0 
          ? 'green' 
          : 'black';
      
      // Process bets to find winners and calculate payouts
      let totalWin = 0;
      const winningBets = [];
      
      for (const bet of bets) {
        const { win, payout } = checkRouletteBet(bet, winningNumber);
        
        if (win) {
          totalWin += payout;
          winningBets.push({...bet, payout});
        }
      }
      
      // Update user balance: deduct all bets and add winnings
      const balanceChange = totalWin - totalBet;
      const updatedUser = await storage.updateUserBalance(req.user.id, balanceChange);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }
      
      // Record transactions
      await storage.createTransaction({
        userId: req.user.id,
        amount: -totalBet,
        type: "bet",
        gameType: "roulette"
      });
      
      if (totalWin > 0) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: totalWin,
          type: "win",
          gameType: "roulette"
        });
      }
      
      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "roulette",
        bet: totalBet,
        outcome: JSON.stringify({ winningNumber, color, bets }),
        multiplier: totalWin > 0 ? totalWin / totalBet : 0,
        win: totalWin > 0,
        winAmount: totalWin
      });
      
      res.json({
        number: winningNumber,
        color,
        winningBets,
        totalWin,
        balance: updatedUser.balance
      });
    } catch (error) {
      console.error("Error in roulette spin:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Blackjack game routes
  app.post("/api/games/blackjack/bet", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const betSchema = z.object({
        bet: z.number().min(10).max(10000),
      });

      const { bet } = betSchema.parse(req.body);

      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create a shuffled deck
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      let deck = [];

      for (const suit of suits) {
        for (const value of values) {
          deck.push({ suit, value });
        }
      }

      // Fisher-Yates shuffle
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      // Deal initial cards
      const playerHand = { cards: [deck.pop(), deck.pop()], value: 0 };
      const dealerHand = { 
        cards: [deck.pop(), { ...deck.pop(), hidden: true }], 
        value: 0 
      };

      // Calculate hand values
      function calculateHandValue(cards) {
        let value = 0;
        let aces = 0;
        
        for (const card of cards) {
          if (card.hidden) continue;
          
          if (card.value === 'A') {
            value += 11;
            aces++;
          } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
          } else {
            value += parseInt(card.value);
          }
        }
        
        // Adjust for aces if needed
        while (value > 21 && aces > 0) {
          value -= 10;
          aces--;
        }
        
        return value;
      }

      // Calculate initial values
      playerHand.value = calculateHandValue(playerHand.cards);
      dealerHand.value = calculateHandValue(dealerHand.cards);

      // Check for dealer blackjack possibility
      const dealerUpCard = dealerHand.cards[0];
      const canInsure = dealerUpCard.value === 'A';

      // Update user balance (deduct bet)
      const updatedUser = await storage.updateUserBalance(req.user.id, -bet);

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        description: "Blackjack bet",
        status: "completed",
        createdAt: new Date(),
      });

      res.json({
        playerHand,
        dealerHand,
        deck: deck.slice(0, 5), // Send a few cards for client-side operations
        balance: updatedUser.balance,
        canInsure,
      });
    } catch (error) {
      console.error("Error placing blackjack bet:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/games/blackjack/hit", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hitSchema = z.object({
        handIndex: z.number().default(0),
        currentCards: z.array(z.object({
          suit: z.string(),
          value: z.string(),
          hidden: z.boolean().optional(),
        })),
      });

      const { handIndex, currentCards } = hitSchema.parse(req.body);

      // Create a new card
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      
      const newCard = { suit, value };

      res.json({
        card: newCard,
        handIndex,
      });
    } catch (error) {
      console.error("Error on blackjack hit:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/games/blackjack/stand", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const standSchema = z.object({
        handIndex: z.number().default(0),
      });

      const { handIndex } = standSchema.parse(req.body);

      res.json({
        success: true,
        handIndex,
      });
    } catch (error) {
      console.error("Error on blackjack stand:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/games/blackjack/double", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const doubleSchema = z.object({
        bet: z.number().min(10).max(10000),
        handIndex: z.number().default(0),
        currentCards: z.array(z.object({
          suit: z.string(),
          value: z.string(),
          hidden: z.boolean().optional(),
        })),
      });

      const { bet, handIndex, currentCards } = doubleSchema.parse(req.body);

      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create a new card
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      
      const newCard = { suit, value };

      // Update user balance (deduct additional bet)
      const updatedUser = await storage.updateUserBalance(req.user.id, -bet);

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        description: "Blackjack double down",
        status: "completed",
        createdAt: new Date(),
      });

      res.json({
        card: newCard,
        handIndex,
        balance: updatedUser.balance,
      });
    } catch (error) {
      console.error("Error on blackjack double down:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/games/blackjack/end", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const endSchema = z.object({
        playerHands: z.array(z.object({
          cards: z.array(z.object({
            suit: z.string(),
            value: z.string(),
            hidden: z.boolean().optional(),
          })),
          value: z.number(),
          isBusted: z.boolean().optional(),
          isBlackjack: z.boolean().optional(),
        })),
        dealerHand: z.object({
          cards: z.array(z.object({
            suit: z.string(),
            value: z.string(),
            hidden: z.boolean().optional(),
          })),
          value: z.number(),
          isBusted: z.boolean().optional(),
          isBlackjack: z.boolean().optional(),
        }),
        bets: z.array(z.number()),
        results: z.array(z.enum(['win', 'lose', 'push'])),
        payouts: z.array(z.number()),
      });

      const { playerHands, dealerHand, bets, results, payouts } = endSchema.parse(req.body);

      // Calculate total payout
      const totalPayout = payouts.reduce((sum, amount) => sum + amount, 0);

      // Update user balance (add winnings)
      const updatedUser = await storage.updateUserBalance(req.user.id, totalPayout);

      // Record transaction if there are winnings
      if (totalPayout > 0) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: totalPayout,
          type: "win",
          description: "Blackjack winnings",
          status: "completed",
          createdAt: new Date(),
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "blackjack",
        bet: bets.reduce((sum, bet) => sum + bet, 0),
        result: JSON.stringify({
          playerHands,
          dealerHand,
          results,
          payouts,
        }),
        win: payouts.some(payout => payout > 0),
        winAmount: totalPayout,
        createdAt: new Date(),
      });

      res.json({
        balance: updatedUser.balance,
        success: true,
      });
    } catch (error) {
      console.error("Error ending blackjack game:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Sports betting routes
  
  // Get all upcoming sports events with filters
  app.get("/api/sports/events", async (req, res) => {
    try {
      const sportType = req.query.sportType as string | undefined;
      const status = req.query.status as string | undefined;
      
      // Si estamos utilizando la API externa, obtenemos los datos de ella
      try {
        // Importar las funciones desde sports-api.ts
        const { fetchOdds, generateDemoEvents } = await import('../client/src/lib/sports-api');
        
        // Intentar obtener eventos de la API externa
        try {
          const allSports = ['soccer', 'basketball', 'baseball', 'football', 'tennis', 'mma', 'hockey'];
          const allEvents = [];
          
          // Solo intentamos con soccer para ahorrar peticiones de API
          const sportEvents = await fetchOdds('soccer', 'upcoming', 'es');
          allEvents.push(...sportEvents);
          
          if (allEvents.length > 0) {
            return res.json({ events: allEvents });
          } else {
            throw new Error("No se encontraron eventos");
          }
        } catch (apiError) {
          console.error("Error o sin datos de la API externa, usando datos de demostración:", apiError);
          
          // Generamos datos de demostración
          const demoEvents = generateDemoEvents();
          
          // Filtramos por tipo de deporte si es necesario
          const filteredEvents = sportType
            ? demoEvents.filter(event => event.sport_key.includes(sportType))
            : demoEvents;
          
          return res.json({ events: filteredEvents });
        }
      } catch (error) {
        console.error("Error general en el endpoint:", error);
        
        // Como último recurso, intentamos con los datos almacenados localmente
        const events = await storage.getSportsEvents(sportType, status);
        res.json({ events });
      }
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

  // User wallet address management endpoints
  
  // Get user wallet addresses
  app.get("/api/user/wallet-addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        btcAddress: user.btcAddress || "",
        ethAddress: user.ethAddress || ""
      });
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });
  
  // Update user wallet addresses
  app.patch("/api/user/wallet-addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const walletSchema = z.object({
      btcAddress: z.string().min(1).optional(),
      ethAddress: z.string().min(1).optional()
    });
    
    try {
      const { btcAddress, ethAddress } = walletSchema.parse(req.body);
      
      // Create update object with only provided values
      const updates: Record<string, string> = {};
      if (btcAddress !== undefined) updates.btcAddress = btcAddress;
      if (ethAddress !== undefined) updates.ethAddress = ethAddress;
      
      // Update user profile
      const updatedUser = await storage.updateUserProfile(req.user.id, updates);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update wallet addresses" });
      }
      
      res.json({
        btcAddress: updatedUser.btcAddress || "",
        ethAddress: updatedUser.ethAddress || ""
      });
    } catch (error) {
      console.error("Error updating wallet addresses:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wallet address data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update wallet addresses" });
    }
  });

  // Admin routes
  // Get all users - admin only
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.status(200).json(users.map(user => {
        // Remove sensitive data
        const { password, ...safeUser } = user;
        return safeUser;
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID - admin only
  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update user (edit user info) - admin only
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user balance if changed
      if (userData.balance !== undefined && userData.balance !== existingUser.balance) {
        await storage.updateUserBalance(userId, userData.balance - existingUser.balance);
      }
      
      // Update other user properties
      const updatedUser = await storage.updateUserProfile(userId, userData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Ban a user - admin only
  app.post("/api/admin/users/ban", isAdmin, async (req, res) => {
    try {
      const banSchema = z.object({
        userId: z.number(),
        reason: z.string().min(1).max(500).optional(),
      });
      
      const { userId, reason } = banSchema.parse(req.body);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.banUser(userId, reason || 'Violated platform rules');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });
  
  // Unban a user - admin only
  app.post("/api/admin/users/unban", isAdmin, async (req, res) => {
    try {
      const unbanSchema = z.object({
        userId: z.number()
      });
      
      const { userId } = unbanSchema.parse(req.body);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.unbanUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });
  
  // Toggle admin status - admin only
  app.post("/api/admin/users/toggle-admin", isAdmin, async (req, res) => {
    try {
      const adminSchema = z.object({
        userId: z.number(),
        makeAdmin: z.boolean()
      });
      
      const { userId, makeAdmin } = adminSchema.parse(req.body);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.setUserAdminStatus(userId, makeAdmin);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });
  
  // Toggle verification status - admin only
  app.post("/api/admin/users/toggle-verification", isAdmin, async (req, res) => {
    try {
      const verifySchema = z.object({
        userId: z.number(),
        verify: z.boolean()
      });
      
      const { userId, verify } = verifySchema.parse(req.body);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      let user;
      if (verify) {
        user = await storage.verifyUser(userId);
      } else {
        // Use updateUserProfile to remove verification
        const existingUser = await storage.getUser(userId);
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }
        user = await storage.updateUserProfile(userId, { ...existingUser, isVerified: false });
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  // Este endpoint ya está implementado arriba (línea ~864)
  // Usamos el endpoint /api/admin/users/unban en su lugar
  // para evitar duplicados

  // Reset a user's password - admin only
  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const passwordSchema = z.object({
        newPassword: z.string().min(6).max(100),
      });
      
      const { newPassword } = passwordSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For simplicity, we'll use the provided password directly
      // In a real app, we would hash it first
      const updatedUser = await storage.updatePassword(userId, newPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      res.status(200).json({ 
        message: "Password reset successfully"
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Make a user an admin - admin only
  app.post("/api/admin/users/:id/make-admin", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.isAdmin) {
        return res.status(400).json({ message: "User is already an admin" });
      }
      
      const updatedUser = await storage.setUserAdminStatus(userId, true);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update admin status" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      res.status(200).json({ 
        message: "User promoted to admin successfully", 
        user: safeUser 
      });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Remove admin rights - admin only
  app.post("/api/admin/users/:id/remove-admin", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow removing yourself as admin
      if (req.user && userId === req.user.id) {
        return res.status(403).json({ message: "Cannot remove your own admin rights" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.isAdmin) {
        return res.status(400).json({ message: "User is not an admin" });
      }
      
      const updatedUser = await storage.setUserAdminStatus(userId, false);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update admin status" });
      }
      
      // Remove sensitive data
      const { password, ...safeUser } = updatedUser;
      res.status(200).json({ 
        message: "Admin rights removed successfully", 
        user: safeUser 
      });
    } catch (error) {
      console.error("Error removing admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Get all transactions - admin only
  app.get("/api/admin/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get all game history - admin only
  app.get("/api/admin/game-history", isAdmin, async (req, res) => {
    try {
      const gameHistory = await storage.getAllGameHistory();
      res.status(200).json(gameHistory);
    } catch (error) {
      console.error("Error fetching game history:", error);
      res.status(500).json({ message: "Failed to fetch game history" });
    }
  });

  // Get all KYC documents - admin only
  app.get("/api/admin/kyc-documents", isAdmin, async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.status(200).json(kycDocuments);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  // Approve KYC document - admin only
  app.post("/api/admin/kyc/approve", isAdmin, async (req, res) => {
    try {
      const schema = z.object({
        documentId: z.number()
      });
      
      const { documentId } = schema.parse(req.body);
      
      const updatedDoc = await storage.updateKycDocumentStatus(documentId, "approved");
      if (!updatedDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Also verify the user
      if (updatedDoc.userId) {
        await storage.verifyUser(updatedDoc.userId);
      }
      
      res.status(200).json({ 
        message: "Document approved successfully", 
        document: updatedDoc 
      });
    } catch (error) {
      console.error("Error approving KYC document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });
  
  // Reject KYC document - admin only
  app.post("/api/admin/kyc/reject", isAdmin, async (req, res) => {
    try {
      const schema = z.object({
        documentId: z.number(),
        rejectionReason: z.string().min(1).max(500)
      });
      
      const { documentId, rejectionReason } = schema.parse(req.body);
      
      const updatedDoc = await storage.updateKycDocumentStatus(documentId, "rejected", rejectionReason);
      if (!updatedDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(200).json({ 
        message: "Document rejected successfully", 
        document: updatedDoc 
      });
    } catch (error) {
      console.error("Error rejecting KYC document:", error);
      res.status(500).json({ message: "Failed to reject document" });
    }
  });
  
  // Update KYC document status - admin only (legacy)
  app.post("/api/admin/kyc-documents/:id/status", isAdmin, async (req, res) => {
    try {
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const statusSchema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        rejectionReason: z.string().optional(),
      });
      
      const { status, rejectionReason } = statusSchema.parse(req.body);
      
      const updatedDoc = await storage.updateKycDocumentStatus(docId, status, rejectionReason);
      if (!updatedDoc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(200).json({ 
        message: "Document status updated successfully", 
        document: updatedDoc 
      });
    } catch (error) {
      console.error("Error updating KYC document status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Admin dashboard statistics - admin only
  app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
    try {
      // Get counts
      const users = await storage.getAllUsers();
      const transactions = await storage.getAllTransactions();
      const gameHistory = await storage.getAllGameHistory();
      const kycDocuments = await storage.getAllKycDocuments();
      
      // Calculate revenue (all bets - all wins)
      let totalBets = 0;
      let totalWins = 0;
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      
      transactions.forEach(tx => {
        if (tx.type === 'bet') {
          totalBets += Math.abs(tx.amount);
        } else if (tx.type === 'win') {
          totalWins += tx.amount;
        } else if (tx.type === 'deposit') {
          totalDeposits += tx.amount;
        } else if (tx.type === 'withdraw') {
          totalWithdrawals += Math.abs(tx.amount);
        }
      });
      
      // Game statistics
      const gameStats = {
        slots: {
          totalGames: 0,
          totalBets: 0,
          totalWins: 0,
        },
        dice: {
          totalGames: 0,
          totalBets: 0,
          totalWins: 0,
        },
        crash: {
          totalGames: 0,
          totalBets: 0,
          totalWins: 0,
        },
        sports: {
          totalBets: 0,
          totalPending: 0,
          totalWon: 0,
          totalLost: 0,
        }
      };
      
      gameHistory.forEach(game => {
        const gameType = game.gameType as 'slots' | 'dice' | 'crash';
        
        if (gameStats[gameType]) {
          gameStats[gameType].totalGames++;
          gameStats[gameType].totalBets += game.bet;
          
          if (game.win) {
            gameStats[gameType].totalWins += game.winAmount;
          }
        }
      });
      
      res.status(200).json({
        users: {
          total: users.length,
          verified: users.filter(u => u.isVerified).length,
          admins: users.filter(u => u.isAdmin).length,
          banned: users.filter(u => u.isBanned).length,
        },
        transactions: {
          total: transactions.length,
          totalBets,
          totalWins,
          totalDeposits,
          totalWithdrawals,
          houseProfit: totalBets - totalWins,
        },
        gameHistory: {
          total: gameHistory.length,
          ...gameStats
        },
        kyc: {
          total: kycDocuments.length,
          pending: kycDocuments.filter(doc => doc.verificationStatus === 'pending').length,
          approved: kycDocuments.filter(doc => doc.verificationStatus === 'approved').length,
          rejected: kycDocuments.filter(doc => doc.verificationStatus === 'rejected').length,
        }
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin setup - create an admin user if none exists (this route is publicly accessible)
  app.post("/api/admin/setup", async (req, res) => {
    try {
      // Check if any admin exists
      const users = await storage.getAllUsers();
      const adminExists = users.some(user => user.isAdmin);
      
      if (adminExists) {
        return res.status(403).json({ message: "Admin already exists" });
      }
      
      const setupSchema = z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6).max(100),
      });
      
      const { username, email, password } = setupSchema.parse(req.body);
      
      // Create a new user with admin rights
      // First, check if email or username already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password,
      });
      
      // Make user an admin
      const adminUser = await storage.setUserAdminStatus(user.id, true);
      
      // Remove sensitive data
      if (adminUser) {
        const { password, ...safeUser } = adminUser;
        return res.status(201).json({ 
          message: "Admin user created successfully", 
          user: safeUser 
        });
      } else {
        return res.status(500).json({ message: "Failed to set admin status" });
      }
    } catch (error) {
      console.error("Error setting up admin:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setup data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to setup admin" });
    }
  });

  // Play roulette game
  app.post("/api/games/roulette", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bets: z.array(
        z.object({
          type: z.enum([
            'number', 'split', 'street', 'corner', 'sixline', 
            'dozen', 'column', 'color', 'evenOdd', 'highLow'
          ]),
          value: z.union([z.string(), z.number()]),
          amount: z.number().min(10).max(10000),
          odds: z.number().min(1).max(35)
        })
      ),
      totalAmount: z.number().min(10)
    });

    try {
      const { bets, totalAmount } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < totalAmount) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }

      // Generate winning number (0-36)
      const number = Math.floor(Math.random() * 37);
      
      // Determine color
      let color: 'red' | 'black' | 'green';
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      
      if (number === 0) {
        color = 'green';
      } else if (redNumbers.includes(number)) {
        color = 'red';
      } else {
        color = 'black';
      }

      // Process each bet to check if it's a winner
      let totalWin = 0;
      const winningBets = [];
      
      for (const bet of bets) {
        let win = false;
        
        // Check if the bet is a winner based on its type and the winning number
        switch (bet.type) {
          case 'number':
            win = number === Number(bet.value);
            break;
            
          case 'split': {
            const numbers = String(bet.value).split(',').map(n => parseInt(n.trim()));
            win = numbers.includes(number);
            break;
          }
            
          case 'street': {
            const numbers = String(bet.value).split(',').map(n => parseInt(n.trim()));
            win = numbers.includes(number);
            break;
          }
            
          case 'corner': {
            const numbers = String(bet.value).split(',').map(n => parseInt(n.trim()));
            win = numbers.includes(number);
            break;
          }
            
          case 'sixline': {
            const numbers = String(bet.value).split(',').map(n => parseInt(n.trim()));
            win = numbers.includes(number);
            break;
          }
            
          case 'dozen':
            if (number === 0) {
              win = false;
            } else if (bet.value === 'first') {
              win = number >= 1 && number <= 12;
            } else if (bet.value === 'second') {
              win = number >= 13 && number <= 24;
            } else if (bet.value === 'third') {
              win = number >= 25 && number <= 36;
            }
            break;
            
          case 'column':
            if (number === 0) {
              win = false;
            } else {
              const firstColumn = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
              const secondColumn = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
              const thirdColumn = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
              
              if (bet.value === 'first') {
                win = firstColumn.includes(number);
              } else if (bet.value === 'second') {
                win = secondColumn.includes(number);
              } else if (bet.value === 'third') {
                win = thirdColumn.includes(number);
              }
            }
            break;
            
          case 'color':
            win = bet.value === color;
            break;
            
          case 'evenOdd':
            if (number === 0) {
              win = false;
            } else {
              const isEven = number % 2 === 0;
              win = (bet.value === 'even' && isEven) || (bet.value === 'odd' && !isEven);
            }
            break;
            
          case 'highLow':
            if (number === 0) {
              win = false;
            } else {
              win = (bet.value === 'low' && number >= 1 && number <= 18) || 
                   (bet.value === 'high' && number >= 19 && number <= 36);
            }
            break;
        }
        
        if (win) {
          const winAmount = bet.amount * bet.odds;
          totalWin += winAmount;
          winningBets.push(bet);
        }
      }
      
      // Update user balance
      // First deduct the total bet amount
      let userBalanceChange = -totalAmount;
      // Then add any winnings
      userBalanceChange += totalWin;
      
      const updatedUser = await storage.updateUserBalance(req.user.id, userBalanceChange);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Record transactions
      // First the bet transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -totalAmount,
        type: "bet",
        gameType: "roulette"
      });

      // Then any win transaction
      if (totalWin > 0) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: totalWin,
          type: "win",
          gameType: "roulette"
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "roulette",
        bet: totalAmount,
        outcome: JSON.stringify({ number, color, winningBets }),
        multiplier: totalWin > 0 ? totalWin / totalAmount : 0,
        win: totalWin > 0,
        winAmount: totalWin
      });

      res.json({
        number,
        color,
        winningBets,
        totalWin,
        balance: updatedUser.balance
      });
    } catch (error) {
      console.error("Roulette game error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  const httpServer = createServer(app);
  // Favorites routes
  
  // Get user's favorites
  app.get("/api/favorites", async (req, res) => {
    // Para el demo vamos a usar un userId fijo para no requerir autenticación
    // En una implementación real, esto debería hacerse con autenticación
    const userId = req.isAuthenticated() ? req.user.id : 1;
    
    try {
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  
  // Add a favorite
  app.post("/api/favorites", async (req, res) => {
    // Para el demo vamos a usar un userId fijo para no requerir autenticación
    // En una implementación real, esto debería hacerse con autenticación
    const userId = req.isAuthenticated() ? req.user.id : 1;
    
    try {
      const favoriteData = insertFavoriteSchema.parse(req.body);
      
      // Sobreescribimos el userId para asegurarnos de que sea el correcto
      favoriteData.userId = userId;
      
      // Check if this is already a favorite
      const isAlreadyFavorite = await storage.isFavorite(
        userId,
        favoriteData.gameType,
        favoriteData.gameId || undefined
      );
      
      if (isAlreadyFavorite) {
        return res.status(400).json({ message: "This is already in your favorites" });
      }
      
      const favorite = await storage.createFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });
  
  // Check if a game is a favorite
  app.get("/api/favorites/check", async (req, res) => {
    // Para el demo vamos a usar un userId fijo para no requerir autenticación
    // En una implementación real, esto debería hacerse con autenticación
    const userId = req.isAuthenticated() ? req.user.id : 1;
    
    const checkSchema = z.object({
      gameType: z.string(),
      gameId: z.string().optional()
    });
    
    try {
      const query = checkSchema.parse(req.query);
      const isFavorite = await storage.isFavorite(
        userId,
        query.gameType,
        query.gameId
      );
      
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });
  
  // Remove a favorite
  app.delete("/api/favorites/:id", async (req, res) => {
    // Para el demo vamos a usar un userId fijo para no requerir autenticación
    // En una implementación real, esto debería hacerse con autenticación
    const userId = req.isAuthenticated() ? req.user.id : 1;
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if the favorite exists
      const favorite = await storage.getFavorite(id);
      if (!favorite) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      // En una implementación real, verificaríamos que el favorito pertenece al usuario
      // Pero para el demo, vamos a permitir eliminar cualquier favorito
      
      const removed = await storage.removeFavorite(id);
      if (removed) {
        res.status(200).json({ message: "Favorite removed successfully" });
      } else {
        res.status(500).json({ message: "Failed to remove favorite" });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

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
