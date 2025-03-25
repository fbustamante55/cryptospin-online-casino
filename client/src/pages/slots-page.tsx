import { useState } from 'react';
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SlotsGame } from "@/components/slots/slots-game";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { motion } from "framer-motion";
import { Crown, Coins, Calendar, TrendingUp } from "lucide-react";

export default function SlotsPage() {
  const { user } = useAuth();

  // Fetch game history specific to slots
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
    select: (data) => data.filter((history) => history.gameType === "slots").slice(0, 5),
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F1923] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F1923] border-b border-gray-800 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
                <span className="text-[#00FFAA]">Crypto</span>Spin
              </h1>
            </div>
            
            <div className="md:flex flex-1 px-4 justify-center">
              <h1 className="text-xl font-heading font-bold">Slots Game</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1.5 rounded-full bg-[#1A2634] border border-gray-700 flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <SlotsGame />
              </div>
              
              <div className="space-y-6">
                {/* How to Play */}
                <Card className="bg-[#1A2634] border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-heading font-semibold mb-3 flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-[#F9C846]" />
                      How to Play
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p className="flex items-start">
                        <span className="bg-[#0F1923] text-[#00FFAA] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Set your bet amount using the controls.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="bg-[#0F1923] text-[#00FFAA] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Click the Spin button to start the game.</span>
                      </p>
                      <p className="flex items-start">
                        <span className="bg-[#0F1923] text-[#00FFAA] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Match symbols across the reels to win.</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payouts */}
                <Card className="bg-[#1A2634] border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-heading font-semibold mb-3 flex items-center">
                      <Coins className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      Payouts
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-6 h-6 flex items-center justify-center text-[#00FFAA] font-bold mr-2"
                          >
                            7
                          </motion.div>
                          <span>Three 7s</span>
                        </div>
                        <span className="text-[#00FFAA]">10x</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center text-[#FF3E8F] font-bold mr-2">BAR</span>
                          <span>Three BARs</span>
                        </div>
                        <span className="text-[#00FFAA]">5x</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center text-[#FF3E8F] font-bold mr-2">2xBAR</span>
                          <span>Three 2xBARs</span>
                        </div>
                        <span className="text-[#00FFAA]">4x</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center text-[#FF3E8F] font-bold mr-2">3xBAR</span>
                          <span>Three 3xBARs</span>
                        </div>
                        <span className="text-[#00FFAA]">3x</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center text-[#F9C846] font-bold mr-2">CH</span>
                          <span>Three CHERRYs</span>
                        </div>
                        <span className="text-[#00FFAA]">2.5x</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center text-gray-300 font-bold mr-2">ANY</span>
                          <span>Any matching symbols</span>
                        </div>
                        <span className="text-[#00FFAA]">2x</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Games */}
                <Card className="bg-[#1A2634] border-gray-800">
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
                            <div key={game.id} className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
                              <div className="flex items-center space-x-2">
                                <div className="text-xs bg-[#0F1923] px-2 py-1 rounded">
                                  {outcome.join(" • ")}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {game.win ? (
                                  <span className="text-[#00FFAA] flex items-center text-sm">
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
      </div>
      
      <MobileNav />
    </div>
  );
}
