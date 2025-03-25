import React from 'react';
import { BlackjackGame } from '@/components/blackjack/blackjack-game';
import { useAuth } from '@/hooks/use-auth';

export default function BlackjackPage() {
  const { user } = useAuth() || {};

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Blackjack</h1>
        <p className="text-muted-foreground">
          Intenta conseguir 21 puntos sin pasarte. ¡Bate al crupier y gana!
        </p>
        {user && (
          <div className="text-lg font-medium">
            Balance: <span className="text-primary">{user.balance.toLocaleString()} fichas</span>
          </div>
        )}
      </div>
      
      <BlackjackGame />
    </div>
  );
}