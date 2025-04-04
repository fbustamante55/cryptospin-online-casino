import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { GameManager } from './GameManager';
import { createGameSchema, makeMoveSchema, gameActionSchema } from './schema';
import { storage } from '../storage';

/**
 * Set up the casino game routes
 * @param app Express app instance
 */
export function setupCasinoRoutes(app: Express) {
  // Create a singleton instance of the GameManager
  const gameManager = new GameManager();

  // Get list of available games
  app.get('/api/casino/games', (req: Request, res: Response) => {
    try {
      const games = gameManager.getAvailableGames();
      res.json({ games });
    } catch (error) {
      console.error('Error getting available games:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve available games',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Start a new game
  app.post('/api/casino/games', async (req: Request, res: Response) => {
    try {
      // Validate request
      const { game_type } = createGameSchema.parse(req.body);

      // Create new game
      const gameData = gameManager.createGame(game_type);

      // Get user info for balance updating
      let userId = 0;
      let initialBalance = 1000;

      if (req.isAuthenticated()) {
        userId = req.user.id;
        initialBalance = req.user.balance;
        
        // Record activity
        await storage.createUserActivity({
          userId,
          activityType: 'game_start',
          ipAddress: req.ip || null,
          deviceInfo: req.headers['user-agent'] || null,
          location: null,
          details: JSON.stringify({
            gameType: game_type,
            gameId: gameData.game_id
          })
        });
      }

      res.json({
        ...gameData,
        user_balance: initialBalance
      });
    } catch (error) {
      console.error('Error starting new game:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      res.status(500).json({ 
        error: 'Failed to start game',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get game state
  app.get('/api/casino/games/:gameId', (req: Request, res: Response) => {
    try {
      const gameId = req.params.gameId;
      const gameState = gameManager.getGameState(gameId);
      res.json({ game_state: gameState });
    } catch (error) {
      console.error(`Error getting game state for ${req.params.gameId}:`, error);
      res.status(404).json({ 
        error: 'Game not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Make a move in a game
  app.post('/api/casino/games/:gameId/move', async (req: Request, res: Response) => {
    try {
      const gameId = req.params.gameId;
      
      // Get game state first to make sure it exists
      const currentState = gameManager.getGameState(gameId);
      
      // Log request body for debugging
      console.log('Request body:', JSON.stringify(req.body));
      
      // Use the makeMoveSchema to validate the request first (not the specific game action schema)
      const action = makeMoveSchema.parse(req.body);
      
      // Make the move
      const result = gameManager.makeMove(gameId, action);
      
      // Handle case where the move is illegal or has an error
      if (result.error) {
        return res.status(400).json({ 
          error: result.error,
          game_state: result.game_state
        });
      }
      
      // If the user is authenticated, we need to sync their balance
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        const previousBalance = req.user.balance;
        const newBalance = result.balance || currentState.balance;
        
        // Only update if the balance has changed
        if (previousBalance !== newBalance) {
          const balanceDiff = newBalance - previousBalance;
          
          // Update user balance in database
          const updatedUser = await storage.updateUserBalance(userId, balanceDiff);
          
          if (!updatedUser) {
            return res.status(500).json({ error: 'Failed to update user balance' });
          }
          
          // Record transaction
          const isWin = balanceDiff > 0;
          if (isWin) {
            await storage.createTransaction({
              userId,
              amount: balanceDiff,
              type: 'win',
              gameType: determineGameType(gameId),
              gameData: { action: action.move, gameId }
            });
          } else {
            await storage.createTransaction({
              userId,
              amount: -Math.abs(balanceDiff),
              type: 'bet',
              gameType: determineGameType(gameId),
              gameData: { action: action.move, gameId }
            });
          }
          
          // Record game history for completed games
          if (result.game_state === 'complete') {
            await storage.createGameHistory({
              userId,
              gameType: determineGameType(gameId),
              gameId,
              bet: Math.abs(balanceDiff),
              outcome: JSON.stringify(result),
              win: isWin,
              winAmount: isWin ? balanceDiff : 0
            });
          }
        }
      }
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error(`Error making move in game ${req.params.gameId}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      res.status(500).json({ 
        error: 'Failed to make move',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Helper function to determine game type from game ID
function determineGameType(gameId: string): string {
  // This is a simplification - in a real implementation,
  // we would query the game instance to get its type
  return 'casino';
}