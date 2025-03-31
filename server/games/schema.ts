import { z } from 'zod';

/**
 * Schema for creating a new game
 */
export const createGameSchema = z.object({
  game_type: z.string()
});

/**
 * Schema for making a move in a game
 */
export const makeMoveSchema = z.object({
  move: z.string(),
  params: z.record(z.any()).optional()
});

/**
 * Specific schemas for different game actions
 */

// Roulette schemas
export const roulettePlaceBetSchema = z.object({
  move: z.literal('place_bet'),
  params: z.object({
    bet_type: z.string(),
    bet_amount: z.number().positive(),
    bet_number: z.number().int().min(0).max(36).optional()
  })
});

export const rouletteSpinSchema = z.object({
  move: z.literal('spin')
});

// Blackjack schemas
export const blackjackPlaceBetSchema = z.object({
  move: z.literal('place_bet'),
  params: z.object({
    bet_amount: z.number().positive()
  })
});

export const blackjackHitSchema = z.object({
  move: z.literal('hit')
});

export const blackjackStandSchema = z.object({
  move: z.literal('stand')
});

export const blackjackDoubleSchema = z.object({
  move: z.literal('double')
});

// Slot machine schemas
export const slotSpinSchema = z.object({
  move: z.literal('spin'),
  params: z.object({
    bet_amount: z.number().positive(),
    lines: z.number().int().positive().optional().default(1)
  })
}).or(
  z.object({
    move: z.literal('spin')
  })
);

// Horse betting schemas
export const horsePlaceBetSchema = z.object({
  move: z.literal('place_bet'),
  params: z.object({
    horse_number: z.number().int().min(1).max(8),
    bet_amount: z.number().positive(),
    bet_type: z.enum(['win', 'place', 'show']).optional().default('win')
  })
});

export const horseStartRaceSchema = z.object({
  move: z.literal('start_race')
});

/**
 * Union schema for all possible game actions
 */
export const gameActionSchema = z.union([
  roulettePlaceBetSchema,
  rouletteSpinSchema,
  blackjackPlaceBetSchema,
  blackjackHitSchema,
  blackjackStandSchema,
  blackjackDoubleSchema,
  slotSpinSchema,
  horsePlaceBetSchema,
  horseStartRaceSchema
]);

// TypeScript type definitions
export type CreateGameRequest = z.infer<typeof createGameSchema>;
export type MakeMoveRequest = z.infer<typeof makeMoveSchema>;
export type GameAction = z.infer<typeof gameActionSchema>;