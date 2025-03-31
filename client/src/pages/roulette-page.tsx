import React from 'react';
import { RouletteGame } from '@/components/roulette/roulette-game';
import { useAuth } from '@/hooks/use-auth';

export default function RoulettePage() {
  const { user } = useAuth() || {};

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Ruleta</h1>
        <p className="text-muted-foreground">
          Coloca tus apuestas en números, colores o secciones. ¡La suerte puede estar de tu lado!
        </p>
        {user && (
          <div className="text-lg font-medium">
            Balance: <span className="text-primary">{user.balance.toLocaleString()} fichas</span>
          </div>
        )}
      </div>
      
      <RouletteGame />
    </div>
  );
}