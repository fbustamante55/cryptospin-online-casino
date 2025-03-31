import random
from typing import Dict, Any, List, Tuple
from game import Game

class RouletteGame(Game):
    """Roulette game implementation."""
    
    def __init__(self):
        super().__init__()
        # Standard roulette numbers with colors
        self.numbers = {
            0: 'green',
            32: 'red', 19: 'red', 21: 'red', 25: 'red', 34: 'red', 27: 'red', 36: 'red', 30: 'red', 
            23: 'red', 5: 'red', 16: 'red', 1: 'red', 14: 'red', 9: 'red', 18: 'red', 7: 'red', 12: 'red',
            3: 'red',
            
            15: 'black', 4: 'black', 2: 'black', 17: 'black', 6: 'black', 13: 'black', 11: 'black', 
            8: 'black', 10: 'black', 24: 'black', 33: 'black', 20: 'black', 31: 'black', 22: 'black', 
            29: 'black', 28: 'black', 35: 'black', 26: 'black'
        }
        self.bets = []
        self.winning_number = None
        self.winning_color = None
        
    def get_game_info(self) -> Dict[str, Any]:
        """Return information about the roulette game."""
        return {
            "name": "Roulette",
            "description": "Place bets on numbers, colors, or sections of the roulette table.",
            "actions": ["place_bet", "spin"],
            "betting_options": [
                {"type": "number", "description": "Bet on a specific number (0-36)", "payout": 35},
                {"type": "color", "description": "Bet on red or black", "payout": 1},
                {"type": "even_odd", "description": "Bet on even or odd numbers", "payout": 1},
                {"type": "dozen", "description": "Bet on 1st, 2nd, or 3rd dozen (1-12, 13-24, 25-36)", "payout": 2},
                {"type": "half", "description": "Bet on 1-18 (low) or 19-36 (high)", "payout": 1}
            ]
        }
    
    def start_game(self) -> Dict[str, Any]:
        """Initialize a new roulette game."""
        self.bets = []
        self.winning_number = None
        self.winning_color = None
        self.game_state = "accepting_bets"
        
        return self.get_state()
    
    def make_move(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move in roulette."""
        move = action.get("move", "").lower()
        
        if move == "place_bet":
            if self.game_state != "accepting_bets":
                return {"error": "Cannot place bets at this time", "game_state": self.get_state()}
            
            bet_type = action.get("bet_type", "")
            bet_value = action.get("bet_value")
            bet_amount = action.get("bet_amount", 0)
            
            if not self._validate_bet(bet_amount):
                return {"error": "Invalid bet amount", "game_state": self.get_state()}
                
            if not self._validate_bet_type(bet_type, bet_value):
                return {"error": "Invalid bet type or value", "game_state": self.get_state()}
            
            # Deduct bet amount from balance
            self._update_balance(bet_amount, is_win=False)
            
            # Record the bet
            self.bets.append({
                "type": bet_type,
                "value": bet_value,
                "amount": bet_amount
            })
            
            return self.get_state()
            
        elif move == "spin":
            if not self.bets:
                return {"error": "No bets placed", "game_state": self.get_state()}
            
            self.game_state = "spinning"
            # Spin the wheel
            self.winning_number = random.randint(0, 36)
            self.winning_color = self.numbers[self.winning_number]
            
            # Process all bets
            total_winnings = 0
            results = []
            
            for bet in self.bets:
                win, payout = self._check_win(bet)
                bet_winnings = 0
                if win:
                    bet_winnings = bet["amount"] * payout
                    total_winnings += bet_winnings
                    
                results.append({
                    "bet": bet,
                    "win": win,
                    "payout": payout,
                    "winnings": bet_winnings
                })
            
            # Update balance with winnings
            if total_winnings > 0:
                self._update_balance(total_winnings, is_win=True)
            
            self.game_state = "complete"
            
            return {
                **self.get_state(),
                "results": results,
                "total_winnings": total_winnings
            }
        
        else:
            return {"error": "Invalid move. Use 'place_bet' or 'spin'.", "game_state": self.get_state()}
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the roulette game."""
        base_state = super().get_state()
        
        # Add roulette-specific state information
        game_state = {
            **base_state,
            "bets": self.bets,
            "total_bet": sum(bet["amount"] for bet in self.bets)
        }
        
        if self.winning_number is not None:
            game_state["winning_number"] = self.winning_number
            game_state["winning_color"] = self.winning_color
            
        return game_state
    
    def _validate_bet_type(self, bet_type: str, bet_value: Any) -> bool:
        """Validate the bet type and value."""
        if not bet_type:
            return False
            
        if bet_type == "number":
            return isinstance(bet_value, int) and 0 <= bet_value <= 36
        
        elif bet_type == "color":
            return bet_value in ["red", "black"]
        
        elif bet_type == "even_odd":
            return bet_value in ["even", "odd"]
        
        elif bet_type == "dozen":
            return bet_value in [1, 2, 3]
        
        elif bet_type == "half":
            return bet_value in ["low", "high"]
        
        return False
    
    def _check_win(self, bet: Dict[str, Any]) -> Tuple[bool, int]:
        """Check if a bet is a winner and return the payout multiplier."""
        bet_type = bet.get("type", "")
        bet_value = bet.get("value")
        
        if not bet_type or bet_value is None or self.winning_number is None:
            return False, 0
        
        if bet_type == "number":
            if bet_value == self.winning_number:
                return True, 35
        
        elif bet_type == "color":
            if bet_value == self.winning_color:
                return True, 1
        
        elif bet_type == "even_odd":
            if self.winning_number == 0:
                return False, 0
            
            winning_num = int(self.winning_number)
            is_even = winning_num % 2 == 0
            if (bet_value == "even" and is_even) or (bet_value == "odd" and not is_even):
                return True, 1
        
        elif bet_type == "dozen":
            if self.winning_number == 0:
                return False, 0
            
            winning_num = int(self.winning_number)    
            if (bet_value == 1 and 1 <= winning_num <= 12) or \
               (bet_value == 2 and 13 <= winning_num <= 24) or \
               (bet_value == 3 and 25 <= winning_num <= 36):
                return True, 2
        
        elif bet_type == "half":
            if self.winning_number == 0:
                return False, 0
            
            winning_num = int(self.winning_number)
            if (bet_value == "low" and 1 <= winning_num <= 18) or \
               (bet_value == "high" and 19 <= winning_num <= 36):
                return True, 1
        
        return False, 0