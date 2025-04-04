import { useState } from 'react';
import { DiceGame } from "@/components/dice/dice-game";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { Dice5, Calculator, Calendar, TrendingUp, Coins } from "lucide-react";

export default function DicePage() {
  const { user } = useAuth();

  // Fetch game history specific to dice
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
    select: (data) => data.filter((history) => history.gameType === "dice").slice(0, 5),
  });

  return (
    <>
      {/* Header */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] mb-6">
        <div className="flex items-center justify-between h-16 px-4">            
          <div className="md:flex flex-1 px-4 justify-center">
            <h1 className="text-xl font-bold">Dice Game</h1>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <DiceGame />
            </div>
            
            <div className="space-y-6">
              {/* How to Play */}
              <Card className="bg-[#192531] border-[#1c2b3a]">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Dice5 className="h-5 w-5 mr-2 text-[#FF3E8F]" />
                    How to Play
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <span>Set your bet amount and target number.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <span>Choose to roll under or over your selected target.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-[#0e1824] text-[#09b66d] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <span>Win if the dice meets your prediction!</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Probabilities */}
              <Card className="bg-[#192531] border-[#1c2b3a]">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-[#09b66d]" />
                    Win Probability
                  </h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>The probability of winning depends on your target number:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-[#0e1824] p-2 rounded">
                        <div className="text-xs text-gray-400">Target: 25</div>
                        <div className="flex justify-between">
                          <span>Roll Under:</span>
                          <span className="text-[#09b66d]">25%</span>
                        </div>
                      </div>
                      <div className="bg-[#0e1824] p-2 rounded">
                        <div className="text-xs text-gray-400">Target: 50</div>
                        <div className="flex justify-between">
                          <span>Roll Under:</span>
                          <span className="text-[#09b66d]">50%</span>
                        </div>
                      </div>
                      <div className="bg-[#0e1824] p-2 rounded">
                        <div className="text-xs text-gray-400">Target: 75</div>
                        <div className="flex justify-between">
                          <span>Roll Under:</span>
                          <span className="text-[#09b66d]">75%</span>
                        </div>
                      </div>
                      <div className="bg-[#0e1824] p-2 rounded">
                        <div className="text-xs text-gray-400">Target: 90</div>
                        <div className="flex justify-between">
                          <span>Roll Under:</span>
                          <span className="text-[#09b66d]">90%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">The lower your chance of winning, the higher your potential reward!</p>
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
                        const outcome = JSON.parse(game.outcome as string);
                        return (
                          <div key={game.id} className="flex justify-between items-center py-1.5 border-b border-[#1c2b3a] last:border-0">
                            <div className="flex items-center space-x-2">
                              <div className="text-xs bg-[#0e1824] px-2 py-1 rounded">
                                Result: {outcome.result} | Target: {outcome.target} | {outcome.isOver ? 'Over' : 'Under'}
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
      </main>
    </>
  );
}
