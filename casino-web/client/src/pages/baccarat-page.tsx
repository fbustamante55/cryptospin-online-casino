import React from 'react';
import { BaccaratGame } from '@/components/baccarat/baccarat-game';
import { useAuth } from '@/hooks/use-auth';

export default function BaccaratPage() {
  const { user } = useAuth() || {};

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Baccarat</h1>
        <p className="text-muted-foreground">
          Apuesta por el Jugador, la Banca o el Empate. Simple, elegante y emocionante.
        </p>
        {user && (
          <div className="text-lg font-medium">
            Balance: <span className="text-primary">{user.balance.toLocaleString()} fichas</span>
          </div>
        )}
      </div>
      
      <BaccaratGame />
    </div>
  );
}