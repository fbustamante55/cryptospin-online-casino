import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { 
  insertTransactionSchema, 
  insertGameHistorySchema, 
  insertSportsBetSchema, 
  insertSportsEventSchema,
  insertFavoriteSchema,
  slotSpinSchema,
  slotDoubleUpSchema,
  slotCollectSchema
} from "@shared/schema";

// Import types for type safety
import type { 
  SlotGame,
  SlotSession 
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

// Initialize default slot games for testing
async function initializeDefaultSlotGames() {
  try {
    // 1. Classic 3-reel slot game
    const existingClassic = await storage.getSlotGame("classic3reel");
    if (!existingClassic) {
      await storage.createSlotGame({
        gameId: "classic3reel",
        name: "Classic 3-Reel",
        provider: "inhouse",
        description: "A classic 3-reel slot machine with traditional fruit symbols.",
        thumbnail: "/images/slots/classic3reel.png",
        paylines: 1,
        reels: 3,
        minBet: 1,
        maxBet: 100,
        rtp: 95.0,
        volatility: "medium",
        features: ["basic"],
        symbols: {
          "cherry": { payout: { 3: 10 } },
          "lemon": { payout: { 3: 20 } },
          "orange": { payout: { 3: 30 } },
          "plum": { payout: { 3: 40 } },
          "bell": { payout: { 3: 50 } },
          "bar": { payout: { 3: 100, "bar-bar-any": 50 } },
          "seven": { payout: { 3: 500, "seven-seven-any": 100 } }
        },
        isActive: true
      });
      console.log("Created default classic3reel slot game");
    }

    // 2. Egyptian-themed slot game
    const existingEgyptian = await storage.getSlotGame("book_of_treasures");
    if (!existingEgyptian) {
      await storage.createSlotGame({
        gameId: "book_of_treasures",
        name: "Book of Treasures",
        provider: "AGT",
        description: "Journey through ancient Egypt and discover the mysterious Book of Treasures with expanding symbols and free spins.",
        thumbnail: "/images/slots/book_of_treasures.png",
        paylines: 10,
        reels: 5,
        minBet: 10,
        maxBet: 500,
        rtp: 96.5,
        volatility: "high",
        features: ["free_spins", "expanding_symbols", "scatter"],
        symbols: {
          "BOOK": { payout: { 3: 20, 4: 100, 5: 500 }, isScatter: true, triggersFeature: "free_spins" },
          "PHARAOH": { payout: { 2: 5, 3: 50, 4: 250, 5: 1000 }, isExpanding: true },
          "ANKH": { payout: { 3: 20, 4: 80, 5: 400 } },
          "EYE": { payout: { 3: 15, 4: 70, 5: 300 } },
          "SCARAB": { payout: { 3: 15, 4: 70, 5: 300 } },
          "PYRAMID": { payout: { 3: 10, 4: 50, 5: 200 } },
          "HIEROGLYPH": { payout: { 3: 10, 4: 40, 5: 150 } },
          "SPHINX": { payout: { 3: 5, 4: 30, 5: 100 } },
          "DEITY": { payout: { 3: 5, 4: 25, 5: 80 } },
          "SUN": { payout: { 3: 5, 4: 25, 5: 80 } }
        },
        isActive: true
      });
      console.log("Created Book of Treasures Egyptian slot game");
    }

    // 3. Fruit slot with multipliers
    const existingFruit = await storage.getSlotGame("fruity_multipliers");
    if (!existingFruit) {
      await storage.createSlotGame({
        gameId: "fruity_multipliers",
        name: "Fruity Multipliers",
        provider: "NetEnt",
        description: "Classic fruit symbols with modern multiplier mechanics for potentially massive wins.",
        thumbnail: "/images/slots/fruity_multipliers.png",
        paylines: 20,
        reels: 5,
        minBet: 5,
        maxBet: 200,
        rtp: 96.0,
        volatility: "medium",
        features: ["multipliers", "wilds", "respins"],
        symbols: {
          "WILD": { payout: { 3: 30, 4: 100, 5: 500 }, isWild: true, multiplier: 2 },
          "STAR": { payout: { 3: 25, 4: 75, 5: 300 }, isScatter: true, triggersFeature: "respins" },
          "WATERMELON": { payout: { 3: 15, 4: 50, 5: 250 } },
          "GRAPES": { payout: { 3: 15, 4: 45, 5: 200 } },
          "ORANGE": { payout: { 3: 10, 4: 40, 5: 150 } },
          "LEMON": { payout: { 3: 10, 4: 35, 5: 125 } },
          "CHERRY": { payout: { 3: 5, 4: 25, 5: 100 } },
          "PLUM": { payout: { 3: 5, 4: 20, 5: 75 } }
        },
        isActive: true
      });
      console.log("Created Fruity Multipliers slot game");
    }

    // 4. Jackpot game
    const existingJackpot = await storage.getSlotGame("mega_fortune");
    if (!existingJackpot) {
      await storage.createSlotGame({
        gameId: "mega_fortune", 
        name: "Mega Fortune",
        provider: "BetSoft",
        description: "Luxury-themed slot with progressive jackpots and free spins. Spin the Wheel of Fortune to win one of three jackpots!",
        thumbnail: "/images/slots/mega_fortune.png",
        paylines: 25,
        reels: 5,
        minBet: 25,
        maxBet: 1000,
        rtp: 94.0,
        volatility: "very high",
        features: ["jackpot", "free_spins", "wheel_bonus"],
        symbols: {
          "WHEEL": { payout: { 3: 20, 4: 100, 5: 300 }, isScatter: true, triggersFeature: "wheel_bonus" },
          "YACHT": { payout: { 2: 5, 3: 30, 4: 150, 5: 750 } },
          "LIMOUSINE": { payout: { 3: 25, 4: 100, 5: 500 } },
          "CHAMPAGNE": { payout: { 3: 20, 4: 75, 5: 300 } },
          "RING": { payout: { 3: 15, 4: 50, 5: 200 } },
          "WATCH": { payout: { 3: 10, 4: 40, 5: 150 } },
          "MONEY": { payout: { 3: 5, 4: 25, 5: 100 } },
          "WILD": { payout: { 3: 50, 4: 500, 5: 2500 }, isWild: true }
        },
        isActive: true
      });
      console.log("Created Mega Fortune jackpot slot game");
    }

    // 5. Gemstone-themed slot
    const existingGems = await storage.getSlotGame("jewel_cascade");
    if (!existingGems) {
      await storage.createSlotGame({
        gameId: "jewel_cascade",
        name: "Jewel Cascade",
        provider: "AGT",
        description: "Sparkling jewels cascade down the reels, creating multiple winning opportunities with each spin.",
        thumbnail: "/images/slots/jewel_cascade.png",
        paylines: 50,
        reels: 5,
        minBet: 10,
        maxBet: 300,
        rtp: 97.0,
        volatility: "medium",
        features: ["cascading_reels", "multipliers", "wilds"],
        symbols: {
          "DIAMOND": { payout: { 3: 20, 4: 75, 5: 300 } },
          "RUBY": { payout: { 3: 15, 4: 60, 5: 250 } },
          "EMERALD": { payout: { 3: 15, 4: 50, 5: 200 } },
          "SAPPHIRE": { payout: { 3: 10, 4: 40, 5: 150 } },
          "TOPAZ": { payout: { 3: 10, 4: 35, 5: 125 } },
          "AMETHYST": { payout: { 3: 5, 4: 25, 5: 100 } },
          "PEARL": { payout: { 3: 5, 4: 20, 5: 75 } },
          "WILD_GEM": { payout: { 3: 25, 4: 100, 5: 500 }, isWild: true }
        },
        isActive: true
      });
      console.log("Created Jewel Cascade slot game");
    }

  } catch (error) {
    console.error("Failed to initialize default slot games:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Initialize default slot games
  await initializeDefaultSlotGames();
  
  // Rutas para Space Explorer (crash game con temática espacial)
  app.post('/api/games/crash/bet', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { bet, autoCashout } = req.body;
      
      // Validación básica
      if (!bet || isNaN(bet) || bet <= 0) {
        return res.status(400).json({ success: false, error: 'Apuesta inválida' });
      }
      
      // Obtener usuario
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      // Verificar balance
      if (user.balance < bet) {
        return res.status(400).json({ success: false, error: 'Balance insuficiente' });
      }
      
      // Generar punto de crash aleatorio (entre 1.00 y 20.00)
      // Usar algoritmo simple para demo
      const crashPoint = generateCrashPoint();
      
      // Deducir apuesta del saldo del usuario
      await storage.updateUserBalance(user.id, -bet);
      
      // Crear transacción
      await storage.createTransaction({
        userId: user.id,
        type: 'bet',
        amount: bet,
        gameType: 'crash',
        gameData: { action: 'bet', game: 'Space Explorer' }
      });
      
      // Devolver resultado
      return res.json({
        success: true,
        bet,
        crashPoint,
        autoCashout: autoCashout || null,
        balance: user.balance
      });
    } catch (error) {
      console.error('Error en apuesta de crash:', error);
      return res.status(500).json({ success: false, error: 'Error en el servidor' });
    }
  });

  app.post('/api/games/crash/cashout', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { bet, crashPoint, cashoutPoint } = req.body;
      
      // Validación básica
      if (!bet || !crashPoint || !cashoutPoint) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }
      
      // Verificar que el cashout sea válido (antes del crash)
      if (cashoutPoint >= crashPoint) {
        return res.status(400).json({ success: false, error: 'Cashout inválido' });
      }
      
      // Calcular ganancia
      const winAmount = Math.floor(bet * cashoutPoint);
      
      // Obtener usuario
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      // Actualizar balance
      const updatedUser = await storage.updateUserBalance(user.id, winAmount);
      
      // Crear transacción
      await storage.createTransaction({
        userId: user.id,
        type: 'win',
        amount: winAmount,
        gameType: 'crash',
        gameData: { 
          action: 'win', 
          game: 'Space Explorer', 
          multiplier: cashoutPoint.toFixed(2) 
        }
      });
      
      // Crear historial de juego
      await storage.createGameHistory({
        userId: user.id,
        gameType: 'crash',
        bet: bet,
        winAmount: winAmount,
        outcome: JSON.stringify({ 
          crashPoint, 
          cashoutPoint, 
          bet 
        }),
        win: true,
        multiplier: cashoutPoint
      });
      
      // Devolver resultado
      return res.json({
        success: true,
        cashoutPoint,
        winAmount,
        balance: user.balance
      });
    } catch (error) {
      console.error('Error en cashout de crash:', error);
      return res.status(500).json({ success: false, error: 'Error en el servidor' });
    }
  });

  app.post('/api/games/crash/bust', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { bet, crashPoint } = req.body;
      
      // Validación básica
      if (!bet || !crashPoint) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }
      
      // Crear historial de juego (pérdida)
      await storage.createGameHistory({
        userId: req.user!.id,
        gameType: 'crash',
        bet: bet,
        winAmount: 0,
        outcome: JSON.stringify({ 
          crashPoint, 
          cashoutPoint: 0, 
          bet 
        }),
        win: false,
        multiplier: crashPoint
      });
      
      // Devolver resultado
      return res.json({
        success: true
      });
    } catch (error) {
      console.error('Error en bust de crash:', error);
      return res.status(500).json({ success: false, error: 'Error en el servidor' });
    }
  });

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
  
  /**
   * @route POST /api/wallet/deduct
   * @desc Deduct credits from user's wallet (used for placing bets)
   * @body { amount: number, gameType: string, gameId: string }
   */
  app.post("/api/wallet/deduct", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const deductSchema = z.object({
      amount: z.number().positive("Bet amount must be positive"),
      gameType: z.string(),
      gameId: z.string().optional()
    });
    
    try {
      const { amount, gameType, gameId } = deductSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get current user and check balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.balance < amount) {
        return res.status(400).json({
          error: "Insufficient funds",
          balance: user.balance,
          required: amount
        });
      }
      
      // Deduct amount
      const updatedUser = await storage.updateUserBalance(userId, -amount);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update balance" });
      }
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "bet",
        amount,
        gameType,
        gameData: gameId ? { gameId } : undefined
      });
      
      // Return updated balance
      return res.json({
        success: true,
        previousBalance: user.balance,
        deducted: amount,
        currentBalance: updatedUser.balance
      });
      
    } catch (error) {
      console.error("Error deducting from wallet:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      return res.status(500).json({ 
        error: "An error occurred while processing your request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  /**
   * @route POST /api/wallet/add
   * @desc Add credits to user's wallet (used for winnings)
   * @body { amount: number, gameType: string, gameId: string, outcome: string }
   */
  app.post("/api/wallet/add", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const addSchema = z.object({
      amount: z.number().positive("Amount must be positive"),
      gameType: z.string(),
      gameId: z.string().optional(),
      outcome: z.string().optional()
    });
    
    try {
      const { amount, gameType, gameId, outcome } = addSchema.parse(req.body);
      const userId = req.user.id;
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Add amount
      const updatedUser = await storage.updateUserBalance(userId, amount);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update balance" });
      }
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "win",
        amount,
        gameType,
        gameData: gameId ? { gameId, outcome } : undefined
      });
      
      // Return updated balance
      return res.json({
        success: true,
        previousBalance: user.balance,
        added: amount,
        currentBalance: updatedUser.balance
      });
      
    } catch (error) {
      console.error("Error adding to wallet:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      return res.status(500).json({ 
        error: "An error occurred while processing your request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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
    // Para propósitos de prueba, en un entorno real esto debería requerir autenticación
    let user = null;
    if (req.isAuthenticated()) {
      user = req.user;
    } else {
      // Crear un usuario ficticio para pruebas, solo en entorno de desarrollo
      user = {
        id: 999,
        username: "test_user",
        email: "test@example.com",
        balance: 10000,
        isAdmin: false,
        isVerified: true,
        isBanned: false,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      console.log("Usando usuario de prueba para slots:", user.username);
    }
    
    const betSchema = z.object({
      bet: z.number().min(0.5).max(10000),
      lines: z.number().min(1).max(50).default(9), // Soporte para Book of Egypt (10 líneas) y 50 Gems (50 líneas)
      gameId: z.string().optional(),
      reels: z.number().min(3).max(5).default(5),
      rows: z.number().min(3).max(4).default(3)
    });

    try {
      const { bet, lines, gameId, reels, rows } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Generate result using the new function
      const reelsResult = generateSlotsResult(reels, rows);
      
      // Calculate win using the new function
      const { isWin, winAmount } = calculateSlotsWin(reelsResult, bet, lines);
      
      // Calculate multiplier (for game history)
      const multiplier = isWin ? winAmount / bet : 0;
      
      // Update user balance
      let updatedUser;
      if (req.isAuthenticated()) {
        // Usuario real autenticado - se guarda en BD
        const amountChange = isWin ? winAmount - bet : -bet;
        updatedUser = await storage.updateUserBalance(user.id, amountChange);
        
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update balance" });
        }

        // Record transaction
        await storage.createTransaction({
          userId: user.id,
          amount: -bet,
          type: "bet",
          gameType: "slots",
          gameData: { action: 'bet', game: gameId ? `Slots - ${gameId}` : "Slots" }
        });

        if (isWin) {
          await storage.createTransaction({
            userId: user.id,
            amount: winAmount,
            type: "win",
            gameType: "slots",
            gameData: { action: 'win', game: gameId ? `Slots - ${gameId}` : "Slots" }
          });
        }

        // Record game history
        await storage.createGameHistory({
          userId: user.id,
          gameType: "slots",
          gameId: gameId,
          bet,
          outcome: JSON.stringify(reelsResult),
          multiplier,
          win: isWin,
          winAmount: isWin ? winAmount : 0
        });
      } else {
        // Usuario ficticio para pruebas - no se guarda en BD
        const amountChange = isWin ? winAmount - bet : -bet;
        user.balance += amountChange;
        console.log(`Actualizado saldo ficticio: ${user.balance}`);
        updatedUser = user;
      }

      res.json({
        reels: reelsResult,
        win: isWin,
        winLines: [], // En la versión mejorada podríamos devolver qué líneas ganaron
        multiplier,
        winAmount: isWin ? winAmount : 0,
        balance: updatedUser.balance
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid request" });
    }
  });
  
  // Play keno game
  app.post("/api/games/keno", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const betSchema = z.object({
      bet: z.number().min(10).max(10000),
      selectedNumbers: z.array(z.number().min(1).max(80)).min(1).max(10),
      gameId: z.string().default('americankeno')
    });

    try {
      const { bet, selectedNumbers, gameId } = betSchema.parse(req.body);
      
      // Check if user has enough balance
      if (req.user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Generate 20 random winning numbers
      const winningNumbers = generateKenoNumbers();
      
      // Count how many numbers match
      const matchCount = selectedNumbers.filter(num => winningNumbers.includes(num)).length;
      
      // Calculate win amount
      const { isWin, winAmount } = calculateKenoWin(matchCount, selectedNumbers.length, bet, gameId);
      
      // Update user balance
      const amountChange = isWin ? winAmount - bet : -bet;
      const updatedUser = await storage.updateUserBalance(req.user.id, amountChange);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update balance" });
      }

      // Calculate effective multiplier for game history
      const multiplier = isWin ? winAmount / bet : 0;

      // Record transaction
      await storage.createTransaction({
        userId: req.user.id,
        amount: -bet,
        type: "bet",
        gameType: "keno",
        gameData: { action: 'bet', game: `Keno - ${gameId}` }
      });

      if (isWin) {
        await storage.createTransaction({
          userId: req.user.id,
          amount: winAmount,
          type: "win",
          gameType: "keno",
          gameData: { action: 'win', game: `Keno - ${gameId}` }
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "keno",
        gameId: gameId,
        bet,
        outcome: JSON.stringify({ 
          selected: selectedNumbers, 
          winning: winningNumbers, 
          matches: matchCount 
        }),
        multiplier,
        win: isWin,
        winAmount: isWin ? winAmount : 0
      });

      res.json({
        selectedNumbers,
        winningNumbers,
        matchCount,
        win: isWin,
        multiplier,
        winAmount: isWin ? winAmount : 0,
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
        gameData: { action: 'bet', game: 'Blackjack' }
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
        gameData: { action: 'double_down', game: 'Blackjack' }
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
          gameData: { action: 'win', game: 'Blackjack' }
        });
      }

      // Record game history
      await storage.createGameHistory({
        userId: req.user.id,
        gameType: "blackjack",
        bet: bets.reduce((sum, bet) => sum + bet, 0),
        outcome: JSON.stringify({
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
  
  // Endpoint para proporcionar la API key de manera segura al cliente
  app.get('/api/sports/apikey', (req, res) => {
    try {
      // Usa la variable de entorno ODDS_API_KEY y ODDS_API_WIDGET_KEY
      const apiKey = process.env.ODDS_API_KEY;
      const widgetKey = process.env.ODDS_API_WIDGET_KEY;
      
      if (!apiKey) {
        console.error("¡ODDS_API_KEY no está configurada en las variables de entorno!");
        return res.status(500).json({ error: "API key no configurada" });
      }
      
      return res.json({ 
        apiKey,
        widgetKey: widgetKey || ''
      });
    } catch (error) {
      console.error("Error al obtener API key:", error);
      return res.status(500).json({ error: "Error al obtener API key" });
    }
  });
  
  // Ruta para obtener información detallada de un evento específico
  app.get('/api/sports/event/:eventId', async (req, res) => {
    try {
      const eventId = req.params.eventId;
      
      // Primero, intenta obtener eventos reales desde la API externa o usar los eventos almacenados temporalmente
      try {
        // Obtenemos todos los eventos
        const response = await fetch("http://localhost:5000/api/sports/events");
        const eventsData = await response.json();
        
        if (eventsData && eventsData.events && eventsData.events.length > 0) {
          // Buscar el evento por ID
          const event = eventsData.events.find(e => e.id === eventId);
          
          if (event) {
            return res.json({ event });
          }
        }
      } catch (apiError) {
        console.error("Error al obtener eventos desde la API:", apiError);
      }
      
      // Si no se encontró el evento, crear un evento ficticio para no mostrar error
      // Esto es útil para demostración y testing
      const mockEvent = {
        id: eventId,
        sport_key: "soccer_fifa_world_cup",
        sport_title: "Copa Mundial FIFA",
        commence_time: new Date().toISOString(),
        home_team: "Equipo Local",
        away_team: "Equipo Visitante",
        bookmakers: [{
          key: "betway",
          title: "Betway",
          last_update: new Date().toISOString(),
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Equipo Local", price: 1.95 },
                { name: "Equipo Visitante", price: 3.75 },
                { name: "Draw", price: 3.15 }
              ]
            },
            {
              key: "spreads",
              outcomes: [
                { name: "Equipo Local", price: 1.90, point: -1.5 },
                { name: "Equipo Visitante", price: 1.90, point: 1.5 }
              ]
            },
            {
              key: "totals",
              outcomes: [
                { name: "Over", price: 1.85, point: 2.5 },
                { name: "Under", price: 1.95, point: 2.5 }
              ]
            }
          ]
        }]
      };
      
      return res.json({ event: mockEvent });
    } catch (error) {
      console.error('Error fetching event details:', error);
      res.status(500).json({ error: 'Failed to fetch event details' });
    }
  });
  
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
          
          // Usamos la API key directamente para evitar peticiones innecesarias
          const apiKey = process.env.ODDS_API_KEY;
          if (!apiKey) {
            throw new Error("API key no configurada en variables de entorno");
          }
          
          // Solo intentamos con soccer para ahorrar peticiones de API
          const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`);
          
          if (!response.ok) {
            throw new Error(`Error de API: ${response.status}`);
          }
          
          const sportEvents = await response.json();
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

  // ========== SLOTOPOL SLOT MACHINE API ROUTES ==========
  
  /**
   * @route GET /api/slots/games
   * @desc Get all available slot games
   */
  app.get("/api/slots/games", async (req, res) => {
    try {
      const provider = req.query.provider as string | undefined;
      const games = await storage.getAllSlotGames(provider);
      return res.json({ games });
    } catch (error) {
      console.error("Error getting slot games:", error);
      return res.status(500).json({ error: "Failed to retrieve slot games" });
    }
  });
  
  /**
   * @route POST /api/slots/games
   * @desc Create a new slot game
   */
  app.post("/api/slots/games", async (req, res) => {
    try {
      // Define the slot game creation schema
      const createSlotGameSchema = z.object({
        gameId: z.string().min(3),
        name: z.string().min(3),
        provider: z.string(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
        paylines: z.number().int().min(1),
        reels: z.number().int().min(3).max(5),
        minBet: z.number().min(1),
        maxBet: z.number().min(1),
        rtp: z.number().min(80).max(99),
        volatility: z.enum(["low", "medium", "high"]),
        features: z.any().optional(),
        symbols: z.any().optional(),
        isActive: z.boolean().optional()
      });
      
      const gameData = createSlotGameSchema.parse(req.body);
      const game = await storage.createSlotGame(gameData);
      
      return res.status(201).json({ 
        message: "Slot game created successfully", 
        game 
      });
    } catch (error) {
      console.error("Error creating slot game:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid slot game data", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({ 
        error: "Failed to create slot game",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * @route GET /api/slots/games/:id
   * @desc Get details of a specific slot game
   */
  app.get("/api/slots/games/:id", async (req, res) => {
    try {
      const gameId = req.params.id;
      const game = await storage.getSlotGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: "Slot game not found" });
      }
      
      return res.json({ game });
    } catch (error) {
      console.error("Error getting slot game:", error);
      return res.status(500).json({ error: "Failed to retrieve slot game details" });
    }
  });

  /**
   * @route POST /api/slots/spin
   * @desc Spin a slot machine and get the result
   * @body { gameId: string, bet: number, lines: number }
   */
  app.post("/api/slots/spin", async (req, res) => {
    try {
      console.log("Processing slot spin request:", req.body);
      // For authenticated users use their real ID, otherwise use test ID
      const userId = req.isAuthenticated() ? req.user.id : 999;
      
      // Get user (authenticated or test)
      let user = null;
      if (userId === 999) {
        // Test user for demo purposes
        user = {
          id: 999,
          username: "test_user",
          balance: 10000
        };
        console.log("Using test user for slots:", user.username);
      } else {
        user = await storage.getUser(userId);
        console.log("Found authenticated user:", user?.username);
        if (!user) {
          console.error("User not found with ID:", userId);
          return res.status(404).json({ error: "User not found" });
        }
      }
      
      // Validate input data
      console.log("Validating spin data...");
      let spinData;
      try {
        spinData = slotSpinSchema.parse(req.body);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ 
          error: "Invalid spin data", 
          details: validationError instanceof z.ZodError ? 
            validationError.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            })) : 
            "Unknown validation error"
        });
      }
      
      const { gameId, bet, lines } = spinData;
      console.log("Validated spin data:", { gameId, bet, lines });
      
      // Additional validation for bet amount
      if (bet <= 0) {
        console.error("Invalid bet amount:", bet);
        return res.status(400).json({ error: "Bet amount must be greater than zero" });
      }
      
      // Get the game
      console.log("Fetching game with ID:", gameId);
      const game = await storage.getSlotGame(gameId);
      if (!game) {
        console.error("Game not found with ID:", gameId);
        return res.status(404).json({ error: "Slot game not found" });
      }
      console.log("Found game:", game.name, "Min/Max bet:", game.minBet, game.maxBet);
      
      // Check if the bet is valid
      const totalBet = bet * lines;
      console.log("Checking bet limits - Current bet:", bet, "Min:", game.minBet, "Max:", game.maxBet);
      if (bet < game.minBet || bet > game.maxBet) {
        console.error("Invalid bet amount:", bet, "outside range:", game.minBet, "-", game.maxBet);
        return res.status(400).json({ 
          error: `Invalid bet amount. Must be between ${game.minBet} and ${game.maxBet}` 
        });
      }
      
      // Check if the user has enough balance
      console.log("Checking balance - User balance:", user.balance, "Total bet:", totalBet);
      if (user.balance < totalBet) {
        console.error("Insufficient balance:", user.balance, "< Total bet:", totalBet);
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Get or create user session for this game
      let session = null;
      if (userId !== 999) {
        const userSessions = await storage.getUserSlotSessions(userId);
        session = userSessions.find(s => s.gameId === gameId && s.isActive);
        
        if (!session) {
          // Create new session
          session = await storage.createSlotSession({
            userId,
            gameId,
            currentBet: bet,
            selectedLines: lines,
          });
        } else {
          // Update existing session
          session = await storage.updateSlotSession(session.id, {
            currentBet: bet,
            selectedLines: lines,
          }) as SlotSession;
        }
      }

      // ======== GAME CONFIGURATION ========
      // Define symbols, probabilities, and payout structure based on game type
      let symbols;
      let symbolWeights;

      // Check if the game is Egypt-themed
      if (game.name.toLowerCase().includes('egypt') || game.provider.toLowerCase().includes('egypt')) {
        // Egypt-themed symbols
        symbols = ["BOOK", "PHARAOH", "ANKH", "EYE", "SCARAB", "PYRAMID", "SUN", "WILD"];
        
        // Weights/probabilities for each symbol (higher number = higher probability)
        symbolWeights = {
          "ANKH": 15,
          "EYE": 15,
          "SCARAB": 12,
          "PYRAMID": 12,
          "SUN": 10,
          "PHARAOH": 8,
          "WILD": 5,
          "BOOK": 5  // least common (jackpot symbol)
        };
      } else {
        // Classic symbols for other games
        symbols = ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven"];
        
        // Weights/probabilities for each symbol
        symbolWeights = {
          "cherry": 15, // Match Python implementation weight
          "lemon": 15,
          "orange": 10,
          "plum": 10,
          "bell": 10,
          "bar": 10,
          "seven": 5   // least common (jackpot symbol)
        };
      }

      // Payout multipliers for winning combinations
      let payouts: Record<string, number> = {};
      
      // Set payouts based on game type
      if (game.name.toLowerCase().includes('egypt') || game.provider.toLowerCase().includes('egypt')) {
        // Egypt-themed payouts
        payouts = {
          // Exact matches (all three symbols the same)
          "BOOK-BOOK-BOOK": 500,    // Jackpot
          "PHARAOH-PHARAOH-PHARAOH": 100,
          "ANKH-ANKH-ANKH": 50,
          "EYE-EYE-EYE": 40,
          "SCARAB-SCARAB-SCARAB": 30,
          "PYRAMID-PYRAMID-PYRAMID": 25,
          "SUN-SUN-SUN": 20,
          "WILD-WILD-WILD": 75,
          
          // Partial matches (first two symbols the same, third can be any)
          "BOOK-BOOK-any": 100,
          "PHARAOH-PHARAOH-any": 30,
          "WILD-WILD-any": 25,
          
          // Special combinations (for bonus features)
          "WILD-BOOK-WILD": 50,
          "BOOK-WILD-BOOK": 50
        };
      } else {
        // Classic slot payouts
        payouts = {
          // Exact matches (all three symbols the same)
          "cherry-cherry-cherry": 10,
          "lemon-lemon-lemon": 20,
          "orange-orange-orange": 30,
          "plum-plum-plum": 40,
          "bell-bell-bell": 50,
          "bar-bar-bar": 100,
          "seven-seven-seven": 500,  // jackpot
          
          // Partial matches (first two symbols the same, third can be any)
          "bar-bar-any": 50,
          "seven-seven-any": 100
        };
      }

      // Create a cumulative distribution for weighted random selection
      const populateSymbolsArray = () => {
        const population: string[] = [];
        for (const symbol of symbols) {
          const weight = symbolWeights[symbol as keyof typeof symbolWeights];
          for (let i = 0; i < weight; i++) {
            population.push(symbol);
          }
        }
        return population;
      };

      // Population array for random selection
      const symbolsPopulation = populateSymbolsArray();

      // Function to select a random symbol based on weights
      const selectRandomSymbol = () => {
        const randomIndex = Math.floor(Math.random() * symbolsPopulation.length);
        return symbolsPopulation[randomIndex];
      };

      // Spin the reels
      const reels = [
        selectRandomSymbol(),
        selectRandomSymbol(), 
        selectRandomSymbol()
      ];
      
      console.log(`Game '${game.name}' (${game.gameId}) using symbols:`, symbols);
      console.log(`Spin result: ${reels.join(', ')}`);
      
      // ======== PAYOUT CALCULATION ========
      // Determine winnings based on the reels combination
      let winAmount = 0;
      const reelsCombination = reels.join('-');
      
      // Check for exact 3-symbol combinations first
      if (payouts[reelsCombination as keyof typeof payouts]) {
        winAmount = bet * payouts[reelsCombination as keyof typeof payouts];
        console.log(`Exact match found: ${reelsCombination}, Payout: ${payouts[reelsCombination as keyof typeof payouts]}x`);
      } 
      // Check for special combinations
      else if (game.name.toLowerCase().includes('egypt') && 
              ((reels[0] === 'WILD' && reels[1] === 'BOOK' && reels[2] === 'WILD') || 
               (reels[0] === 'BOOK' && reels[1] === 'WILD' && reels[2] === 'BOOK'))) {
        const specialKey = reels.join('-') as keyof typeof payouts;
        if (payouts[specialKey]) {
          winAmount = bet * payouts[specialKey];
          console.log(`Special combination found: ${specialKey}, Payout: ${payouts[specialKey]}x`);
        }
      }
      // Check for partial match combinations (first two symbols match)
      else if (reels[0] === reels[1]) {
        const partialMatchKey = `${reels[0]}-${reels[0]}-any` as keyof typeof payouts;
        if (payouts[partialMatchKey]) {
          winAmount = bet * payouts[partialMatchKey];
          console.log(`Partial match found: ${partialMatchKey}, Payout: ${payouts[partialMatchKey]}x`);
        }
      }
      
      // Calculate multiplier (for game history)
      const multiplier = winAmount > 0 ? winAmount / totalBet : 0;
      
      // Update user balance
      const balanceChange = winAmount - totalBet;
      let updatedUser;
      
      if (userId !== 999) {
        // Real authenticated user - save to DB
        updatedUser = await storage.updateUserBalance(userId, balanceChange);
        
        if (!updatedUser) {
          return res.status(500).json({ error: "Failed to update balance" });
        }
        
        // Create transaction records
        await storage.createTransaction({
          userId,
          type: "bet",
          amount: totalBet,
          gameType: "slot",
          gameData: { gameId, bet, lines }
        });
        
        if (winAmount > 0) {
          await storage.createTransaction({
            userId,
            type: "win",
            amount: winAmount,
            gameType: "slot",
            gameData: { gameId, reels, bet, lines }
          });
        }
        
        // Create a game history record
        await storage.createGameHistory({
          userId,
          gameType: "slot",
          gameId,
          bet: totalBet,
          outcome: JSON.stringify(reels),
          win: winAmount > 0,
          winAmount,
          multiplier
        });
        
        // Update session with results
        if (session) {
          await storage.updateSlotSession(session.id, {
            lastOutcome: JSON.stringify(reels),
            lastWin: winAmount,
            totalWagered: (session.totalWagered || 0) + totalBet,
            totalWon: (session.totalWon || 0) + winAmount
          });
        }
      } else {
        // Test user - don't save to DB
        user.balance += balanceChange;
        updatedUser = user;
      }

      // Return response (format similar to Python implementation)
      return res.json({
        reels,
        bet,
        lines,
        totalBet,
        winnings: winAmount, // Using "winnings" to match Python implementation
        winAmount, // Keep existing field for backward compatibility
        balance: updatedUser.balance,
        isWin: winAmount > 0,
        sessionId: session?.id || null,
        multiplier
      });
      
    } catch (error) {
      console.error("Error spinning slot machine:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      // Better error handling similar to Python implementation
      return res.status(500).json({ 
        error: "An unexpected error occurred while processing your slot spin",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * @route POST /api/slots/collect
   * @desc Collect winnings from a slot session
   * @body { gameId: string, sessionId: number }
   */
  app.post("/api/slots/collect", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userId = req.user.id;
      const collectData = slotCollectSchema.parse(req.body);
      const { gameId, sessionId } = collectData;
      
      // Get the session
      const session = await storage.getSlotSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Verify session belongs to user and matches the game
      if (session.userId !== userId || session.gameId !== gameId) {
        return res.status(403).json({ error: "Unauthorized - This session does not belong to you" });
      }
      
      // Close the session
      await storage.updateSlotSession(sessionId, { isActive: false });
      
      return res.json({
        success: true,
        message: "Winnings collected successfully",
        totalWon: session.totalWon,
        totalWagered: session.totalWagered
      });
      
    } catch (error) {
      console.error("Error collecting slot winnings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({ 
        error: "An unexpected error occurred while processing your collection request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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

// Nota: La función generateReelResult ya no se utiliza como principal,
// se mantiene para compatibilidad con código existente
function generateReelResult(): string {
  const symbols = ["7", "BAR", "STAR", "BELL", "CHERRY", "LEMON", "PLUM", "WATERMELON"];
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex];
}

// Función renombrada para evitar conflictos
function calculateOldSlotsWin(reels: string[], bet: number): { win: boolean; multiplier: number; winAmount: number } {
  // Esta función está obsoleta, use calculateSlotsWin con la nueva implementación
  console.warn("Usando versión obsoleta de calculateSlotsWin, actualice al nuevo formato");
  
  // Simulamos comportamiento similar al original
  if (reels.length >= 3 && reels[0] === reels[1] && reels[1] === reels[2]) {
    const multiplier = reels[0] === "7" ? 10 : 
                      reels[0] === "BAR" ? 5 : 
                      reels[0] === "CHERRY" ? 2.5 : 2;
    return { 
      win: true, 
      multiplier: multiplier, 
      winAmount: Math.floor(bet * multiplier) 
    };
  }
  
  // No win
  return { win: false, multiplier: 0, winAmount: 0 };
}

// Esta función fue reemplazada por la versión mejorada al final del archivo

// Casino games utilities
/**
 * Genera una matriz de símbolos para una máquina tragamonedas
 * @param reels Número de carretes (columnas)
 * @param rows Número de filas visibles
 * @returns Una matriz con los símbolos generados
 */
function generateSlotsResult(reels: number = 5, rows: number = 3): string[][] {
  const symbols = ['7', 'BAR', 'STAR', 'BELL', 'CHERRY', 'LEMON', 'PLUM', 'WATERMELON', 'WILD', 'SCATTER'];
  // Asignar pesos a los símbolos (mayor número = menor probabilidad)
  const weights: Record<string, number> = {
    '7': 20,       // más raro
    'BAR': 15,
    'STAR': 15,
    'BELL': 12,
    'CHERRY': 10,
    'LEMON': 8,
    'PLUM': 8,
    'WATERMELON': 8,
    'WILD': 25,     // el más raro
    'SCATTER': 18
  };
  
  // Total de pesos para normalizar
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  // Generar resultado
  const result: string[][] = [];
  
  for (let r = 0; r < reels; r++) {
    const reel: string[] = [];
    for (let row = 0; row < rows; row++) {
      // Seleccionar un símbolo basado en su peso
      let randomWeight = Math.random() * totalWeight;
      let selectedSymbol = symbols[0];
      
      for (const symbol of symbols) {
        randomWeight -= weights[symbol];
        if (randomWeight <= 0) {
          selectedSymbol = symbol;
          break;
        }
      }
      
      reel.push(selectedSymbol);
    }
    result.push(reel);
  }
  
  return result;
}

/**
 * Calcula el resultado de una jugada de tragamonedas
 * @param reels Resultado de los carretes
 * @param bet Apuesta realizada
 * @param lines Número de líneas jugadas
 * @returns Objeto con información sobre si se ganó, multiplicador y cantidad ganada
 */
function calculateSlotsWin(reels: string[][], bet: number, lines: number = 9): { isWin: boolean, winAmount: number } {
  // Definir las líneas de pago (para un juego 5x3 con 9 líneas)
  const paylines: number[][] = [
    [1, 1, 1, 1, 1], // línea central horizontal
    [0, 0, 0, 0, 0], // línea superior horizontal
    [2, 2, 2, 2, 2], // línea inferior horizontal
    [0, 1, 2, 1, 0], // V
    [2, 1, 0, 1, 2], // Λ
    [0, 0, 1, 2, 2], // diagonal descendente 1
    [2, 2, 1, 0, 0], // diagonal descendente 2
    [0, 1, 1, 1, 0], // forma de diamante 1
    [2, 1, 1, 1, 2]  // forma de diamante 2
  ];
  
  // Limitar las líneas al máximo disponible
  const activeLines = Math.min(lines, paylines.length);
  
  // Definir pagos por símbolo (cantidad de símbolos consecutivos)
  const symbolPay: Record<string, number[]> = {
    '7': [0, 0, 5, 20, 100],
    'BAR': [0, 0, 4, 15, 75],
    'STAR': [0, 0, 4, 15, 75],
    'BELL': [0, 0, 3, 10, 50],
    'CHERRY': [0, 0, 3, 10, 50],
    'LEMON': [0, 0, 2, 5, 25],
    'PLUM': [0, 0, 2, 5, 25],
    'WATERMELON': [0, 0, 2, 5, 25],
    'WILD': [0, 0, 10, 50, 500],
    'SCATTER': [0, 2, 5, 20, 100] // los scatters pagan en cualquier posición
  };
  
  let totalWin = 0;
  let hasScatter = 0;
  
  // Contar SCATTERS (pagan en cualquier posición)
  reels.forEach(reel => {
    reel.forEach(symbol => {
      if (symbol === 'SCATTER') hasScatter++;
    });
  });
  
  // Pago por scatter
  if (hasScatter >= 2) {
    totalWin += bet * symbolPay['SCATTER'][Math.min(hasScatter, 5) - 1];
  }
  
  // Comprobar cada línea de pago activa
  for (let l = 0; l < activeLines; l++) {
    const payline = paylines[l];
    const lineSymbols: string[] = [];
    
    // Obtener los símbolos en esta línea
    for (let r = 0; r < reels.length; r++) {
      const rowIdx = payline[r];
      if (rowIdx >= 0 && rowIdx < reels[r].length) {
        lineSymbols.push(reels[r][rowIdx]);
      }
    }
    
    // Contar símbolos consecutivos desde la izquierda
    let currentSymbol = lineSymbols[0];
    let count = 1;
    let hasWild = currentSymbol === 'WILD';
    
    for (let i = 1; i < lineSymbols.length; i++) {
      const symbol = lineSymbols[i];
      
      // El WILD puede sustituir a cualquier símbolo excepto SCATTER
      if (symbol === 'WILD') {
        hasWild = true;
        if (currentSymbol !== 'SCATTER') {
          count++;
        } else {
          break; // WILD no sustituye a SCATTER
        }
      } 
      else if (symbol === currentSymbol || (currentSymbol === 'WILD' && symbol !== 'SCATTER')) {
        count++;
        if (currentSymbol === 'WILD') currentSymbol = symbol;
      } 
      else {
        break; // Secuencia interrumpida
      }
    }
    
    // WILD tiene su propio pago si forma una línea completa de WILDs
    if (currentSymbol === 'WILD' && hasWild) {
      totalWin += bet * symbolPay['WILD'][Math.min(count, 5) - 1] / activeLines;
    } 
    // Calcular el pago para esta línea (excepto SCATTER que ya se calculó)
    else if (currentSymbol !== 'SCATTER' && count >= 2) {
      totalWin += bet * symbolPay[currentSymbol][Math.min(count, 5) - 1] / activeLines;
    }
  }
  
  // Redondear para evitar errores de punto flotante
  totalWin = Math.round(totalWin * 100) / 100;
  
  return {
    isWin: totalWin > 0,
    winAmount: totalWin
  };
}

/**
 * Genera 20 números aleatorios para un juego de keno
 * @returns Array con 20 números enteros únicos entre 1 y 80
 */
function generateKenoNumbers(): number[] {
  const numbers: number[] = [];
  while (numbers.length < 20) {
    const num = Math.floor(Math.random() * 80) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

/**
 * Calcula las ganancias para un juego de keno
 * @param matchCount Número de coincidencias
 * @param selectedCount Número de números seleccionados por el jugador
 * @param bet Cantidad apostada
 * @param gameId Tipo de juego de keno
 * @returns Objeto con información sobre si se ganó y cantidad ganada
 */
function calculateKenoWin(matchCount: number, selectedCount: number, bet: number, gameId: string = 'americankeno'): { isWin: boolean, winAmount: number } {
  // Tabla de pagos para diferentes tipos de keno
  const paytables: Record<string, Record<number, number[]>> = {
    // American Keno paytable
    americankeno: {
      1: [0, 3],
      2: [0, 1, 9],
      3: [0, 1, 2, 16],
      4: [0, 0.5, 2, 6, 12],
      5: [0, 0.5, 1, 3, 15, 50],
      6: [0, 0.5, 1, 2, 3, 30, 75],
      7: [0, 0.5, 0.5, 1, 6, 12, 36, 100],
      8: [0, 0.5, 0.5, 1, 3, 6, 19, 90, 720],
      9: [0, 0.5, 0.5, 1, 2, 4, 8, 20, 80, 1200],
      10: [0, 0, 0.5, 1, 2, 3, 5, 10, 30, 600, 1800]
    },
    // Fire Keno - multiplicadores más altos
    firekeno: {
      1: [0, 3.5],
      2: [0, 1.2, 10],
      3: [0, 1, 2.5, 18],
      4: [0, 0.5, 2.2, 7, 14],
      5: [0, 0.5, 1.5, 3.5, 18, 60],
      6: [0, 0.5, 1.2, 2.2, 4, 40, 90],
      7: [0, 0.5, 0.8, 1.5, 8, 15, 50, 150],
      8: [0, 0.5, 0.8, 1.2, 4, 8, 25, 120, 850],
      9: [0, 0.5, 0.8, 1, 3, 5, 10, 30, 100, 1500],
      10: [0, 0, 0.8, 1.2, 3, 4, 7, 15, 40, 800, 2500]
    }
  };
  
  // Usar paytable de americankeno por defecto si no se reconoce el gameId
  const gamePaytable = paytables[gameId] || paytables.americankeno;
  
  // Si hay más selecciones de las que soporta la tabla, usar el máximo disponible
  const effectiveSelectedCount = Math.min(selectedCount, Object.keys(gamePaytable).length);
  
  // Si hay más coincidencias que selecciones, algo está mal
  if (matchCount > effectiveSelectedCount) {
    return { isWin: false, winAmount: 0 };
  }
  
  // Obtener multiplicador según la tabla de pagos
  const multiplier = gamePaytable[effectiveSelectedCount][matchCount];
  
  // Calcular ganancia
  const winAmount = bet * multiplier;
  
  return {
    isWin: winAmount > 0,
    winAmount: Math.round(winAmount * 100) / 100 // Redondear a 2 decimales
  };
}

// Función para generar punto de crash para Space Explorer
function generateCrashPoint(): number {
  // Algoritmo simple para fines demostrativos
  // En producción, se usaría un algoritmo criptográficamente seguro
  
  // Generar un número aleatorio entre 0 y 1
  const r = Math.random();
  
  // Para tener una buena distribución con sesgo exponencial
  let point;
  
  if (r < 0.01) {
    // 1% probabilidad de crash inmediato (1.00x)
    point = 1.00;
  } else if (r < 0.65) {
    // 64% probabilidad de crash entre 1.00x y 2.00x
    point = 1.00 + Math.random();
  } else if (r < 0.90) {
    // 25% probabilidad de crash entre 2.00x y 5.00x
    point = 2.00 + Math.random() * 3;
  } else if (r < 0.98) {
    // 8% probabilidad de crash entre 5.00x y 10.00x
    point = 5.00 + Math.random() * 5;
  } else {
    // 2% probabilidad de crash entre 10.00x y 20.00x
    point = 10.00 + Math.random() * 10;
  }
  
  // Redondear a 2 decimales
  return Math.round(point * 100) / 100;
}
