import React from 'react';
import { 
  SVG_BOOK, 
  SVG_PHARAOH, 
  SVG_ANKH, 
  SVG_EYE_OF_HORUS, 
  SVG_SCARAB, 
  SVG_HIEROGLYPH,
  EGYPT_ICON_MAP 
} from './book-of-egypt-icons';
import { useQuery } from '@tanstack/react-query';

interface EgyptPayoutsTableProps {
  className?: string;
}

// Interfaz para el historial de juegos
interface GameHistory {
  id: number;
  userId: number;
  gameType: string;
  gameId?: string;
  bet: number;
  result: string;
  win: boolean;
  winAmount: number;
  createdAt: string;
}

// Función para formatear la fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Función para formatear los resultados del slot
const formatSlotResult = (result: string) => {
  try {
    // Si el resultado es un array JSON stringify, parsearlo
    const resultArray = JSON.parse(result);
    if (Array.isArray(resultArray)) {
      // Flatten the array if it's a 2D array
      const flatResult = resultArray.flat().slice(0, 5);
      return flatResult.join(',');
    }
    return result;
  } catch (e) {
    // Si no se puede parsear, devolver como está
    return result;
  }
};

export function EgyptPayoutsTable({ className = '' }: EgyptPayoutsTableProps) {
  // Consultar el historial de juegos
  const { data: gameHistory = [] } = useQuery<GameHistory[]>({
    queryKey: ['/api/game-history'],
    refetchInterval: 5000 // Refrescar cada 5 segundos
  });

  // Filtrar solo los juegos de slots
  const slotsHistory = gameHistory
    .filter(game => game.gameType === 'slots')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Mostrar solo los últimos 5 juegos

  return (
    <div className={`bg-gray-900/80 rounded-lg p-6 ${className} border border-amber-900/50`}>
      <h3 className="text-xl font-bold text-white flex items-center mb-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#ffc82c" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5 mr-2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        Partidas Recientes
      </h3>
      
      {slotsHistory.length === 0 ? (
        <div className="text-gray-400 text-center py-6">
          No hay partidas recientes
        </div>
      ) : (
        <div className="space-y-4">
          {slotsHistory.map(game => (
            <div key={game.id} className="bg-amber-950/30 p-3 rounded-lg border border-amber-900/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-amber-400 text-sm">{formatDate(game.createdAt)}</span>
                <span className={`${game.win ? 'text-green-500' : 'text-red-500'} font-bold`}>
                  {game.win ? '+' : '-'}${game.win ? game.winAmount.toFixed(2) : game.bet.toFixed(2)}
                </span>
              </div>
              <div className="text-gray-300 text-sm">
                <div className="flex space-x-2 flex-wrap">
                  {formatSlotResult(game.result).split(',').map((symbol, i) => (
                    <img 
                      key={i} 
                      src={EGYPT_ICON_MAP[symbol] || EGYPT_ICON_MAP['BAR']} 
                      alt={symbol} 
                      className="w-6 h-6 inline-block"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}