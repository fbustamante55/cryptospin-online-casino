import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { EventOdds } from '@/lib/sports-api';
import { formatEventDate, formatAmericanOdds, oddsToImpliedProbability } from '@/lib/sports-api';
import { BetSelection } from '@/components/sports/bet-slip';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import { Star, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventCardProps {
  event: EventOdds;
  onAddSelection: (selection: BetSelection) => void;
  selectedBets: BetSelection[];
  sportTitle?: string;
  className?: string;
}

export function EventCard({ event, onAddSelection, selectedBets, sportTitle = '', className = '' }: EventCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  
  const gameType = 'sports'; // Using 'sports' as the gameType for all sport events
  const gameId = event.id; // Each event has a unique ID
  const gameName = `${event.home_team} vs. ${event.away_team}`; // Create a human-readable game name

  // Get the moneyline (h2h) market if available
  const moneylineMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'h2h') 
    : undefined;
  
  // Get the spread market if available
  const spreadMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'spreads') 
    : undefined;
  
  // Get the totals market if available
  const totalsMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'totals') 
    : undefined;
    
  // Check if this event is already a favorite
  const { data, isLoading } = useQuery({
    queryKey: ['/api/favorites/check', gameType, gameId],
    queryFn: async () => {
      if (!user) return { isFavorite: false };
      
      const params = new URLSearchParams({
        gameType,
        gameId
      });
      
      return apiRequest<{ isFavorite: boolean, favoriteId?: number }>({
        url: `/api/favorites/check?${params}`,
        method: 'GET'
      });
    },
    enabled: !!user,
  });
  
  // Add to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t("favorites.login_required"));
      
      return apiRequest({
        url: '/api/favorites',
        method: 'POST',
        data: {
          userId: user.id,
          gameType,
          gameId,
          gameTitle: gameName,
          gameImage: null // No image for sports events
        }
      });
    },
    onSuccess: (data) => {
      setFavoriteId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: t("favorites.added_title"),
        description: t("favorites.added_description", { gameName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || t("favorites.failed_add"),
        variant: "destructive"
      });
    }
  });
  
  // Remove from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error(t("favorites.login_required_remove"));
      
      return apiRequest({
        url: `/api/favorites/${id}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setFavoriteId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: t("favorites.removed_title"),
        description: t("favorites.removed_description", { gameName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || t("favorites.failed_remove"),
        variant: "destructive"
      });
    }
  });
  
  useEffect(() => {
    if (data?.favoriteId) {
      setFavoriteId(data.favoriteId);
    }
  }, [data]);
  
  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: t("auth.login_required"),
        description: t("favorites.login_required_message"),
        variant: "destructive"
      });
      return;
    }

    if (data?.isFavorite && favoriteId) {
      removeFavoriteMutation.mutate(favoriteId);
    } else {
      addFavoriteMutation.mutate();
    }
  };
  
  // Get home team odds
  const homeOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.home_team);
  
  // Get away team odds
  const awayOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.away_team);
  
  // Get draw odds if they exist
  const drawOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === 'Draw');
  
  // Check if a selection is already in the bet slip
  const isSelectionInBetSlip = (team: string, marketType: string): boolean => {
    return selectedBets.some(bet => 
      bet.eventId === event.id && 
      bet.selectedTeam === team && 
      bet.marketType === marketType
    );
  };
  
  // Create a bet selection object
  const createSelection = (team: string, odds: number, marketType: string, point?: number): BetSelection => {
    return {
      id: nanoid(),
      eventId: event.id,
      sportKey: event.sport_key,
      sportTitle: sportTitle || event.sport_key,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      selectedTeam: team,
      odds,
      marketType,
      point
    };
  };
  
  // Handle clicking on a betting option
  const handleBetClick = (team: string, odds: number, marketType: string, point?: number) => {
    // Create a selection object
    const selection = createSelection(team, odds, marketType, point);
    
    // Add to bet slip
    onAddSelection(selection);
  };
  
  // Prepare favorite button status
  const isFavorite = data?.isFavorite || false;
  const isLoaded = !isLoading;
  const isPending = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  return (
    <TooltipProvider>
      <Card className={`bg-[#192531] border-[#1c2b3a] p-3 ${className} relative overflow-hidden`}>
        {/* Favorite Star Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          disabled={!isLoaded || isPending || !user}
          className={cn(
            "absolute top-1 right-1 z-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50",
            "w-6 h-6 flex items-center justify-center"
          )}
        >
          <Star
            className={cn(
              "h-3 w-3 transition-all",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        </Button>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-400 truncate">{sportTitle || event.sport_key}</span>
            {event.commence_time && (
              <Badge variant="outline" className="ml-2 text-xs bg-transparent">
                {formatEventDate(event.commence_time)}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-sm font-medium mb-3 truncate">{event.home_team} vs {event.away_team}</div>
          
          {/* Headers with tooltips */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="text-xs text-left text-gray-400">{t('sports.team')}</div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="text-xs text-center text-gray-400 flex items-center justify-center cursor-help">
                  {t('sports.moneyline')} <HelpCircle className="h-3 w-3 ml-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Apuesta directamente a quien ganará el partido. <br />
                <span className="text-green-400">+194</span>: Ganarías $194 por cada $100 apostados.<br />
                <span className="text-red-400">-245</span>: Necesitas apostar $245 para ganar $100.</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="text-xs text-center text-gray-400 flex items-center justify-center cursor-help">
                  {t('sports.spread')} <HelpCircle className="h-3 w-3 ml-1" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Apuesta con ventaja/desventaja para equilibrar las probabilidades. <br />
                <span className="text-blue-400">-1.5</span>: El equipo debe ganar por al menos 2 puntos.<br />
                <span className="text-blue-400">+1.5</span>: El equipo puede perder por 1 punto y seguirías ganando.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Home team row */}
          <div className="grid grid-cols-3 gap-2 mb-2 items-center">
            <div className="text-xs font-medium truncate">{event.home_team}</div>
            
            <div className="text-center">
              {homeOdds && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-3 py-2 rounded text-xs font-bold transition-colors w-full ${
                        isSelectionInBetSlip(event.home_team, 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : homeOdds.price < 0 
                            ? 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-red-500'  // Favorito (cuota negativa)
                            : 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-green-500' // No favorito (cuota positiva)
                      }`}
                      onClick={() => handleBetClick(event.home_team, homeOdds.price, 'moneyline')}
                    >
                      <div className="flex flex-col">
                        <span>{formatAmericanOdds(homeOdds.price)}</span>
                        <span className="text-[10px] opacity-70">
                          {homeOdds.price < 0 ? 'Favorito' : 'No favorito'}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {homeOdds.price > 0 
                        ? `Ganarías $${homeOdds.price} por cada $100 apostados` 
                        : `Necesitas apostar $${Math.abs(homeOdds.price)} para ganar $100`}
                      <br />
                      Probabilidad: {(oddsToImpliedProbability(homeOdds.price) * 100).toFixed(1)}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <div className="text-center">
              {spreadMarket?.outcomes.find(o => o.name === event.home_team) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-3 py-2 rounded text-xs font-bold transition-colors w-full ${
                        isSelectionInBetSlip(event.home_team, 'spread')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-blue-500'
                      }`}
                      onClick={() => {
                        const outcome = spreadMarket.outcomes.find(o => o.name === event.home_team);
                        if (outcome) {
                          handleBetClick(event.home_team, outcome.price, 'spread', outcome.point);
                        }
                      }}
                    >
                      <div className="flex flex-col">
                        {(() => {
                          const point = spreadMarket.outcomes.find(o => o.name === event.home_team)?.point;
                          return (
                            <span>{point && point > 0 ? `+${point}` : point}</span>
                          );
                        })()}
                        <span className="text-[10px] opacity-70">
                          {(() => {
                            const point = spreadMarket.outcomes.find(o => o.name === event.home_team)?.point;
                            return point && point > 0 ? 'Ventaja' : 'Desventaja';
                          })()}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {(() => {
                        const outcome = spreadMarket.outcomes.find(o => o.name === event.home_team);
                        if (!outcome) return '';
                        return outcome.point && outcome.point > 0 
                          ? `${event.home_team} recibe ${outcome.point} puntos de ventaja` 
                          : `${event.home_team} da ${Math.abs(outcome.point || 0)} puntos`;
                      })()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Away team row */}
          <div className="grid grid-cols-3 gap-2 mb-2 items-center">
            <div className="text-xs font-medium truncate">{event.away_team}</div>
            
            <div className="text-center">
              {awayOdds && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-3 py-2 rounded text-xs font-bold transition-colors w-full ${
                        isSelectionInBetSlip(event.away_team, 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : awayOdds.price < 0 
                            ? 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-red-500'  // Favorito (cuota negativa)
                            : 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-green-500' // No favorito (cuota positiva)
                      }`}
                      onClick={() => handleBetClick(event.away_team, awayOdds.price, 'moneyline')}
                    >
                      <div className="flex flex-col">
                        <span>{formatAmericanOdds(awayOdds.price)}</span>
                        <span className="text-[10px] opacity-70">
                          {awayOdds.price < 0 ? 'Favorito' : 'No favorito'}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {awayOdds.price > 0 
                        ? `Ganarías $${awayOdds.price} por cada $100 apostados` 
                        : `Necesitas apostar $${Math.abs(awayOdds.price)} para ganar $100`}
                      <br />
                      Probabilidad: {(oddsToImpliedProbability(awayOdds.price) * 100).toFixed(1)}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <div className="text-center">
              {spreadMarket?.outcomes.find(o => o.name === event.away_team) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-3 py-2 rounded text-xs font-bold transition-colors w-full ${
                        isSelectionInBetSlip(event.away_team, 'spread')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-blue-500'
                      }`}
                      onClick={() => {
                        const outcome = spreadMarket.outcomes.find(o => o.name === event.away_team);
                        if (outcome) {
                          handleBetClick(event.away_team, outcome.price, 'spread', outcome.point);
                        }
                      }}
                    >
                      <div className="flex flex-col">
                        {(() => {
                          const point = spreadMarket.outcomes.find(o => o.name === event.away_team)?.point;
                          return (
                            <span>{point && point > 0 ? `+${point}` : point}</span>
                          );
                        })()}
                        <span className="text-[10px] opacity-70">
                          {(() => {
                            const point = spreadMarket.outcomes.find(o => o.name === event.away_team)?.point;
                            return point && point > 0 ? 'Ventaja' : 'Desventaja';
                          })()}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {(() => {
                        const outcome = spreadMarket.outcomes.find(o => o.name === event.away_team);
                        if (!outcome) return '';
                        return outcome.point && outcome.point > 0 
                          ? `${event.away_team} recibe ${outcome.point} puntos de ventaja` 
                          : `${event.away_team} da ${Math.abs(outcome.point || 0)} puntos`;
                      })()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Draw row (for soccer and other sports that have draws) */}
          {drawOdds && (
            <div className="grid grid-cols-3 gap-2 items-center pt-2 mt-1 border-t border-[#1c2b3a]">
              <div className="text-xs font-medium">Empate</div>
              
              <div className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-3 py-2 rounded text-xs font-bold transition-colors w-full ${
                        isSelectionInBetSlip('Draw', 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#282e39] hover:bg-[#313d4a] border-l-4 border-yellow-500'
                      }`}
                      onClick={() => handleBetClick('Draw', drawOdds.price, 'moneyline')}
                    >
                      <div className="flex flex-col">
                        <span>{formatAmericanOdds(drawOdds.price)}</span>
                        <span className="text-[10px] opacity-70">Empate</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {drawOdds.price > 0 
                        ? `Ganarías $${drawOdds.price} por cada $100 apostados en empate` 
                        : `Necesitas apostar $${Math.abs(drawOdds.price)} para ganar $100 en empate`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div></div>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <span className="text-xs text-[#09b66d] cursor-pointer">
            +{event.bookmakers.reduce((count, bm) => count + bm.markets.length, 0)} {t('sports.markets')}
          </span>
        </div>
      </Card>
    </TooltipProvider>
  );
}