from typing import Dict, Any, List, Optional
import uuid

from blackjack_game import BlackjackGame
from roulette_game import RouletteGame
from slot_machine_game import SlotMachineGame
from horse_betting_game import HorseBettingGame

class GameManager:
    """Manages all game instances and provides methods to interact with them."""
    
    def __init__(self):
        self.games = {}
        self.active_sessions = {}
        
        # Register available games
        self.available_games = {
            "blackjack": BlackjackGame,
            "roulette": RouletteGame,
            "slot_machine": SlotMachineGame,
            "horse_betting": HorseBettingGame
        }
    
    def get_available_games(self) -> List[Dict[str, Any]]:
        """Get a list of all available games with their information."""
        games_info = []
        
        for game_name, game_class in self.available_games.items():
            # Create a temporary instance to get game info
            temp_game = game_class()
            game_info = temp_game.get_game_info()
            games_info.append({
                "id": game_name,
                "name": game_info["name"],
                "description": game_info["description"]
            })
            
        return games_info
    
    def create_game(self, game_name: str) -> Dict[str, Any]:
        """Create a new game instance and return its ID and initial state."""
        if game_name not in self.available_games:
            return {"error": f"Game '{game_name}' not found"}
        
        # Create new game instance
        game = self.available_games[game_name]()
        game_id = game.game_id
        
        # Store the game instance
        self.active_sessions[game_id] = game
        
        # Initialize the game
        initial_state = game.get_state()
        
        return {
            "game_id": game_id,
            "game_name": game_name,
            "state": initial_state
        }
    
    def get_game_state(self, game_id: str) -> Dict[str, Any]:
        """Get the current state of a game."""
        game = self.active_sessions.get(game_id)
        
        if not game:
            return {"error": f"Game session with ID '{game_id}' not found"}
        
        return {
            "game_id": game_id,
            "game_name": self._get_game_name(game),
            "state": game.get_state()
        }
    
    def make_move(self, game_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move in a game."""
        game = self.active_sessions.get(game_id)
        
        if not game:
            return {"error": f"Game session with ID '{game_id}' not found"}
        
        # Process the move
        result = game.make_move(action)
        
        return {
            "game_id": game_id,
            "game_name": self._get_game_name(game),
            "state": result
        }
    
    def _get_game_name(self, game_instance: Any) -> str:
        """Get the name of the game from its class."""
        for name, cls in self.available_games.items():
            if isinstance(game_instance, cls):
                return name
        return "unknown"
    
    def clean_up_sessions(self, max_sessions: int = 1000) -> None:
        """Clean up old sessions if there are too many."""
        if len(self.active_sessions) <= max_sessions:
            return
            
        # Sort sessions by creation time and keep the newest ones
        sessions_to_keep = dict(
            sorted(
                self.active_sessions.items(),
                key=lambda x: x[1].get_state().get("created_at", 0),
                reverse=True
            )[:max_sessions]
        )
        
        self.active_sessions = sessions_to_keep