import React from 'react';
import { RouletteGame } from '@/components/roulette/roulette-game';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';

export default function RoulettePage() {
  const { user } = useAuth() || {};

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Roulette</h1>
        <p className="text-muted-foreground">
          The classic casino game of chance. Place your bets and win big!
        </p>
        {user && (
          <div className="text-lg font-medium">
            Balance: <span className="text-primary">${user.balance.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <Separator className="my-4" />
      
      <RouletteGame />
    </div>
  );
}