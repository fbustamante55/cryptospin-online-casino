import { v4 as uuidv4 } from 'uuid';
import { Game } from './Game';
import { RouletteGame } from './RouletteGame';
import { BlackjackGame } from './BlackjackGame';
import { SlotMachineGame } from './SlotMachineGame';
import { HorseBettingGame } from './HorseBettingGame';

/**
 * Interface representing a game session with metadata
 */
interface GameSession {
  game: Game;
  createdAt: number;
  lastAccessed: number;
}

/**
 * Manages all game instances and provides methods to interact with them.
 */
export class GameManager {
  private games: Map<string, GameSession>;
  private readonly MAX_IDLE_TIME = 3600; // 1 hour in seconds

  constructor() {
    this.games = new Map<string, GameSession>();
    
    // Cleanup old sessions periodically (every 5 minutes)
    setInterval(() => {
      this.cleanUpSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Get a list of all available games with their information.
   */
  getAvailableGames(): Array<Record<string, any>> {
    return [
      new RouletteGame().getGameInfo(),
      new BlackjackGame().getGameInfo(),
      new SlotMachineGame().getGameInfo(),
      new HorseBettingGame().getGameInfo()
    ];
  }

  /**
   * Create a new game instance and return its ID and initial state.
   */
  createGame(gameName: string): Record<string, any> {
    let game: Game;

    // Create the appropriate game instance based on the game name
    switch (gameName.toLowerCase()) {
      case 'roulette':
        game = new RouletteGame();
        break;
      case 'blackjack':
        game = new BlackjackGame();
        break;
      case 'slots':
      case 'slot-machine':
        game = new SlotMachineGame();
        break;
      case 'horse-betting':
      case 'horse-race':
        game = new HorseBettingGame();
        break;
      default:
        throw new Error(`Unknown game type: ${gameName}`);
    }

    // Generate a unique ID for this game instance
    const gameId = uuidv4();

    // Store the game instance with metadata
    this.games.set(gameId, {
      game,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });

    // Get the initial game state
    const initialState = game.startGame();

    // Return the game ID and initial state
    return {
      game_id: gameId,
      game_type: this.getGameName(game),
      game_state: initialState
    };
  }

  /**
   * Get the current state of a game.
   */
  getGameState(gameId: string): Record<string, any> {
    const session = this.games.get(gameId);
    if (!session) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Update last accessed time
    session.lastAccessed = Date.now();
    
    // Return the game state
    return {
      game_type: this.getGameName(session.game),
      ...session.game.getState()
    };
  }

  /**
   * Process a player's move in a game.
   */
  makeMove(gameId: string, action: Record<string, any>): Record<string, any> {
    const session = this.games.get(gameId);
    if (!session) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Update last accessed time
    session.lastAccessed = Date.now();

    // Process the move
    try {
      const moveResult = session.game.makeMove(action);
      return {
        game_id: gameId,
        game_type: this.getGameName(session.game),
        ...moveResult
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        game_state: session.game.getState()
      };
    }
  }

  /**
   * Get the name of the game from its class.
   */
  private getGameName(gameInstance: Game): string {
    const gameInfo = gameInstance.getGameInfo();
    return gameInfo.name || 'Unknown Game';
  }

  /**
   * Clean up old sessions if there are too many.
   */
  cleanUpSessions(maxSessions: number = 1000): void {
    if (this.games.size <= maxSessions) {
      return;
    }

    const now = Date.now();
    
    // Convert map entries to array for sorting
    const sessions = Array.from(this.games.entries()).map(([id, session]) => ({
      id,
      lastAccessed: session.lastAccessed,
      age: now - session.createdAt
    }));

    // Sort by last accessed time (oldest first)
    sessions.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest sessions until we're under the limit
    const toRemove = sessions.slice(0, sessions.length - maxSessions);
    for (const session of toRemove) {
      this.games.delete(session.id);
    }

    // Additionally, remove any session that's been idle for too long
    for (const [id, session] of this.games.entries()) {
      const idleTime = (now - session.lastAccessed) / 1000;
      if (idleTime > this.MAX_IDLE_TIME) {
        this.games.delete(id);
      }
    }
  }
}