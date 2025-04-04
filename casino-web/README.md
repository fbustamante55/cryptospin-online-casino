# Casino Web Platform

A cutting-edge sports betting and gaming platform that combines virtual cryptocurrency gaming with sophisticated interactive experiences. The platform delivers dynamic gameplay across multiple slot machine themes and betting mechanics, enhanced with advanced user engagement features.

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express server with RESTful API endpoints
- **State Management**: React Query for server state, React Hooks for local state
- **Styling**: Tailwind CSS with customizable theming
- **Internationalization**: i18next with support for multiple languages
- **Database**: Drizzle ORM with schema validation
- **Authentication**: Passport.js with multiple strategies

## Key Features

- **Multilingual Support**: Available in Arabic, Hindi, Turkish, Spanish, and English
- **Virtual Cryptocurrency**: In-app wallet and betting system
- **Multiple Game Types**:
  - Slot Machines with various themes and mechanics
  - Blackjack with full feature set including split functionality
  - Roulette with realistic physics and animations
  - Horse Betting with dynamic race simulations
  - Crash Game with multiplier-based betting
  - Keno with customizable number selection
- **User Account Management**: Registration, profile customization, transaction history
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing
- **Real-time Updates**: Live game states and results
- **Advanced Game Configuration**: Backend systems for game parameter management

## Project Structure

```
casino-web/
├── client/                # Frontend React application
│   ├── src/               # React source code
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configuration
│   │   ├── locales/       # Internationalization files
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main application component
│   │   ├── index.css      # Global styles
│   │   └── main.tsx       # Application entry point
│   └── index.html         # HTML template
├── config/                # Configuration files
│   ├── drizzle.config.ts  # Database ORM configuration
│   ├── postcss.config.js  # PostCSS configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   ├── theme.json         # Theme configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── vite.config.ts     # Vite configuration
├── public/                # Static files
│   ├── images/            # Image assets
│   ├── sounds/            # Sound assets
│   └── slot-test.html     # Test page for slot machine
├── server/                # Backend Express server
│   ├── games/             # Game logic implementations
│   │   ├── BlackjackGame.ts
│   │   ├── Game.ts        # Base game class
│   │   ├── GameManager.ts # Game session manager
│   │   ├── RouletteGame.ts
│   │   ├── SlotMachineGame.ts
│   │   └── ...
│   ├── auth.ts            # Authentication logic
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Vite development server setup
└── shared/                # Shared code between frontend and backend
    └── schema.ts          # Data model definitions
```

## Running the Project

```
Use the Start application workflow in Replit
```

The application will be available via the Replit webview

## API Endpoints

The backend provides various API endpoints for game interactions:

- **/api/user/**: User account management
- **/api/wallet/**: Virtual currency operations
- **/api/games/**: Game-specific endpoints
  - **/api/games/slots/**: Slot machine interactions
  - **/api/games/blackjack/**: Blackjack game endpoints
  - **/api/games/roulette/**: Roulette game endpoints
  - **/api/games/crash/**: Crash game endpoints

## Future Development

- Implementation of additional game types
- Enhanced analytics and reporting features
- Tournament and multiplayer capabilities
- Integration with third-party payment providers
- Advanced user loyalty programs
