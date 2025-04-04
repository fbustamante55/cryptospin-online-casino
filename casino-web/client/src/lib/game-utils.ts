// Game utility functions for casino games

/**
 * Generates a random number between min and max (inclusive)
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formats a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Calculates win amount based on bet and multiplier
 */
export function calculateWinAmount(bet: number, multiplier: number): number {
  return Math.floor(bet * multiplier);
}

/**
 * Calculates the win probability for dice game
 */
export function calculateDiceWinProbability(target: number, isOver: boolean): number {
  return isOver ? (100 - target) : target;
}

/**
 * Calculates the multiplier for dice game based on win probability
 * Includes house edge
 */
export function calculateDiceMultiplier(target: number, isOver: boolean, houseEdge: number = 1.5): number {
  const winProbability = calculateDiceWinProbability(target, isOver);
  return (100 - houseEdge) / winProbability;
}

/**
 * Generates a random crash point with house edge
 * Most rounds crash at low multipliers (1x-3x)
 * Some rounds go to medium multipliers (3x-10x)
 * Rarely goes to high multipliers (10x+)
 */
export function generateCrashPoint(houseEdge: number = 3): number {
  // Random number between 0 and 1
  const r = Math.random();
  
  // Formula based on a modified exponential distribution
  // Higher houseEdge means lower average multipliers
  const houseEdgeFactor = 1 - (houseEdge / 100);
  const crashPoint = Math.max(1, Math.floor((100 * houseEdgeFactor / (1 - r * houseEdgeFactor)) / 100 * 100) / 100);
  
  return parseFloat(crashPoint.toFixed(2));
}

/**
 * Slot machine symbols and their probabilities
 */
export const slotSymbols = ["7", "BAR", "2xBAR", "3xBAR", "CHERRY", "LEMON", "ORANGE", "PLUM"];

export const slotPayouts = {
  "7": { match3: 10 },
  "BAR": { match3: 5 },
  "2xBAR": { match3: 4 },
  "3xBAR": { match3: 3 },
  "CHERRY": { match3: 2.5, match2: 1.2 },
  "LEMON": { match3: 2 },
  "ORANGE": { match3: 2 },
  "PLUM": { match3: 2 },
};

/**
 * Determines if slot combination is a win and returns the multiplier
 */
export function calculateSlotsWin(reels: string[]): { win: boolean; multiplier: number } {
  // Check for winning combinations
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // All three symbols match
    const symbol = reels[0];
    switch (symbol) {
      case "7":
        return { win: true, multiplier: 10 };
      case "BAR":
        return { win: true, multiplier: 5 };
      case "2xBAR":
        return { win: true, multiplier: 4 };
      case "3xBAR":
        return { win: true, multiplier: 3 };
      case "CHERRY":
        return { win: true, multiplier: 2.5 };
      default:
        return { win: true, multiplier: 2 };
    }
  } else if (
    (reels[0] === "BAR" || reels[0] === "2xBAR" || reels[0] === "3xBAR") &&
    (reels[1] === "BAR" || reels[1] === "2xBAR" || reels[1] === "3xBAR") &&
    (reels[2] === "BAR" || reels[2] === "2xBAR" || reels[2] === "3xBAR")
  ) {
    // Any three BAR symbols
    return { win: true, multiplier: 1.5 };
  } else if (reels.filter(r => r === "CHERRY").length >= 2) {
    // At least two CHERRY symbols
    return { win: true, multiplier: 1.2 };
  }
  
  // No win
  return { win: false, multiplier: 0 };
}

/**
 * Checks if user has enough balance for a bet
 */
export function hasEnoughBalance(balance: number, betAmount: number): boolean {
  return balance >= betAmount;
}

/**
 * Time-based animation utilities
 */

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeIn(t: number): number {
  return t * t;
}

export function easeOut(t: number): number {
  return t * (2 - t);
}
