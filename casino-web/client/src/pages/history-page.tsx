import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { 
  History, 
  Filter, 
  TrendingUp, 
  Dices, 
  Gamepad,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search
} from "lucide-react";

export default function HistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch game history
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
  });

  // Filter history based on active tab
  const filteredHistory = gameHistory?.filter(game => {
    if (activeTab === "all") return true;
    return game.gameType === activeTab;
  });

  // Calculate stats
  const totalGames = gameHistory?.length || 0;
  const totalWins = gameHistory?.filter(game => game.win).length || 0;
  const winRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : "0.0";
  
  const totalBet = gameHistory?.reduce((sum, game) => sum + game.bet, 0) || 0;
  const totalWon = gameHistory?.filter(game => game.win).reduce((sum, game) => sum + game.winAmount, 0) || 0;
  const profit = totalWon - totalBet;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#1A2634] border-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Games</p>
                <h3 className="text-2xl font-heading font-semibold">{totalGames}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0F1923] flex items-center justify-center">
                <History className="h-5 w-5 text-[#00FFAA]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">Win Rate</p>
                <h3 className="text-2xl font-heading font-semibold">{winRate}%</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0F1923] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#F9C846]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Wagered</p>
                <h3 className="text-2xl font-heading font-semibold">{totalBet}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0F1923] flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-[#FF3E8F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">Profit/Loss</p>
                <h3 className={`text-2xl font-heading font-semibold ${profit >= 0 ? 'text-[#00FFAA]' : 'text-[#FF3E8F]'}`}>
                  {profit >= 0 ? '+' : ''}{profit}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0F1923] flex items-center justify-center">
                <ArrowUpRight className={`h-5 w-5 ${profit >= 0 ? 'text-[#00FFAA]' : 'text-[#FF3E8F]'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Game History */}
      <Card className="bg-[#1A2634] border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-heading flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-[#00FFAA]" />
              Game History
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative hidden md:block">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-8 pr-3 py-2 bg-[#0F1923] border border-gray-800 rounded-md text-sm focus:outline-none focus:border-[#00FFAA] w-48"
                />
              </div>
              <button className="p-2 bg-[#0F1923] border border-gray-800 rounded-md">
                <Filter className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#0F1923] mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">
                All Games
              </TabsTrigger>
              <TabsTrigger value="slots" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">
                <Gamepad className="h-4 w-4 mr-1.5" />
                Slots
              </TabsTrigger>
              <TabsTrigger value="dice" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">
                <Dices className="h-4 w-4 mr-1.5" />
                Dice
              </TabsTrigger>
              <TabsTrigger value="crash" className="data-[state=active]:bg-[#1A2634] data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Crash
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {filteredHistory && filteredHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Game</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Bet</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Result</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Win/Loss</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((game) => {
                        const outcome = JSON.parse(game.outcome as string);
                        return (
                          <tr key={game.id} className="border-b border-gray-800 last:border-0 hover:bg-[#0F1923]/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {game.gameType === 'slots' && <Gamepad className="h-4 w-4 mr-1.5 text-[#00FFAA]" />}
                                {game.gameType === 'dice' && <Dices className="h-4 w-4 mr-1.5 text-[#FF3E8F]" />}
                                {game.gameType === 'crash' && <TrendingUp className="h-4 w-4 mr-1.5 text-[#F9C846]" />}
                                <span className="capitalize">{game.gameType}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{game.bet}</td>
                            <td className="py-3 px-4">
                              {game.gameType === 'slots' && (
                                <span>{outcome.join(' • ')}</span>
                              )}
                              {game.gameType === 'dice' && (
                                <span>Result: {outcome.result} | Target: {outcome.target} | {outcome.isOver ? 'Over' : 'Under'}</span>
                              )}
                              {game.gameType === 'crash' && (
                                <span>
                                  Crash: {outcome.crashPoint}x
                                  {outcome.cashoutPoint > 0 && ` | Cashed: ${outcome.cashoutPoint}x`}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {game.win ? (
                                <span className="text-[#00FFAA] flex items-center">
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  +{game.winAmount}
                                </span>
                              ) : (
                                <span className="text-[#FF3E8F] flex items-center">
                                  <ArrowDownLeft className="h-3 w-3 mr-1" />
                                  -{game.bet}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center text-gray-400 text-sm">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(game.createdAt).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No game history found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
