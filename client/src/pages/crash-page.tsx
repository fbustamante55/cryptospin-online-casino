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
