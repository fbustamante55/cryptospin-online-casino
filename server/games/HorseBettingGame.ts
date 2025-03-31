import { Game } from './Game';

interface Horse {
  name: string;
  number: number;
  odds: number;
  color: string;
  speed: number;
  endurance: number;
  description: string;
}

interface HorseBet {
  horseNumber: number;
  betAmount: number;
  betType: 'win' | 'place' | 'show';
}

/**
 * Horse Betting game implementation.
 */
export class HorseBettingGame extends Game {
  private balance: number = 1000;
  private horses: Horse[] = [];
  private bets: HorseBet[] = [];
  private raceResult: Record<string, number> | null = null;
  private winner: number | null = null;
  private gameStatus: 'betting' | 'racing' | 'finished' = 'betting';
  private winAmount: number = 0;

  constructor() {
    super();
    this.generateHorses();
  }

  getGameInfo(): Record<string, any> {
    return {
      name: 'Horse Racing',
      description: 'Place bets on horses and watch them race to the finish line',
      type: 'horse-betting',
      minBet: 5,
      maxBet: 500,
      rules: 'Place bets on horses to win, place, or show. Win pays the most but requires your horse to finish first.'
    };
  }

  startGame(): Record<string, any> {
    // Reset game state
    this.balance = 1000;
    this.bets = [];
    this.raceResult = null;
    this.winner = null;
    this.gameStatus = 'betting';
    this.winAmount = 0;
    this.generateHorses();

    return this.getState();
  }

  makeMove(action: Record<string, any>): Record<string, any> {
    const move = action.move;
    
    switch (move) {
      case 'place_bet':
        return this.placeBet(action.params);
      case 'start_race':
        return this.startRace();
      default:
        throw new Error(`Invalid move: ${move}`);
    }
  }

  getState(): Record<string, any> {
    return {
      balance: this.balance,
      horses: this.horses,
      bets: this.bets,
      race_result: this.raceResult,
      winner: this.winner,
      status: this.gameStatus,
      win_amount: this.winAmount
    };
  }

  /**
   * Place a bet on a horse
   */
  private placeBet(params: Record<string, any>): Record<string, any> {
    // Validate betting phase
    if (this.gameStatus !== 'betting') {
      throw new Error('Cannot place bet outside of betting phase');
    }

    const { horse_number, bet_amount, bet_type = 'win' } = params;
    
    // Validate bet
    if (!horse_number || !bet_amount) {
      throw new Error('Invalid bet parameters');
    }

    // Validate horse number
    if (!this.horses.some(h => h.number === horse_number)) {
      throw new Error(`Invalid horse number: ${horse_number}`);
    }

    // Validate bet amount
    if (bet_amount < 5 || bet_amount > 500) {
      throw new Error('Bet amount must be between 5 and 500');
    }

    if (this.balance < bet_amount) {
      throw new Error('Insufficient balance');
    }

    // Validate bet type
    if (!['win', 'place', 'show'].includes(bet_type)) {
      throw new Error(`Invalid bet type: ${bet_type}`);
    }

    // Add bet
    this.bets.push({
      horseNumber: horse_number,
      betAmount: bet_amount,
      betType: bet_type as 'win' | 'place' | 'show'
    });

    // Deduct bet amount from balance
    this.balance -= bet_amount;

    return {
      success: true,
      message: `Bet placed: ${bet_amount} on horse #${horse_number} to ${bet_type}`,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Start the horse race
   */
  private startRace(): Record<string, any> {
    // Validate betting phase
    if (this.gameStatus !== 'betting') {
      throw new Error('Cannot start race outside of betting phase');
    }

    // Validate that there are bets placed
    if (this.bets.length === 0) {
      throw new Error('No bets placed');
    }

    // Update game status
    this.gameStatus = 'racing';

    // Run the race
    const { winner, positions } = this.runRace();
    this.winner = winner;
    this.raceResult = positions;
    this.gameStatus = 'finished';

    // Process bets and calculate winnings
    this.winAmount = this.calculateWinnings();

    // Add winnings to balance
    this.balance += this.winAmount;

    return {
      success: true,
      winner: this.winner,
      positions: this.raceResult,
      win_amount: this.winAmount,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Run the race and determine the results
   */
  private runRace(): { winner: number; positions: Record<string, number> } {
    const positions: Record<string, number> = {};
    const finishTimes: [number, number][] = [];  // [horse number, finish time]
    
    // Calculate finish time for each horse
    for (const horse of this.horses) {
      // Use horse attributes to influence finish time
      // Higher speed means faster baseline speed
      // Higher endurance means less slowdown over time
      const baseTime = 60 - (horse.speed * 0.5);  // baseline in seconds
      const enduranceFactor = 1 - (horse.endurance / 20);  // lower is better
      const randomFactor = Math.random() * 5 - 2.5;  // random factor between -2.5 and 2.5 seconds
      
      // Calculate finish time with some randomness
      const finishTime = baseTime + (baseTime * enduranceFactor) + randomFactor;
      finishTimes.push([horse.number, finishTime]);
    }
    
    // Sort by finish time (ascending)
    finishTimes.sort((a, b) => a[1] - b[1]);
    
    // Assign positions
    for (let i = 0; i < finishTimes.length; i++) {
      positions[finishTimes[i][0]] = i + 1;
    }
    
    // Winner is the horse with position 1
    const winner = finishTimes[0][0];
    
    return { winner, positions };
  }

  /**
   * Calculate winnings based on race results and bets placed
   */
  private calculateWinnings(): number {
    let totalWinnings = 0;
    
    for (const bet of this.bets) {
      const horse = this.horses.find(h => h.number === bet.horseNumber);
      
      if (!horse || !this.raceResult) continue;
      
      const position = this.raceResult[bet.horseNumber];
      
      // Process different bet types
      if (bet.betType === 'win' && position === 1) {
        // Win bets only pay if the horse finishes first
        totalWinnings += this.calculatePayoutForWin(bet.betAmount, horse.odds);
      } else if (bet.betType === 'place' && position <= 2) {
        // Place bets pay if the horse finishes first or second
        totalWinnings += this.calculatePayoutForPlace(bet.betAmount, horse.odds, position);
      } else if (bet.betType === 'show' && position <= 3) {
        // Show bets pay if the horse finishes first, second, or third
        totalWinnings += this.calculatePayoutForShow(bet.betAmount, horse.odds, position);
      }
    }
    
    return totalWinnings;
  }

  /**
   * Calculate payout for a Win bet
   */
  private calculatePayoutForWin(betAmount: number, odds: number): number {
    // Simple calculation: bet amount * odds
    return Math.round(betAmount * odds);
  }

  /**
   * Calculate payout for a Place bet
   */
  private calculatePayoutForPlace(betAmount: number, odds: number, position: number): number {
    // Place pays less than win, and pays more for first than second
    const placeFactor = position === 1 ? 0.6 : 0.4;
    return Math.round(betAmount * odds * placeFactor);
  }

  /**
   * Calculate payout for a Show bet
   */
  private calculatePayoutForShow(betAmount: number, odds: number, position: number): number {
    // Show pays even less than place, with scaled payouts based on position
    const showFactor = position === 1 ? 0.4 : (position === 2 ? 0.3 : 0.2);
    return Math.round(betAmount * odds * showFactor);
  }

  /**
   * Generate horses for the race
   */
  private generateHorses(): void {
    const horseNames = [
      'Thunderbolt', 'Silver Arrow', 'Midnight Star', 'Royal Flush', 
      'Golden Eagle', 'Lightning Strike', 'Wind Dancer', 'Shadow Runner'
    ];
    
    const colors = [
      'Bay', 'Black', 'Chestnut', 'Gray', 
      'Palomino', 'Roan', 'Sorrel', 'White'
    ];
    
    this.horses = [];
    
    for (let i = 1; i <= 8; i++) {
      // Generate random attributes for the horse
      const speed = 7 + Math.floor(Math.random() * 6);  // 7-12
      const endurance = 7 + Math.floor(Math.random() * 6);  // 7-12
      
      // Calculate odds based on speed and endurance
      // Better horses have lower odds (but still good payout)
      const baseOdds = 20 - ((speed + endurance) / 2);
      const randomFactor = (Math.random() * 3) - 1.5;  // -1.5 to 1.5
      const odds = Math.max(1.5, baseOdds + randomFactor);
      const roundedOdds = Math.round(odds * 10) / 10;  // Round to 1 decimal place
      
      this.horses.push({
        name: horseNames[i - 1],
        number: i,
        odds: roundedOdds,
        color: colors[i - 1],
        speed,
        endurance,
        description: this.generateHorseDescription(speed, endurance, colors[i - 1])
      });
    }
  }

  /**
   * Generate a description for a horse based on its attributes
   */
  private generateHorseDescription(speed: number, endurance: number, color: string): string {
    const speedDescriptions = [
      'sluggish', 'steady', 'quick', 'fast', 'lightning-fast', 'blazing'
    ];
    
    const enduranceDescriptions = [
      'tires easily', 'moderate stamina', 'good stamina', 
      'excellent stamina', 'incredible stamina', 'tireless'
    ];
    
    const speedIndex = Math.min(Math.floor((speed - 7) / 1.2), speedDescriptions.length - 1);
    const enduranceIndex = Math.min(Math.floor((endurance - 7) / 1.2), enduranceDescriptions.length - 1);
    
    return `A ${color.toLowerCase()} horse with ${speedDescriptions[speedIndex]} speed and ${enduranceDescriptions[enduranceIndex]}.`;
  }
}