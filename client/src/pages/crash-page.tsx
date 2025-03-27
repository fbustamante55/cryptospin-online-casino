import { useState } from 'react';
import { SpaceExplorerGame } from "@/components/crash/space-explorer-game";
import { Card, CardContent } from "@/components/ui/card";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { Rocket, Clock, Target, Calendar, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CrashPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch game history specific to crash
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
    select: (data) => data.filter((history) => history.gameType === "crash").slice(0, 5),
  });

  return (
    <>
      {/* Header */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center md:hidden">
            <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
              <span className="text-[#09b66d]">Crypto</span>Spin
            </h1>
          </div>
          
          <div className="md:flex flex-1 px-4 justify-center">
            <h1 className="text-xl font-heading font-bold">{t('sidebar.crash')}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
              <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
              <span className="text-sm font-semibold">{user?.balance}</span>
            </div>
            
            {/* User Dropdown Menu */}
            <UserDropdown />
            
            {/* Notification Dropdown */}
            <NotificationDropdown />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#192531] to-[#0e1824] mb-8">
            <div className="relative z-10 p-6 md:p-8">
              <h2 className="font-heading text-xl md:text-3xl font-bold text-white mb-2">SPACE EXPLORER <span className="text-[#09b66d]">Crash Game</span></h2>
              <p className="text-gray-300 max-w-lg mb-4">{t('crash_description', 'Watch the UFO fly to the stars! Cash out before it crashes for big wins!')}</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium rounded-md transition-all duration-200">
                  {t('buttons.startPlaying', 'Start Playing')}
                </button>
                <button className="px-4 py-2 bg-[#313d4a] hover:bg-[#2a3441] text-white font-medium rounded-md transition-all duration-200">
                  {t('buttons.learnMore', 'Learn More')}
                </button>
              </div>
            </div>
            <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full">
              <div className="w-full h-full opacity-25 bg-gradient-to-l from-[#09b66d]/30 to-transparent"></div>
              <svg 
                className="absolute top-1/2 right-16 transform -translate-y-1/2" 
                width="300" 
                height="240" 
                viewBox="0 0 300 240" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Fondo con brillo */}
                <defs>
                  <radialGradient id="crashGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="#09b66d" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0e1824" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="150" cy="120" r="120" fill="url(#crashGlow)" />
                
                {/* UFO */}
                <g transform="translate(150, 120)">
                  <ellipse cx="0" cy="0" rx="45" ry="15" fill="#313d4a" stroke="#1c2b3a" strokeWidth="2" />
                  <ellipse cx="0" cy="-5" rx="25" ry="10" fill="#192531" stroke="#1c2b3a" strokeWidth="2" />
                  <circle cx="0" cy="-15" r="15" fill="#09b66d" stroke="#1c2b3a" strokeWidth="2" />
                  
                  {/* Luces de la nave */}
                  <circle cx="-25" cy="0" r="3" fill="#f9c846" />
                  <circle cx="-15" cy="0" r="3" fill="#f95258" />
                  <circle cx="-5" cy="0" r="3" fill="#09b66d" />
                  <circle cx="5" cy="0" r="3" fill="#f9c846" />
                  <circle cx="15" cy="0" r="3" fill="#f95258" />
                  <circle cx="25" cy="0" r="3" fill="#09b66d" />
                  
                  {/* Rayo tractor */}
                  <path d="M0,5 L-20,25 L20,25 Z" fill="#09b66d" opacity="0.5" />
                </g>
                
                {/* Estrellas */}
                <path d="M65,40 L70,50 L80,55 L70,60 L65,70 L60,60 L50,55 L60,50 Z" fill="#f9c846" opacity="0.8" />
                <path d="M240,40 L245,50 L255,55 L245,60 L240,70 L235,60 L225,55 L235,50 Z" fill="#09b66d" opacity="0.8" />
                <path d="M150,200 L155,210 L165,215 L155,220 L150,230 L145,220 L135,215 L145,210 Z" fill="#f95258" opacity="0.8" />
                
                {/* Pequeñas estrellas/puntos */}
                <circle cx="50" cy="90" r="2" fill="#ffffff" />
                <circle cx="80" cy="190" r="2" fill="#ffffff" />
                <circle cx="200" cy="150" r="2" fill="#ffffff" />
                <circle cx="230" cy="60" r="2" fill="#ffffff" />
                <circle cx="280" cy="100" r="2" fill="#ffffff" />
                <circle cx="120" cy="40" r="2" fill="#ffffff" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <SpaceExplorerGame />
            </div>
            
            <div className="space-y-6">
              {/* How to Play */}
              <Card className="bg-[#192531] border-[#1c2b3a]">
                <CardContent className="p-4">
                  <h3 className="text-lg font-heading font-semibold mb-3 flex items-center">
                    <Rocket className="h-5 w-5 mr-2 text-[#F9C846]" />
                    How to Play
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <span>Place your bet and set an optional auto cash-out multiplier.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <span>Watch the multiplier grow as the game progresses.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <span>Cash out before the crash to secure your winnings!</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
                      <span>If you don't cash out before the crash, you lose your bet.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Strategy */}
              <Card className="bg-[#192531] border-[#1c2b3a]">
                <CardContent className="p-4">
                  <h3 className="text-lg font-heading font-semibold mb-3 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-[#09b66d]" />
                    Strategy Tips
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-start">
                      <span className="text-[#09b66d] mr-1">•</span>
                      <span>Use auto cash-out to secure consistent wins.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-[#09b66d] mr-1">•</span>
                      <span>Lower multipliers (1.5x-2x) are safer but yield smaller profits.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-[#09b66d] mr-1">•</span>
                      <span>Higher multipliers (5x+) are risky but can be very rewarding.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="text-[#09b66d] mr-1">•</span>
                      <span>Watch for patterns but remember each game is independent.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Games */}
              <Card className="bg-[#192531] border-[#1c2b3a]">
                <CardContent className="p-4">
                  <h3 className="text-lg font-heading font-semibold mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-[#FF3E8F]" />
                    Recent Games
                  </h3>
                  
                  {gameHistory && gameHistory.length > 0 ? (
                    <div className="space-y-2">
                      {gameHistory.map((game) => {
                        const outcome = JSON.parse(game.outcome as string);
                        return (
                          <div key={game.id} className="flex justify-between items-center py-1.5 border-b border-[#1c2b3a] last:border-0">
                            <div className="flex items-center space-x-2">
                              <div className="text-xs bg-[#0e1824] px-2 py-1 rounded flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Crash: {outcome.crashPoint}x
                                {outcome.cashoutPoint > 0 && ` | Cashed: ${outcome.cashoutPoint}x`}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {game.win ? (
                                <span className="text-[#09b66d] flex items-center text-sm">
                                  <Rocket className="h-3 w-3 mr-1" />
                                  +{game.winAmount}
                                </span>
                              ) : (
                                <span className="text-[#FF3E8F] text-sm">-{game.bet}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No recent games found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
