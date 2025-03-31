import random
from typing import Dict, Any, List, Tuple
from game import Game

class SlotMachineGame(Game):
    """Slot Machine game implementation."""
    
    def __init__(self):
        super().__init__()
        self.symbols = ["🍒", "🍋", "🍉", "🍇", "💎", "7️⃣"]
        self.symbol_weights = {
            "🍒": 30,  # More common
            "🍋": 25,
            "🍉": 20,
            "🍇": 15,
            "💎": 7,
            "7️⃣": 3   # Rare
        }
        self.payouts = {
            "🍒": 1,  # Lowest payout
            "🍋": 2,
            "🍉": 3,
            "🍇": 5,
            "💎": 10,
            "7️⃣": 20  # Highest payout
        }
        self.reels = 3
        self.result = []
        self.bet_amount = 0
        self.win_amount = 0
        self.is_win = False
        
    def get_game_info(self) -> Dict[str, Any]:
        """Return information about the slot machine game."""
        return {
            "name": "Slot Machine",
            "description": "Spin the reels and try to match symbols for a big win!",
            "actions": ["spin"],
            "symbols": self.symbols,
            "payouts": self.payouts
        }
    
    def start_game(self) -> Dict[str, Any]:
        """Initialize a new slot machine game."""
        self.result = []
        self.bet_amount = 0
        self.win_amount = 0
        self.is_win = False
        self.game_state = "ready"
        
        return self.get_state()
    
    def make_move(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move in the slot machine."""
        move = action.get("move", "").lower()
        
        if move == "spin":
            bet_amount = action.get("bet_amount", 0)
            
            if not self._validate_bet(bet_amount):
                return {"error": "Invalid bet amount", "game_state": self.get_state()}
            
            # Deduct bet amount from balance
            self._update_balance(bet_amount, is_win=False)
            self.bet_amount = bet_amount
            
            # Spin the reels
            self.result = self._spin_reels()
            
            # Check for wins
            self.is_win, self.win_amount = self._check_win()
            
            # Update balance with winnings if any
            if self.is_win:
                self._update_balance(self.win_amount, is_win=True)
            
            self.game_state = "complete"
            
            return self.get_state()
        
        else:
            return {"error": "Invalid move. Use 'spin'.", "game_state": self.get_state()}
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the slot machine game."""
        base_state = super().get_state()
        
        # Add slot machine-specific state information
        return {
            **base_state,
            "result": self.result,
            "bet_amount": self.bet_amount,
            "win_amount": self.win_amount,
            "is_win": self.is_win,
            "symbol_payouts": self.payouts
        }
    
    def _spin_reels(self) -> List[str]:
        """Spin the reels and return the result."""
        # Create a weighted list of symbols based on their weights
        weighted_symbols = []
        for symbol, weight in self.symbol_weights.items():
            weighted_symbols.extend([symbol] * weight)
        
        # Spin each reel
        result = []
        for _ in range(self.reels):
            result.append(random.choice(weighted_symbols))
            
        return result
    
    def _check_win(self) -> Tuple[bool, int]:
        """Check if the spin is a winner and calculate the win amount."""
        # Check if all symbols are the same
        if len(set(self.result)) == 1:
            symbol = self.result[0]
            multiplier = self.payouts[symbol]
            win_amount = self.bet_amount * multiplier
            return True, win_amount
        
        # No win
        return False, 0