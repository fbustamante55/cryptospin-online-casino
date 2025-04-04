import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { formatNumber } from "@/lib/game-utils";
import { 
  History, 
  Filter, 
  TrendingUp, 
  Dices, 
  Gamepad,
  Zap,
  CreditCard,
  Joystick,
  Clock,
  Calendar
} from "lucide-react";

export default function RecentGamesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch game history
  const { data: gameHistory = [] } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
  });

  // Sort game history by createdAt in descending order (most recent first)
  const sortedGameHistory = useMemo(() => {
    return [...gameHistory].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [gameHistory]);

  // Filter history based on active tab
  const filteredHistory = useMemo(() => {
    return sortedGameHistory.filter(game => {
      if (activeTab === "all") return true;
      return game.gameType === activeTab;
    });
  }, [sortedGameHistory, activeTab]);

  // Calculate stats
  const totalGames = gameHistory.length || 0;
  const totalWins = gameHistory.filter(game => game.win).length || 0;
  const winRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : "0.0";
  
  const totalBet = gameHistory.reduce((sum, game) => sum + game.bet, 0) || 0;
  const totalWon = gameHistory.filter(game => game.win).reduce((sum, game) => sum + game.winAmount, 0) || 0;
  const profit = totalWon - totalBet;

  // Get game-specific icon
  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'slots':
        return <Joystick className="h-4 w-4 mr-1.5" />;
      case 'roulette':
        return <Gamepad className="h-4 w-4 mr-1.5" />;
      case 'dice':
        return <Dices className="h-4 w-4 mr-1.5" />;
      case 'crash':
        return <Zap className="h-4 w-4 mr-1.5" />;
      case 'blackjack':
        return <CreditCard className="h-4 w-4 mr-1.5" />;
      case 'baccarat':
        return <CreditCard className="h-4 w-4 mr-1.5" />;
      default:
        return <Gamepad className="h-4 w-4 mr-1.5" />;
    }
  };

  // Format the date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  // Render the game outcome based on the game type
  const renderOutcome = (game: GameHistory) => {
    try {
      const outcome = JSON.parse(game.outcome as string);
      
      switch (game.gameType) {
        case 'slots':
          return (
            <div className="flex items-center space-x-1 text-xs bg-[#0e1824] px-2 py-1 rounded">
              {Array.isArray(outcome) && outcome.map((symbol, i) => (
                <span key={i}>{symbol}</span>
              ))}
            </div>
          );
        case 'dice':
          return (
            <div className="flex items-center text-xs bg-[#0e1824] px-2 py-1 rounded">
              <Dices className="h-3 w-3 mr-1" />
              {outcome.result} {outcome.isOver ? '>' : '<'} {outcome.target}
            </div>
          );
        case 'crash':
          return (
            <div className="flex items-center text-xs bg-[#0e1824] px-2 py-1 rounded">
              <Clock className="h-3 w-3 mr-1" />
              Crash: {outcome.crashPoint}x
              {outcome.cashoutPoint > 0 && ` | Cashed: ${outcome.cashoutPoint}x`}
            </div>
          );
        case 'roulette':
          return (
            <div className="flex items-center text-xs bg-[#0e1824] px-2 py-1 rounded">
              <span 
                className={`h-4 w-4 rounded-full mr-1 ${
                  outcome.color === 'red' 
                    ? 'bg-[#FF3E8F]' 
                    : outcome.color === 'black' 
                      ? 'bg-black' 
                      : 'bg-[#09b66d]'
                }`}
              ></span>
              {outcome.number}
            </div>
          );
        case 'blackjack':
        case 'baccarat':
          return (
            <div className="flex items-center text-xs bg-[#0e1824] px-2 py-1 rounded">
              <CreditCard className="h-3 w-3 mr-1" />
              {outcome.result}
            </div>
          );
        default:
          return <div className="text-xs">-</div>;
      }
    } catch (error) {
      return <div className="text-xs">Invalid outcome</div>;
    }
  };

  return (
    <>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <History className="h-6 w-6 mr-2 text-[#09b66d]" />
              Recent Games
            </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-[#192531] border-[#1c2b3a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">Total Games</p>
                    <p className="text-2xl font-bold text-white">{totalGames}</p>
                  </div>
                  <div className="h-12 w-12 bg-[#09b66d]/20 rounded-full flex items-center justify-center">
                    <Gamepad className="h-6 w-6 text-[#09b66d]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#192531] border-[#1c2b3a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold text-white">{winRate}%</p>
                  </div>
                  <div className="h-12 w-12 bg-[#09b66d]/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[#09b66d]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#192531] border-[#1c2b3a]">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">Profit</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-[#09b66d]' : 'text-[#FF3E8F]'}`}>
                      {profit >= 0 ? '+' : ''}{formatNumber(profit)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 ${profit >= 0 ? 'bg-[#09b66d]/20' : 'bg-[#FF3E8F]/20'} rounded-full flex items-center justify-center`}>
                    <TrendingUp className={`h-6 w-6 ${profit >= 0 ? 'text-[#09b66d]' : 'text-[#FF3E8F]'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-[#192531] border-[#1c2b3a]">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#1c2b3a] pb-2">
              <CardTitle className="text-xl mb-2 md:mb-0">Game History</CardTitle>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-[#0e1824]">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="slots">Slots</TabsTrigger>
                  <TabsTrigger value="dice">Dice</TabsTrigger>
                  <TabsTrigger value="crash">Crash</TabsTrigger>
                  <TabsTrigger value="roulette">Roulette</TabsTrigger>
                  <TabsTrigger value="blackjack">Blackjack</TabsTrigger>
                  <TabsTrigger value="baccarat">Baccarat</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No game history found</p>
                  <p className="text-sm mt-1">Play some games to see your history here!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((game) => (
                    <div 
                      key={game.id} 
                      className="flex justify-between items-center p-3 border-b border-[#1c2b3a] last:border-0 hover:bg-[#0e1824]/30 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center ${game.win ? 'text-[#09b66d]' : 'text-gray-400'}`}>
                          {getGameIcon(game.gameType)}
                          <span className="capitalize font-medium">{game.gameType}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {renderOutcome(game)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`text-sm ${game.win ? 'text-[#09b66d]' : 'text-[#FF3E8F]'} flex items-center`}>
                          {game.win ? (
                            <span className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{formatNumber(game.winAmount)}
                            </span>
                          ) : (
                            <span>-{formatNumber(game.bet)}</span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(game.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}