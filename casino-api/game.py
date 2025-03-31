from abc import ABC, abstractmethod
from typing import Dict, Any
import uuid
import time

class Game(ABC):
    """Base abstract class for all casino games."""
    
    def __init__(self):
        """Initialize the game with default values."""
        self.game_id = str(uuid.uuid4())
        self.balance = 1000  # Default starting balance
        self.min_bet = 5
        self.max_bet = 500
        self.created_at = int(time.time())
        self.game_state = "initializing"  # Common game states: initializing, ready, playing, complete
    
    @abstractmethod
    def get_game_info(self) -> Dict[str, Any]:
        """Return information about the game."""
        pass
    
    @abstractmethod
    def start_game(self) -> Dict[str, Any]:
        """Initialize a new game session."""
        pass
    
    @abstractmethod
    def make_move(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move and update the game state."""
        pass
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the game."""
        return {
            "game_id": self.game_id,
            "balance": self.balance,
            "min_bet": self.min_bet,
            "max_bet": self.max_bet,
            "created_at": self.created_at,
            "game_state": self.game_state
        }
    
    def _validate_bet(self, bet_amount: int) -> bool:
        """Validate if the bet amount is valid based on player's balance."""
        if not isinstance(bet_amount, (int, float)) or bet_amount <= 0:
            return False
            
        if bet_amount < self.min_bet or bet_amount > self.max_bet:
            return False
            
        if bet_amount > self.balance:
            return False
            
        return True
    
    def _update_balance(self, amount: int, is_win: bool = True) -> int:
        """Update player balance after a bet. Return the new balance."""
        if is_win:
            self.balance += amount
        else:
            self.balance -= amount
            
        return self.balance