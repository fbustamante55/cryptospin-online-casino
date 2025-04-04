import { Game } from './Game';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // '2'-'10', 'J', 'Q', 'K', 'A'
  hidden?: boolean;
}

type GamePhase = 'betting' | 'player-turn' | 'dealer-turn' | 'game-over';

/**
 * Blackjack game implementation
 */
export class BlackjackGame extends Game {
  private balance: number = 1000;
  private bet: number = 0;
  private deck: Card[] = [];
  private playerHand: Card[] = [];
  private dealerHand: Card[] = [];
  private gamePhase: GamePhase = 'betting';
  private result: 'win' | 'lose' | 'push' | 'blackjack' | null = null;
  private readonly minBet = 10;
  private readonly maxBet = 1000;
  private canDoubleDown: boolean = false;
  private canSplit: boolean = false;

  constructor() {
    super();
    this.initializeDeck();
  }

  getGameInfo(): Record<string, any> {
    return {
      name: 'Blackjack',
      description: 'Classic blackjack game. Aim to get 21 without going over.',
      type: 'blackjack',
      minBet: this.minBet,
      maxBet: this.maxBet,
      rules: 'Dealer stands on 17. Blackjack pays 3:2.'
    };
  }

  startGame(): Record<string, any> {
    // Reset game state
    this.balance = 1000;
    this.bet = 0;
    this.initializeDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.gamePhase = 'betting';
    this.result = null;
    this.canDoubleDown = false;
    this.canSplit = false;

    return this.getState();
  }

  makeMove(action: Record<string, any>): Record<string, any> {
    const move = action.move;
    
    switch (move) {
      case 'place_bet':
        return this.placeBet(action.params);
      case 'hit':
        return this.hit();
      case 'stand':
        return this.stand();
      case 'double':
        return this.doubleDown();
      default:
        throw new Error(`Invalid move: ${move}`);
    }
  }

  getState(): Record<string, any> {
    // Show all player cards
    const visiblePlayerHand = this.playerHand.map(card => ({
      suit: card.suit,
      value: card.value
    }));

    // Only show dealer's face-up card if game is in progress
    const visibleDealerHand = this.dealerHand.map(card => {
      if (card.hidden && this.gamePhase !== 'game-over') {
        return { hidden: true };
      }
      return {
        suit: card.suit,
        value: card.value
      };
    });

    const playerScore = this.calculateHandValue(this.playerHand);
    const dealerScore = this.gamePhase === 'game-over' 
      ? this.calculateHandValue(this.dealerHand)
      : null;

    return {
      balance: this.balance,
      bet: this.bet,
      player_hand: visiblePlayerHand,
      dealer_hand: visibleDealerHand,
      player_score: playerScore,
      dealer_score: dealerScore,
      game_phase: this.gamePhase,
      result: this.result,
      can_double_down: this.canDoubleDown,
      can_split: this.canSplit
    };
  }

  /**
   * Initialize and shuffle a new deck of cards
   */
  private initializeDeck(): void {
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    this.deck = [];
    
    // Create deck with 6 standard decks
    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const value of values) {
          this.deck.push({ suit, value });
        }
      }
    }
    
    // Shuffle the deck
    this.shuffleDeck();
  }

  /**
   * Shuffle the deck of cards
   */
  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Deal a new hand
   */
  private dealHand(): void {
    // Ensure there are enough cards
    if (this.deck.length < 10) {
      this.initializeDeck();
    }
    
    // Deal 2 cards to player
    this.playerHand = [this.drawCard(), this.drawCard()];
    
    // Deal 2 cards to dealer (one face down)
    const dealerCard1 = this.drawCard();
    const dealerCard2 = this.drawCard();
    dealerCard2.hidden = true;
    this.dealerHand = [dealerCard1, dealerCard2];
    
    // Check if player can double down (when hand value is 9, 10, or 11)
    const handValue = this.calculateHandValue(this.playerHand);
    this.canDoubleDown = handValue >= 9 && handValue <= 11;
    
    // Check if player can split (when first two cards have same value)
    this.canSplit = this.playerHand[0].value === this.playerHand[1].value;
    
    // Check for blackjack
    if (handValue === 21) {
      // Check if dealer also has blackjack
      const dealerCard2NotHidden = { ...dealerCard2, hidden: false };
      const dealerHandValue = this.calculateHandValue([dealerCard1, dealerCard2NotHidden]);
      
      if (dealerHandValue === 21) {
        // Push - both have blackjack
        this.result = 'push';
        this.gamePhase = 'game-over';
        this.balance += this.bet; // Return bet
      } else {
        // Player wins with blackjack (pays 3:2)
        this.result = 'blackjack';
        this.gamePhase = 'game-over';
        this.balance += this.bet + Math.floor(this.bet * 1.5);
      }
    }
  }

  /**
   * Draw a card from the deck
   */
  private drawCard(): Card {
    if (this.deck.length === 0) {
      this.initializeDeck();
    }
    return this.deck.pop()!;
  }

  /**
   * Place a bet and start the game
   */
  private placeBet(params: Record<string, any>): Record<string, any> {
    // Validate betting phase
    if (this.gamePhase !== 'betting') {
      throw new Error('Cannot place bet outside of betting phase');
    }
    
    const { bet_amount } = params;
    
    // Validate bet
    if (!bet_amount || bet_amount < this.minBet || bet_amount > this.maxBet) {
      throw new Error(`Bet must be between ${this.minBet} and ${this.maxBet}`);
    }
    
    if (this.balance < bet_amount) {
      throw new Error('Insufficient balance');
    }
    
    // Set bet and deduct from balance
    this.bet = bet_amount;
    this.balance -= bet_amount;
    
    // Deal cards and transition to player's turn
    this.dealHand();
    
    // If not already game over (from blackjack), transition to player's turn
    if (this.gamePhase !== 'game-over') {
      this.gamePhase = 'player-turn';
    }
    
    return {
      success: true,
      message: `Bet placed: ${bet_amount}`,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Player hits (draws another card)
   */
  private hit(): Record<string, any> {
    // Validate player's turn
    if (this.gamePhase !== 'player-turn') {
      throw new Error('Cannot hit outside of player turn');
    }
    
    // Draw a card
    this.playerHand.push(this.drawCard());
    
    // Can't double down after hitting
    this.canDoubleDown = false;
    this.canSplit = false;
    
    // Calculate hand value
    const handValue = this.calculateHandValue(this.playerHand);
    
    // Check if player busts
    if (handValue > 21) {
      this.gamePhase = 'game-over';
      this.result = 'lose';
      
      // Reveal dealer's hidden card
      this.dealerHand.forEach(card => card.hidden = false);
    }
    
    return {
      success: true,
      message: handValue > 21 ? 'Bust!' : `Hit! New card: ${this.playerHand[this.playerHand.length - 1].value}`,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Player stands (ends turn)
   */
  private stand(): Record<string, any> {
    // Validate player's turn
    if (this.gamePhase !== 'player-turn') {
      throw new Error('Cannot stand outside of player turn');
    }
    
    // Transition to dealer's turn
    this.gamePhase = 'dealer-turn';
    
    // Reveal dealer's hidden card
    this.dealerHand.forEach(card => card.hidden = false);
    
    // Dealer draws until reaching at least 17
    let dealerValue = this.calculateHandValue(this.dealerHand);
    
    while (dealerValue < 17) {
      this.dealerHand.push(this.drawCard());
      dealerValue = this.calculateHandValue(this.dealerHand);
    }
    
    // Determine winner
    const playerValue = this.calculateHandValue(this.playerHand);
    
    if (dealerValue > 21) {
      // Dealer busts, player wins
      this.result = 'win';
      this.balance += this.bet * 2; // Return bet + win equal amount
    } else if (dealerValue > playerValue) {
      // Dealer wins
      this.result = 'lose';
    } else if (dealerValue < playerValue) {
      // Player wins
      this.result = 'win';
      this.balance += this.bet * 2; // Return bet + win equal amount
    } else {
      // Push (tie)
      this.result = 'push';
      this.balance += this.bet; // Return bet
    }
    
    // Game over
    this.gamePhase = 'game-over';
    
    return {
      success: true,
      message: `Stand! Dealer draws to ${dealerValue}.`,
      result: this.result,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Player doubles down (doubles bet, takes one card, then stands)
   */
  private doubleDown(): Record<string, any> {
    // Validate player's turn and ability to double down
    if (this.gamePhase !== 'player-turn') {
      throw new Error('Cannot double down outside of player turn');
    }
    
    if (!this.canDoubleDown) {
      throw new Error('Cannot double down with current hand');
    }
    
    if (this.balance < this.bet) {
      throw new Error('Insufficient balance to double down');
    }
    
    // Double the bet
    this.balance -= this.bet;
    this.bet *= 2;
    
    // Draw one card
    this.playerHand.push(this.drawCard());
    
    // Calculate hand value
    const handValue = this.calculateHandValue(this.playerHand);
    
    // Check if player busts
    if (handValue > 21) {
      this.gamePhase = 'game-over';
      this.result = 'lose';
      
      // Reveal dealer's hidden card
      this.dealerHand.forEach(card => card.hidden = false);
      
      return {
        success: true,
        message: 'Double Down - Bust!',
        balance: this.balance,
        game_state: this.getState()
      };
    }
    
    // If not bust, automatically stand
    // Similar to stand() method but without validation
    this.gamePhase = 'dealer-turn';
    
    // Reveal dealer's hidden card
    this.dealerHand.forEach(card => card.hidden = false);
    
    // Dealer draws until reaching at least 17
    let dealerValue = this.calculateHandValue(this.dealerHand);
    
    while (dealerValue < 17) {
      this.dealerHand.push(this.drawCard());
      dealerValue = this.calculateHandValue(this.dealerHand);
    }
    
    // Determine winner
    if (dealerValue > 21) {
      // Dealer busts, player wins
      this.result = 'win';
      this.balance += this.bet * 2; // Return bet + win equal amount
    } else if (dealerValue > handValue) {
      // Dealer wins
      this.result = 'lose';
    } else if (dealerValue < handValue) {
      // Player wins
      this.result = 'win';
      this.balance += this.bet * 2; // Return bet + win equal amount
    } else {
      // Push (tie)
      this.result = 'push';
      this.balance += this.bet; // Return bet
    }
    
    // Game over
    this.gamePhase = 'game-over';
    
    return {
      success: true,
      message: `Double Down! Your hand: ${handValue}, Dealer: ${dealerValue}`,
      result: this.result,
      balance: this.balance,
      game_state: this.getState()
    };
  }

  /**
   * Calculate the value of a hand
   */
  private calculateHandValue(hand: Card[]): number {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      // Skip hidden cards
      if (card.hidden) continue;
      
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10; // Convert an ace from 11 to 1
      aces--;
    }
    
    return value;
  }
}