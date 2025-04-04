# Python Console Casino

A text-based casino game collection that runs in the terminal. This console application provides a simple yet engaging gaming experience with ASCII art visualizations.

## Features

- Terminal-based casino games with text interface
- ASCII art visualizations
- Multiple game implementations
- Simple betting system
- No external dependencies (uses Python standard library)

## Games Included

1. **Blackjack**: Classic card game where players try to get as close to 21 as possible without going over.
2. **Roulette**: Bet on where the ball will land on a spinning wheel with various betting options.
3. **Slot Machine**: A virtual slot machine with random symbols and payouts.
4. **Horse Betting**: Bet on horses in a simulated race with different odds.

## Project Structure

```
casino-project/
├── main.py             # Main entry point and game menu
├── blackjack.py        # Blackjack game implementation
├── roulette.py         # Roulette game implementation
├── slot_machine.py     # Slot Machine game implementation
├── horse_betting.py    # Horse Betting game implementation
└── ascii_art.py        # ASCII art for visual elements
```

## Running the Casino

### Prerequisites
- Python 3.6 or higher

### Starting the Casino
```bash
# Use the provided script from the root directory
./run_casino_console.sh

# Or run directly
cd casino-project
python main.py
```

## Game Controls

Each game has simple text-based controls:

### Blackjack
- Type commands like 'hit', 'stand', 'double', etc.
- Follow the on-screen prompts for betting and actions

### Roulette
- Choose betting options from the menu
- Input bet amounts as requested
- Watch as the wheel spins and results are displayed

### Slot Machine
- Set your bet amount
- Press enter to spin the reels
- View the results with ASCII art visualization

### Horse Betting
- Select a horse to bet on
- Place your bet amount
- Watch the race unfold in ASCII animation

## Technical Details

- Built with Python 3
- Uses only standard library modules
- Command-line interface with text-based menus
- Simple game state management
- Randomized outcomes with fairness considerations
