# Casino API (Python/Flask)

A RESTful API implementation of multiple casino games built with Python and Flask. This API provides endpoints for starting and playing various casino games through HTTP requests, making it suitable for integration with any frontend platform.

## Features

- RESTful API architecture
- JSON-based game state and interactions
- Multiple casino game implementations
- Stateful game sessions
- Virtual betting system
- Clean, modular codebase structure

## Games Included

1. **Blackjack**: Classic card game where players try to get as close to 21 as possible without going over.
2. **Roulette**: Bet on where the ball will land on a spinning wheel with various betting options.
3. **Slot Machine**: A virtual slot machine with random symbols and payouts.
4. **Horse Betting**: Bet on horses in a simulated race with different odds.

## Project Structure

```
casino-api/
├── app.py              # Main Flask application
├── run.py              # Entry point for starting the server
├── game.py             # Base abstract game class
├── game_manager.py     # Manages game instances
├── blackjack_game.py   # Blackjack game implementation
├── roulette_game.py    # Roulette game implementation
├── slot_machine_game.py # Slot Machine game implementation
├── horse_betting_game.py # Horse Betting game implementation
├── static/             # Static files (if needed)
└── templates/          # HTML templates (for API documentation)
```

## API Endpoints

### Get Available Games
```
GET /games
```
Returns a list of available games with their information.

### Start a Game
```
POST /games/<game_name>/start
```
Starts a new game session for the specified game and returns the game ID and initial state.

### Make a Move
```
POST /games/<game_id>/play
```
Makes a move in the game with the specified ID. The request body contains the action to take.

### Get Game State
```
GET /games/<game_id>/state
```
Returns the current state of a game with the specified ID.

## Running the API

### Prerequisites
- Python 3.6+
- Flask and Flask-CORS
- Other required Python packages

### Starting the Server
```bash
# Use the provided launch script
./casino-api-launch.sh

# Or run directly
cd casino-api
python run.py
```

The API will be available at `http://localhost:5000`

## Game Interactions

Each game has its own set of actions and state structure:

### Blackjack
- Actions: 'hit', 'stand', 'double', 'split'
- State: player's hand, dealer's hand, game status

### Roulette
- Actions: place bets on different bet types
- State: wheel result, placed bets, winnings

### Slot Machine
- Actions: spin, set bet amount
- State: reel results, win amount, current balance

### Horse Betting
- Actions: place bets on horses
- State: race results, placed bets, winnings

## Technical Details

- Built with Python 3 and Flask
- RESTful API design principles
- Modular architecture with abstract base class for games
- Session management with UUIDs
- JSON serialization for all game states
