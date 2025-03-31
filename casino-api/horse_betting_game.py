import random
import time
from typing import Dict, Any, List, Tuple
from game import Game

class HorseBettingGame(Game):
    """Horse Betting game implementation."""
    
    def __init__(self):
        super().__init__()
        self.horses = {
            "blue": {"name": "Blue Lightning", "odds": 2.0, "position": 0, "color": "blue"},
            "red": {"name": "Red Rocket", "odds": 3.0, "position": 0, "color": "red"},
            "green": {"name": "Green Machine", "odds": 4.0, "position": 0, "color": "green"},
            "orange": {"name": "Orange Crush", "odds": 5.0, "position": 0, "color": "orange"},
            "pink": {"name": "Pink Panther", "odds": 6.0, "position": 0, "color": "pink"}
        }
        self.race_length = 20
        self.selected_horse = None
        self.bet_amount = 0
        self.race_result = None
        self.race_positions = {}
        self.race_in_progress = False
        
    def get_game_info(self) -> Dict[str, Any]:
        """Return information about the horse betting game."""
        return {
            "name": "Horse Betting",
            "description": "Bet on your favorite horse and watch the race!",
            "actions": ["place_bet", "start_race"],
            "horses": {key: {"name": value["name"], "odds": value["odds"], "color": value["color"]} 
                       for key, value in self.horses.items()}
        }
    
    def start_game(self) -> Dict[str, Any]:
        """Initialize a new horse betting game."""
        # Reset all horses to starting position
        for horse in self.horses.values():
            horse["position"] = 0
            
        self.selected_horse = None
        self.bet_amount = 0
        self.race_result = None
        self.race_positions = {}
        self.race_in_progress = False
        self.game_state = "accepting_bets"
        
        return self.get_state()
    
    def make_move(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Process a player's move in horse betting."""
        move = action.get("move", "").lower()
        
        if move == "place_bet":
            if self.game_state != "accepting_bets":
                return {"error": "Cannot place bets at this time", "game_state": self.get_state()}
                
            horse = action.get("horse")
            bet_amount = action.get("bet_amount", 0)
            
            if horse not in self.horses:
                return {"error": "Invalid horse selection", "game_state": self.get_state()}
                
            if not self._validate_bet(bet_amount):
                return {"error": "Invalid bet amount", "game_state": self.get_state()}
            
            # Deduct bet amount from balance
            self._update_balance(bet_amount, is_win=False)
            
            self.selected_horse = horse
            self.bet_amount = bet_amount
            self.game_state = "ready_to_race"
            
            return self.get_state()
            
        elif move == "start_race":
            if self.game_state != "ready_to_race":
                return {"error": "Not ready to race. Place a bet first.", "game_state": self.get_state()}
            
            # Run the race
            self.race_in_progress = True
            self.game_state = "racing"
            
            # Simulate the race
            winner = self._run_race()
            
            # Determine the outcome
            if winner == self.selected_horse:
                win_amount = int(self.bet_amount * self.horses[winner]["odds"])
                self._update_balance(win_amount, is_win=True)
                result = {
                    "win": True,
                    "winner": winner,
                    "win_amount": win_amount
                }
            else:
                result = {
                    "win": False,
                    "winner": winner,
                    "win_amount": 0
                }
            
            self.race_result = result
            self.game_state = "complete"
            self.race_in_progress = False
            
            return self.get_state()
        
        else:
            return {"error": "Invalid move. Use 'place_bet' or 'start_race'.", "game_state": self.get_state()}
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the horse betting game."""
        base_state = super().get_state()
        
        # Get current horse positions
        horse_positions = {key: value["position"] for key, value in self.horses.items()}
        
        # Add horse betting-specific state information
        game_state = {
            **base_state,
            "horses": {key: {"name": value["name"], "odds": value["odds"], "color": value["color"]} 
                       for key, value in self.horses.items()},
            "race_length": self.race_length,
            "horse_positions": horse_positions,
            "selected_horse": self.selected_horse,
            "bet_amount": self.bet_amount,
            "race_in_progress": self.race_in_progress
        }
        
        if self.race_result:
            game_state["race_result"] = self.race_result
            
        if self.race_positions:
            game_state["final_positions"] = self.race_positions
            
        return game_state
    
    def _run_race(self) -> str:
        """Simulate the race and return the winner."""
        finished = []
        position = 1
        
        # Run until all horses finish
        while len(finished) < len(self.horses):
            # Move each horse randomly
            for horse_key, horse in self.horses.items():
                if horse_key not in finished:
                    # Random movement between 1-3 steps
                    move = random.randint(1, 3)
                    horse["position"] += move
                    
                    # Check if horse finished
                    if horse["position"] >= self.race_length and horse_key not in finished:
                        finished.append(horse_key)
                        self.race_positions[horse_key] = position
                        position += 1
        
        # Find the winner (first horse to finish)
        winner = finished[0]
        
        return winner