# Casino Web Platform - Project Structure

## Overview

The Casino Web Platform is a modern, feature-rich casino gaming platform built with TypeScript, React, Express, and various other technologies. It provides a comprehensive gaming experience with multiple casino games, user authentication, wallet management, and more.

## Directory Structure

```
casino-web/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components organized by game type
│   │   │   ├── blackjack/  # Blackjack specific components
│   │   │   ├── roulette/   # Roulette specific components
│   │   │   ├── slots/      # Slots specific components
│   │   │   ├── sports/     # Sports betting components
│   │   │   └── ui/         # Shared UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and API clients
│   │   │   ├── i18n.ts     # Internationalization setup
│   │   │   ├── queryClient.ts # React Query configuration
│   │   │   └── utils.ts    # Common utility functions
│   │   ├── locales/        # Translation files for i18n
│   │   │   ├── ar/         # Arabic translations
│   │   │   ├── en/         # English translations
│   │   │   ├── es/         # Spanish translations
│   │   │   ├── hi/         # Hindi translations
│   │   │   └── tr/         # Turkish translations
│   │   ├── pages/          # Page components for routing
│   │   │   ├── Home.tsx    # Home page
│   │   │   ├── Games/      # Game pages
│   │   │   ├── Profile/    # User profile pages
│   │   │   └── Auth/       # Authentication pages
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── games/              # Game logic implementations
│   │   ├── BlackjackGame.ts # Blackjack game logic
│   │   ├── Game.ts         # Base game class
│   │   ├── GameManager.ts  # Game session management
│   │   ├── RouletteGame.ts # Roulette game logic
│   │   ├── SlotMachineGame.ts # Slot machine game logic
│   │   ├── HorseBettingGame.ts # Horse betting game logic
│   │   ├── routes.ts       # Game-specific API routes
│   │   └── schema.ts       # Game data schemas
│   ├── auth.ts             # Authentication logic
│   ├── routes.ts           # Main API routes
│   ├── storage.ts          # Data storage interface
│   ├── index.ts            # Server entry point
│   └── vite.ts             # Vite development server setup
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Shared type definitions and database schema
├── public/                 # Static assets
│   ├── images/             # Images and icons
│   │   ├── slots/          # Slot machine images
│   │   └── symbols/        # Game symbols
│   ├── sounds/             # Game sounds
│   └── slot-test.html      # Slot machine test page
├── config/                 # Configuration files
│   ├── drizzle.config.ts   # Database ORM configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   ├── theme.json          # Theme configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── vite.config.ts      # Vite configuration
├── package.json            # Project dependencies and scripts
└── index.html              # Root HTML file
```

## Key Components

### Client (Frontend)

- **Components**: Reusable UI components organized by game type and functionality
- **Hooks**: Custom React hooks for common behaviors and state management
- **Lib**: Utility functions, API clients, and configuration
- **Locales**: Translation files for multilingual support
- **Pages**: Page components for routing and main application views

### Server (Backend)

- **Games**: Individual game implementations extending the base Game class
- **Auth**: Authentication logic for user accounts
- **Routes**: API endpoints for client-server communication
- **Storage**: Data storage interface for game state and user data

### Shared

- **Schema**: Shared type definitions used by both frontend and backend

## Application Flow

1. User navigates to the application
2. Authentication process (optional)
3. User selects a game from the home page
4. Game interface loads with proper components
5. Game state is managed between client and server
6. Results are calculated on the server and displayed on the client

## Key Features Implementation

- **Authentication**: Implemented in server/auth.ts
- **Game Logic**: Implemented in server/games/ directory
- **UI Components**: Implemented in client/src/components/
- **API Integration**: Managed through client/src/lib/queryClient.ts
- **Internationalization**: Setup in client/src/lib/i18n.ts with translations in client/src/locales/
- **Database Schema**: Defined in shared/schema.ts
