/**
 * Base class for all casino games.
 * Provides a common interface that all games must implement.
 */
export abstract class Game {
  /**
   * Get information about the game (name, type, description, etc.)
   * @returns Basic game information
   */
  abstract getGameInfo(): Record<string, any>;

  /**
   * Start a new game instance and return the initial state.
   * @returns Initial game state
   */
  abstract startGame(): Record<string, any>;

  /**
   * Process a player's move in the game.
   * @param action The action to take
   * @returns Updated game state after the move
   */
  abstract makeMove(action: Record<string, any>): Record<string, any>;

  /**
   * Get the current state of the game.
   * @returns Current game state
   */
  abstract getState(): Record<string, any>;
}