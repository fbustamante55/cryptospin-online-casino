# Casino Game Platform Collection

This repository contains three separate implementations of casino gaming platforms, each built with different technologies and approaches. These implementations showcase different ways of creating casino gaming experiences, from simple console-based games to full-featured web applications.

## Project Overview

The repository is organized into three distinct casino implementations:

1. **Python Console Casino** (`casino-project/`)
   - Terminal-based casino games with ASCII art visuals
   - Simple, text-based interactive experience
   - Includes Blackjack, Roulette, Slot Machine, and Horse Betting

2. **Python Casino API** (`casino-api/`)
   - Flask-based RESTful API for casino games
   - JSON-based game state and interactions
   - Designed for integration with any frontend
   - Includes the same game selection as the console version

3. **Modern Web Casino** (`casino-web/` and root directory)
   - Full-featured web application with React frontend and Express backend
   - Rich interactive UI with animations and sound effects
   - Virtual cryptocurrency betting system
   - Multilingual support (Arabic, Hindi, Turkish, Spanish, English)
   - Advanced game mechanics and configurations

## Technology Stack

- **Python Console Casino**: Python 3, standard library
- **Python Casino API**: Python 3, Flask, RESTful architecture
- **Modern Web Casino**: 
  - Frontend: React, TypeScript, Tailwind CSS
  - Backend: Express, Node.js
  - Database: Drizzle ORM
  - Languages: i18next for internationalization

## Getting Started

Each implementation has its own README file with specific setup and running instructions:

- [Python Console Casino README](casino-project/README.md)
- [Python Casino API README](casino-api/README.md)
- [Web Casino README](casino-web/README.md)

### Quick Start

#### Running the Python Console Casino
```bash
cd casino-project
python main.py
```

#### Running the Python Casino API
```bash
./casino-api-launch.sh
# or manually:
cd casino-api
python run.py
```

#### Running the Web Casino
```
Use the Start application workflow in Replit
```

## Project Structure

The repository is organized with each implementation in its own directory:

```
./
├── casino-project/    # Python console-based casino
├── casino-api/        # Python-based casino API
├── casino-web/        # Modern web-based casino (main implementation)
└── various files      # Configuration and documentation for the web-based casino
```

For more detailed information about each implementation's structure:
- [Web Casino Structure](casino-web/PROJECT_STRUCTURE.md)

## Feature Comparison

| Feature                   | Python Console | Python API | Web Casino |
|---------------------------|:--------------:|:----------:|:----------:|
| Blackjack                 | ✓             | ✓          | ✓          |
| Roulette                  | ✓             | ✓          | ✓          |
| Slot Machine              | ✓             | ✓          | ✓          |
| Horse Betting             | ✓             | ✓          | ✓          |
| User Accounts             | ✗             | ✗          | ✓          |
| Virtual Currency          | ✓ (simple)    | ✓ (simple) | ✓ (advanced)|
| Multilingual Support      | ✗             | ✗          | ✓          |
| Data Persistence          | ✗             | ✗          | ✓          |
| UI                        | ASCII Art     | JSON       | Rich Web UI |
| Animations                | ✗             | ✗          | ✓          |
| Sound Effects             | ✗             | ✗          | ✓          |
| Mobile Responsive         | ✗             | ✗          | ✓          |

## Development

This repository is designed to showcase different approaches to casino game development. Each implementation is independent and can be developed or run separately.

## Project History

This repository started as separate casino implementations that were later combined into a single repository for comparison and educational purposes. Each implementation showcases different programming paradigms and technologies.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
