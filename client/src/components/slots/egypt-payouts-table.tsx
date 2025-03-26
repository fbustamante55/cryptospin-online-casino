import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EgyptPayoutsTableProps {
  className?: string;
}

interface RecentGame {
  id: number;
  bet: number;
  result: string;
  win: boolean;
  winAmount: number;
  createdAt: string;
}

export function EgyptPayoutsTable({ className = '' }: EgyptPayoutsTableProps) {
  const [payoutSettings, setPayoutSettings] = useState({
    '7': { symbol: '7', label: 'Three 7s', multiplier: 10 },
    'BAR': { symbol: 'BAR', label: 'Three BARs', multiplier: 5 },
    '2xBAR': { symbol: '2xBAR', label: 'Three 2xBARs', multiplier: 4 },
    '3xBAR': { symbol: '3xBAR', label: 'Three 3xBARs', multiplier: 3 },
    'CHERRY': { symbol: 'CH', label: 'Three CHERRYs', multiplier: 2.5 },
    'ANY': { symbol: 'ANY', label: 'Any matching symbols', multiplier: 2 }
  });

  // Obtener los ajustes de pagos del servidor (panel de admin)
  useEffect(() => {
    const fetchPayoutSettings = async () => {
      try {
        const response = await apiRequest({
          url: '/api/admin/game-settings?game=slots',
          method: 'GET',
        });
        
        if (response?.slotSettings?.payouts) {
          setPayoutSettings(response.slotSettings.payouts);
        }
      } catch (error) {
        console.error("Error fetching payout settings:", error);
      }
    };
    
    fetchPayoutSettings();
  }, []);

  // Obtener las partidas recientes
  const { data: recentGames } = useQuery<RecentGame[]>({
    queryKey: ['/api/game-history/slots/book-of-egypt'],
    retry: false,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  return (
    <div className={`rounded-lg p-4 bg-[#101520] border border-[#2a3343] ${className}`}>
      <div className="flex items-center mb-4 px-2">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-6 h-6 mr-2 text-green-500"
        >
          <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" fill="currentColor"/>
          <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"/>
          <path d="M13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19C11 18.4477 11.4477 18 12 18C12.5523 18 13 18.4477 13 19Z" fill="currentColor"/>
          <path d="M21 12C21 12.5523 20.5523 13 20 13C19.4477 13 19 12.5523 19 12C19 11.4477 19.4477 11 20 11C20.5523 11 21 11.4477 21 12Z" fill="currentColor"/>
          <path d="M13 5C13 5.55228 12.5523 6 12 6C11.4477 6 11 5.55228 11 5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5Z" fill="currentColor"/>
          <path d="M5 12C5 12.5523 4.55228 13 4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12Z" fill="currentColor"/>
          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <h2 className="text-xl font-semibold text-white">Payouts</h2>
      </div>

      <div className="space-y-3 px-2">
        {/* 7 */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-green-500 font-bold text-xl mr-2">7</span>
            <span className="text-white">Three 7s</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['7']?.multiplier || 10}x</span>
        </div>

        {/* BAR */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-pink-500 font-bold text-xl mr-2">BAR</span>
            <span className="text-white">Three BARs</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['BAR']?.multiplier || 5}x</span>
        </div>

        {/* 2xBAR */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-pink-500 font-bold text-xl mr-2">2xBAR</span>
            <span className="text-white">Three 2xBARs</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['2xBAR']?.multiplier || 4}x</span>
        </div>

        {/* 3xBAR */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-pink-500 font-bold text-xl mr-2">3xBAR</span>
            <span className="text-white">Three 3xBARs</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['3xBAR']?.multiplier || 3}x</span>
        </div>

        {/* CHERRY */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-yellow-500 font-bold text-xl mr-2">CH</span>
            <span className="text-white">Three CHERRYs</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['CHERRY']?.multiplier || 2.5}x</span>
        </div>

        {/* ANY */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <span className="text-gray-400 font-bold text-xl mr-2">ANY</span>
            <span className="text-white">Any matching symbols</span>
          </div>
          <span className="text-green-500 font-bold">{payoutSettings['ANY']?.multiplier || 2}x</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#2a3343]">
        <h3 className="text-lg font-semibold text-white flex items-center mb-4 px-2">
          <Calendar className="w-5 h-5 mr-2 text-pink-500" />
          Recent Games
        </h3>
        
        {(!recentGames || recentGames.length === 0) ? (
          <div className="text-gray-400 text-center py-4">
            No recent games found
          </div>
        ) : (
          <div className="space-y-2">
            {recentGames.slice(0, 5).map(game => (
              <div key={game.id} className="flex justify-between items-center p-2 rounded bg-[#1a2130]">
                <div>
                  <div className="text-sm text-gray-400">Bet: ${game.bet.toFixed(2)}</div>
                  <div className={`text-sm ${game.win ? 'text-green-500' : 'text-red-500'}`}>
                    {game.win ? `Win: $${game.winAmount.toFixed(2)}` : 'Loss'}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(game.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}