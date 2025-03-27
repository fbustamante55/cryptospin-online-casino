import { useState, useEffect } from 'react';
import { SlotopolGames } from "@/components/slots/slotopol-games";
import { SlotopolGameDetail } from "@/components/slots/slotopol-game-detail";
import { SlotsGame } from "@/components/slots/slots-game";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { motion } from "framer-motion";
import { Crown, Coins, Calendar, TrendingUp, ChevronLeft } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function SlotsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [gameId, setGameId] = useState<string | null>(null);

  // Extract gameId from URL if it exists
  useEffect(() => {
    const pathSegments = location.split('/');
    if (pathSegments.length > 2 && pathSegments[1] === 'slots') {
      setGameId(pathSegments[2]);
    } else {
      setGameId(null);
    }
  }, [location]);

  // Fetch game history specific to slots
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
    select: (data) => data.filter((history) => history.gameType === "slots").slice(0, 5),
  });

  return (
    <>
      {/* Header */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] mb-6">
        <div className="flex items-center justify-between h-16 px-4">            
          <div className="flex flex-1 items-center">
            {gameId && (
              <Link href="/slots">
                <button className="mr-3 p-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] hover:bg-[#192531]/80 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </Link>
            )}
            <h1 className="text-xl font-bold">
              {gameId ? 'Slot Game' : 'Slot Games'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
              <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
              <span className="text-sm font-semibold">{user?.balance}</span>
            </div>
          </div>
        </div>
      </header>
        
      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {gameId ? (
            // Display specific game
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <SlotopolGameDetail gameId={gameId} />
              </div>
              
              <div className="space-y-6">
                {/* How to Play */}
                <Card className="bg-[#192531] border-[#1c2b3a]">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-[#F9C846]" />
                      How to Play
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p className="flex items-start">
                        <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Set your bet amount using the controls.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Select the number of paylines to play.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Click the Spin button to start the game.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
                        <span>Match symbols across the reels to win.</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Games */}
                <Card className="bg-[#192531] border-[#1c2b3a]">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-[#FF3E8F]" />
                      Recent Games
                    </h3>
                    
                    {gameHistory && gameHistory.length > 0 ? (
                      <div className="space-y-2">
                        {gameHistory.map((game) => {
                          const outcome = typeof game.outcome === 'string' ? JSON.parse(game.outcome) : game.outcome;
                          return (
                            <div key={game.id} className="flex justify-between items-center py-1.5 border-b border-[#1c2b3a] last:border-0">
                              <div className="flex items-center space-x-2">
                                <div className="text-xs bg-[#0e1824] px-2 py-1 rounded">
                                  {Array.isArray(outcome) ? outcome.join(" • ") : JSON.stringify(outcome)}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {game.win ? (
                                  <span className="text-[#09b66d] flex items-center text-sm">
                                    <TrendingUp className="h-3 w-3 mr-1" />
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
          ) : (
            // Display list of all games
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Casino Slots</h2>
                <div className="bg-[#192531] border border-[#1c2b3a] rounded-lg p-4 md:p-6">
                  <SlotopolGames />
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Featured Games</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <SlotsGame />
                  </div>
                  
                  <div className="space-y-6">
                    {/* How to Play */}
                    <Card className="bg-[#192531] border-[#1c2b3a]">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Crown className="h-5 w-5 mr-2 text-[#F9C846]" />
                          How to Play
                        </h3>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p className="flex items-start">
                            <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                            <span>Set your bet amount using the controls.</span>
                          </p>
                          <p className="flex items-start">
                            <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                            <span>Click the Spin button to start the game.</span>
                          </p>
                          <p className="flex items-start">
                            <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                            <span>Match symbols across the reels to win.</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Payouts */}
                    <Card className="bg-[#192531] border-[#1c2b3a]">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Coins className="h-5 w-5 mr-2 text-[#09b66d]" />
                          Payouts
                        </h3>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <motion.div 
                                animate={{ scale: [1, 1.05, 1] }} 
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-6 h-6 flex items-center justify-center text-[#09b66d] font-bold mr-2"
                              >
                                7
                              </motion.div>
                              <span>Three 7s</span>
                            </div>
                            <span className="text-[#09b66d]">10x</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <span className="w-6 h-6 flex items-center justify-center text-[#FF3E8F] font-bold mr-2">BAR</span>
                              <span>Three BARs</span>
                            </div>
                            <span className="text-[#09b66d]">5x</span>
                          </div>
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <span className="w-6 h-6 flex items-center justify-center text-[#F9C846] font-bold mr-2">CH</span>
                              <span>Three CHERRYs</span>
                            </div>
                            <span className="text-[#09b66d]">2.5x</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Recent Games */}
                    <Card className="bg-[#192531] border-[#1c2b3a]">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-[#FF3E8F]" />
                          Recent Games
                        </h3>
                        
                        {gameHistory && gameHistory.length > 0 ? (
                          <div className="space-y-2">
                            {gameHistory.map((game) => {
                              const outcome = typeof game.outcome === 'string' ? JSON.parse(game.outcome) : game.outcome;
                              return (
                                <div key={game.id} className="flex justify-between items-center py-1.5 border-b border-[#1c2b3a] last:border-0">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-xs bg-[#0e1824] px-2 py-1 rounded">
                                      {Array.isArray(outcome) ? outcome.join(" • ") : JSON.stringify(outcome)}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {game.win ? (
                                      <span className="text-[#09b66d] flex items-center text-sm">
                                        <TrendingUp className="h-3 w-3 mr-1" />
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
            </div>
          )}
        </div>
      </main>
    </>
  );
}
