import { Game } from './Game';

interface RouletteBet {
  betType: string;
  betAmount: number;
  betNumber?: number;
}

/**
 * Roulette game implementation
 */
export class RouletteGame extends Game {
  private balance: number = 1000;
  private bets: RouletteBet[] = [];
  private lastSpinResult: number | null = null;
  private gameStatus: 'betting' | 'spinning' | 'result' = 'betting';
  private winAmount: number = 0;
  private previousResults: number[] = [];

  /**
   * Define payout rates for different bet types
   */
  private payoutRates: Record<string, number> = {
    'straight': 35,  // Single number
    'split': 17,     // Two numbers
    'street': 11,    // Three numbers (row)
    'corner': 8,     // Four numbers (square)
    'five': 6,       // Five numbers (0, 00, 1, 2, 3)
    'six': 5,        // Six numbers (two rows)
    'dozen': 2,      // Dozen (1-12, 13-24, 25-36)
    'column': 2,     // Column
    'red': 1,        // Red
    'black': 1,      // Black
    'even': 1,       // Even
    'odd': 1,        // Odd
    'high': 1,       // 19-36
    'low': 1         // 1-18
  };

  constructor() {
    super();
  }

  getGameInfo(): Record<string, any> {
    return {
      name: 'Roulette',
      description: 'Classic European roulette game with a single zero',
      type: 'roulette',
      minBet: 1,
      maxBet: 1000,
      rules: 'Place your bets on the roulette table, then spin the wheel to see if you win!'
    };
  }

  startGame(): Record<string, any> {
    // Reset game state for a new game
    this.balance = 1000;
    this.bets = [];
    this.lastSpinResult = null;
    this.gameStatus = 'betting';
    this.winAmount = 0;

    return this.getState();
  }

  makeMove(action: Record<string, any>): Record<string, any> {
    const move = action.move;
    
    switch (move) {
      case 'place_bet':
        return this.placeBet(action.params);
      case 'spin':
        return this.spin();
      default:
        throw new Error(`Invalid move: ${move}`);
    }
  }

  getState(): Record<string, any> {
    return {
      balance: this.balance,
      bets: this.bets,
      last_result: this.lastSpinResult,
      status: this.gameStatus,
      win_amount: this.winAmount,
      previous_results: this.previousResults
    };
  }

  /**
   * Place a bet on the roulette table
   */
  private placeBet(params: Record<string, any>): Record<string, any> {
    // Validate betting phase
    if (this.gameStatus !== 'betting') {
      throw new Error('Cannot place bet outside of betting phase');
    }

    const { bet_type, bet_amount, bet_number } = params;
    
    // Validate bet
    if (!bet_type || !bet_amount) {
      throw new Error('Invalid bet parameters');
    }

    if (bet_amount <= 0 || bet_amount > 1000) {
      throw new Error('Bet amount must be between 1 and 1000');
    }

    if (this.balance < bet_amount) {
      throw new Error('Insufficient balance');
    }

    // Validate bet type
    if (!this.payoutRates[bet_type.toLowerCase()]) {
      throw new Error(`Invalid bet type: ${bet_type}`);
    }

    // Add bet to list of bets
    this.bets.push({
      betType: bet_type.toLowerCase(),
      betAmount: bet_amount,
      betNumber: bet_number
    });

    // Deduct bet amount from balance
    this.balance -= bet_amount;

    return {
      success: true,
      message: `Bet placed: ${bet_amount} on ${bet_type}`,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Spin the roulette wheel
   */
  private spin(): Record<string, any> {
    // Validate betting phase
    if (this.gameStatus !== 'betting') {
      throw new Error('Cannot spin outside of betting phase');
    }

    // Validate that there are bets placed
    if (this.bets.length === 0) {
      throw new Error('No bets placed');
    }

    // Generate a random result (0-36)
    this.lastSpinResult = Math.floor(Math.random() * 37);
    this.previousResults.unshift(this.lastSpinResult);
    
    // Limit history to 10 results
    if (this.previousResults.length > 10) {
      this.previousResults.pop();
    }

    // Update game status
    this.gameStatus = 'result';

    // Process bets and calculate winnings
    this.winAmount = this.calculateWinnings(this.lastSpinResult);

    // Add winnings to balance
    this.balance += this.winAmount;

    // Prepare for next round
    const result = {
      success: true,
      winning_number: this.lastSpinResult,
      win_amount: this.winAmount,
      balance: this.balance,
      game_state: this.getState()
    };

    // Reset for next round
    this.bets = [];
    this.gameStatus = 'betting';
    this.winAmount = 0;

    return result;
  }

  /**
   * Calculate the winnings for all placed bets based on the result
   */
  private calculateWinnings(result: number): number {
    let totalWinnings = 0;

    for (const bet of this.bets) {
      const { betType, betAmount, betNumber } = bet;

      // Check if bet wins
      if (this.checkBetWins(betType, betNumber, result)) {
        const payoutRate = this.payoutRates[betType];
        const winnings = betAmount * (payoutRate + 1); // Original bet + winnings
        totalWinnings += winnings;
      }
    }

    return totalWinnings;
  }

  /**
   * Check if a bet wins based on the result
   */
  private checkBetWins(betType: string, betNumber: number | undefined, result: number): boolean {
    switch (betType) {
      case 'straight':
        return betNumber === result;
      case 'red':
        return this.isRed(result);
      case 'black':
        return this.isBlack(result);
      case 'even':
        return result !== 0 && result % 2 === 0;
      case 'odd':
        return result !== 0 && result % 2 === 1;
      case 'high':
        return result >= 19 && result <= 36;
      case 'low':
        return result >= 1 && result <= 18;
      case 'dozen1':
        return result >= 1 && result <= 12;
      case 'dozen2':
        return result >= 13 && result <= 24;
      case 'dozen3':
        return result >= 25 && result <= 36;
      case 'column1':
        return result % 3 === 1;
      case 'column2':
        return result % 3 === 2;
      case 'column3':
        return result % 3 === 0 && result !== 0;
      default:
        return false;
    }
  }

  /**
   * Check if a number is red
   */
  private isRed(number: number): boolean {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number);
  }

  /**
   * Check if a number is black
   */
  private isBlack(number: number): boolean {
    if (number === 0) return false; // Green
    return !this.isRed(number);
  }
}