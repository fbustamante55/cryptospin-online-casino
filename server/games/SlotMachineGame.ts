import { Game } from './Game';

interface Symbol {
  id: string;
  name: string;
  value: number;
}

/**
 * Slot Machine game implementation
 */
export class SlotMachineGame extends Game {
  private balance: number = 1000;
  private readonly minBet: number = 1;
  private readonly maxBet: number = 100;
  private readonly maxLines: number = 9;
  private readonly reels: number = 5;
  private readonly rows: number = 3;
  private lastResult: string[][] | null = null;
  private lastWin: number = 0;
  private lastBet: number = 0;
  private lastLines: number = 1;

  // Define symbols and their values
  private symbols: Symbol[] = [
    { id: 'cherry', name: 'Cherry', value: 2 },
    { id: 'lemon', name: 'Lemon', value: 3 },
    { id: 'orange', name: 'Orange', value: 4 },
    { id: 'plum', name: 'Plum', value: 5 },
    { id: 'grapes', name: 'Grapes', value: 6 },
    { id: 'watermelon', name: 'Watermelon', value: 7 },
    { id: 'seven', name: 'Seven', value: 10 },
    { id: 'bar', name: 'Bar', value: 15 },
    { id: 'bell', name: 'Bell', value: 20 },
    { id: 'wild', name: 'Wild', value: 25 }
  ];

  constructor() {
    super();
  }

  getGameInfo(): Record<string, any> {
    return {
      name: 'Slot Machine',
      description: 'Classic slot machine with 5 reels and multiple paylines',
      type: 'slots',
      minBet: this.minBet,
      maxBet: this.maxBet,
      maxLines: this.maxLines,
      symbols: this.symbols
    };
  }

  startGame(): Record<string, any> {
    // Reset game state
    this.balance = 1000;
    this.lastResult = null;
    this.lastWin = 0;
    this.lastBet = 0;
    this.lastLines = 1;

    return this.getState();
  }

  makeMove(action: Record<string, any>): Record<string, any> {
    const move = action.move;
    
    switch (move) {
      case 'spin':
        // Ensure params exist
        const params = action.params || {};
        return this.spin(params);
      default:
        throw new Error(`Invalid move: ${move}`);
    }
  }

  getState(): Record<string, any> {
    return {
      balance: this.balance,
      last_result: this.lastResult,
      last_win: this.lastWin,
      last_bet: this.lastBet,
      last_lines: this.lastLines,
      min_bet: this.minBet,
      max_bet: this.maxBet,
      max_lines: this.maxLines
    };
  }

  /**
   * Spin the slot machine
   */
  private spin(params: Record<string, any> = {}): Record<string, any> {
    if (!params) {
      throw new Error('Params are required for spin action');
    }
    
    const { bet_amount, lines = 1 } = params;
    
    // Validate bet
    if (!bet_amount || typeof bet_amount !== 'number' || bet_amount < this.minBet || bet_amount > this.maxBet) {
      throw new Error(`Bet must be between ${this.minBet} and ${this.maxBet}`);
    }
    
    if (typeof lines !== 'number' || lines < 1 || lines > this.maxLines) {
      throw new Error(`Lines must be between 1 and ${this.maxLines}`);
    }
    
    const totalBet = bet_amount * lines;
    
    if (this.balance < totalBet) {
      throw new Error('Insufficient balance');
    }
    
    // Deduct bet amount from balance
    this.balance -= totalBet;
    this.lastBet = bet_amount;
    this.lastLines = lines;
    
    // Generate result
    this.lastResult = this.generateResult();
    
    // Calculate win
    const { isWin, winAmount } = this.calculateWin(this.lastResult, bet_amount, lines);
    this.lastWin = winAmount;
    
    // Add winnings to balance
    if (isWin) {
      this.balance += winAmount;
    }
    
    return {
      success: true,
      result: this.lastResult,
      win: isWin,
      win_amount: winAmount,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Generate a random result for the slot machine
   */
  private generateResult(): string[][] {
    const result: string[][] = [];
    
    // Generate a result for each reel
    for (let i = 0; i < this.reels; i++) {
      const reelResult: string[] = [];
      
      // Generate a result for each row in the reel
      for (let j = 0; j < this.rows; j++) {
        const randomIndex = Math.floor(Math.random() * this.symbols.length);
        reelResult.push(this.symbols[randomIndex].id);
      }
      
      result.push(reelResult);
    }
    
    return result;
  }

  /**
   * Calculate the win amount based on the result
   */
  private calculateWin(result: string[][], betAmount: number, lines: number): { isWin: boolean; winAmount: number } {
    let totalWin = 0;
    
    // Define paylines
    const paylines = this.getPaylines();
    
    // Check each payline up to the number of lines bet
    for (let i = 0; i < lines; i++) {
      const payline = paylines[i];
      
      // Get symbols on this payline
      const lineSymbols: string[] = [];
      for (let j = 0; j < this.reels; j++) {
        const rowIndex = payline[j];
        lineSymbols.push(result[j][rowIndex]);
      }
      
      // Check for wins
      const win = this.checkLineWin(lineSymbols, betAmount);
      totalWin += win;
    }
    
    return {
      isWin: totalWin > 0,
      winAmount: totalWin
    };
  }

  /**
   * Check if a line has a winning combination
   */
  private checkLineWin(lineSymbols: string[], betAmount: number): number {
    // Count consecutive symbols from left to right
    let currentSymbol = lineSymbols[0];
    let count = 1;
    
    for (let i = 1; i < lineSymbols.length; i++) {
      // Wild symbols match anything
      if (lineSymbols[i] === 'wild' || currentSymbol === 'wild') {
        if (lineSymbols[i] === 'wild' && currentSymbol !== 'wild') {
          // Wild matches current symbol
          count++;
        } else if (currentSymbol === 'wild' && lineSymbols[i] !== 'wild') {
          // Current symbol is wild, update to match new symbol
          currentSymbol = lineSymbols[i];
          count++;
        } else {
          // Both are wild
          count++;
        }
      } else if (lineSymbols[i] === currentSymbol) {
        // Same symbol
        count++;
      } else {
        // Different symbol, break the chain
        break;
      }
    }
    
    // Calculate win based on number of matches
    if (count >= 3) {
      // Find the symbol value
      const symbolValue = currentSymbol === 'wild' ? 
        this.symbols.find(s => s.id === 'wild')!.value : 
        this.symbols.find(s => s.id === currentSymbol)!.value;
      
      // Calculate win amount based on symbol value, count, and bet amount
      return betAmount * symbolValue * (count - 2);
    }
    
    return 0;
  }

  /**
   * Get the paylines for the slot machine
   */
  private getPaylines(): number[][] {
    // Define paylines (row indices for each reel)
    // These are just some example paylines
    return [
      [1, 1, 1, 1, 1], // Middle row
      [0, 0, 0, 0, 0], // Top row
      [2, 2, 2, 2, 2], // Bottom row
      [0, 1, 2, 1, 0], // V shape
      [2, 1, 0, 1, 2], // Inverted V
      [0, 0, 1, 2, 2], // Diagonal top-left to bottom-right
      [2, 2, 1, 0, 0], // Diagonal bottom-left to top-right
      [1, 0, 1, 2, 1], // Zigzag 1
      [1, 2, 1, 0, 1]  // Zigzag 2
    ];
  }
}