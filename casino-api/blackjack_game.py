import random
from typing import Dict, Any, List, Tuple
from game import Game

class BlackjackGame(Game):
    """Blackjack game implementation."""
    
    def __init__(self):
        super().__init__()
        self.player_cards = []
        self.dealer_cards = []
        self.deck = []
        self.bet_amount = 0
        self.result = None
        self.player_score = 0
        self.dealer_score = 0
        
    def get_game_info(self) -> Dict[str, Any]:
        """Return information about the blackjack game."""
        return {
            "name": "Blackjack",
            "description": "Try to beat the dealer by getting a hand value close to 21 without going over.",
            "actions": ["place_bet", "hit", "stand"],
            "card_values": {
                "2-10": "Face value",
                "J, Q, K": 10,
                "A": "1 or 11 (whichever is more favorable)"
            }
        }
    
    def start_game(self) -> Dict[str, Any]:
        """Initialize a new blackjack game."""
        # Create and shuffle a new deck
        suits = ["hearts", "diamonds", "clubs", "spades"]
        ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
        
        self.deck = []
        for suit in suits:
            for rank in ranks:
                self.deck.append({"suit": suit, "rank": rank})
                
        random.shuffle(self.deck)
        
        self.player_cards = []
        self.dealer_cards = []
        self.bet_amount = 0
        self.result = None
        self.player_score = 0
        self.dealer_score = 0
        self.game_state = "betting"
        
        return self.get_state()
    
    def make_move(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move in blackjack."""
        move = action.get("move", "").lower()
        
        if move == "place_bet":
            if self.game_state != "betting":
                return {"error": "Cannot place bet at this time", "game_state": self.get_state()}
                
            bet_amount = action.get("bet_amount", 0)
            
            if not self._validate_bet(bet_amount):
                return {"error": "Invalid bet amount", "game_state": self.get_state()}
                
            # Deduct bet amount from balance
            self._update_balance(bet_amount, is_win=False)
            
            self.bet_amount = bet_amount
            
            # Deal initial cards
            self.player_cards = [self.deck.pop(), self.deck.pop()]
            self.dealer_cards = [self.deck.pop(), self.deck.pop()]
            
            # Calculate scores
            self.player_score = self._calculate_score(self.player_cards)
            self.dealer_score = self._calculate_score([self.dealer_cards[0]])  # Only show first dealer card
            
            # Check for blackjack
            full_dealer_score = self._calculate_score(self.dealer_cards)
            
            if self.player_score == 21 and full_dealer_score == 21:
                # Both have blackjack - push (tie)
                self._update_balance(self.bet_amount, is_win=True)  # Return bet
                self.result = "push"
                self.game_state = "complete"
            elif self.player_score == 21:
                # Player has blackjack
                self._update_balance(int(self.bet_amount * 2.5), is_win=True)  # Blackjack pays 3:2
                self.result = "blackjack"
                self.game_state = "complete"
            elif full_dealer_score == 21:
                # Dealer has blackjack
                self.result = "dealer_blackjack"
                self.game_state = "complete"
            else:
                # Game continues
                self.game_state = "player_turn"
            
            return self.get_state()
            
        elif move == "hit":
            if self.game_state != "player_turn":
                return {"error": "Not your turn", "game_state": self.get_state()}
                
            # Deal a card to the player
            self.player_cards.append(self.deck.pop())
            
            # Calculate new score
            self.player_score = self._calculate_score(self.player_cards)
            
            # Check if player busts
            if self.player_score > 21:
                self.result = "player_bust"
                self.game_state = "complete"
            
            return self.get_state()
            
        elif move == "stand":
            if self.game_state != "player_turn":
                return {"error": "Not your turn", "game_state": self.get_state()}
                
            self.game_state = "dealer_turn"
            
            # Reveal dealer's second card
            self.dealer_score = self._calculate_score(self.dealer_cards)
            
            # Dealer draws until they have at least 17
            while self.dealer_score < 17:
                self.dealer_cards.append(self.deck.pop())
                self.dealer_score = self._calculate_score(self.dealer_cards)
            
            # Determine winner
            self._determine_winner()
            
            return self.get_state()
            
        else:
            return {"error": "Invalid move", "game_state": self.get_state()}
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the blackjack game."""
        base_state = super().get_state()
        
        # Add blackjack-specific state information
        game_state = {
            **base_state,
            "player_cards": self.player_cards,
            "player_score": self.player_score,
            "bet_amount": self.bet_amount
        }
        
        # Only show one dealer card during player's turn
        if self.game_state == "player_turn" and len(self.dealer_cards) > 0:
            game_state["dealer_cards"] = [self.dealer_cards[0], {"suit": "hidden", "rank": "hidden"}]
            game_state["dealer_score"] = self._calculate_score([self.dealer_cards[0]])
        else:
            game_state["dealer_cards"] = self.dealer_cards
            game_state["dealer_score"] = self.dealer_score
        
        if self.result:
            game_state["result"] = self.result
        
        return game_state
    
    def _calculate_score(self, cards: List[Dict[str, str]]) -> int:
        """Calculate the score of a hand in blackjack."""
        score = 0
        aces = 0
        
        for card in cards:
            rank = card.get("rank")
            
            if rank in ["J", "Q", "K"]:
                score += 10
            elif rank == "A":
                score += 11
                aces += 1
            elif rank != "hidden" and rank is not None:
                try:
                    score += int(rank)
                except (ValueError, TypeError):
                    # Skip if rank can't be converted to int
                    pass
        
        # Adjust for aces
        while score > 21 and aces > 0:
            score -= 10
            aces -= 1
            
        return score
    
    def _determine_winner(self) -> None:
        """Determine the winner of the blackjack game."""
        if self.player_score > 21:
            self.result = "player_bust"
        elif self.dealer_score > 21:
            self.result = "dealer_bust"
            self._update_balance(self.bet_amount * 2, is_win=True)
        elif self.player_score > self.dealer_score:
            self.result = "player_wins"
            self._update_balance(self.bet_amount * 2, is_win=True)
        elif self.dealer_score > self.player_score:
            self.result = "dealer_wins"
        else:
            self.result = "push"
            self._update_balance(self.bet_amount, is_win=True)  # Return bet
            
        self.game_state = "complete"