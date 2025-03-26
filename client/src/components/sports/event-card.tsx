import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { EventOdds } from '@/lib/sports-api';
import { formatEventDate, formatAmericanOdds, oddsToImpliedProbability } from '@/lib/sports-api';
import { BetSelection } from '@/components/sports/bet-slip';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import { Star, HelpCircle, ChevronDown } from "lucide-react";
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

  // Estado para controlar el desplegable de mercados
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  
  // Función para detectar si el evento está en vivo basado en la fecha
  const isLiveEvent = () => {
    const now = new Date();
    const eventDate = new Date(event.commence_time);
    return eventDate <= now;
  };
  
  // Obtiene todos los mercados únicos disponibles
  const getAllMarkets = () => {
    const markets: { key: string, title: string }[] = [];
    const marketKeys = new Set<string>();
    
    event.bookmakers.forEach(bookmaker => {
      bookmaker.markets.forEach(market => {
        if (!marketKeys.has(market.key)) {
          marketKeys.add(market.key);
          
          // Traduce los nombres de los mercados
          let title = market.key;
          if (market.key === 'h2h') title = 'Ganador del partido';
          if (market.key === 'spreads') title = 'Handicap';
          if (market.key === 'totals') title = 'Total de puntos';
          
          markets.push({ key: market.key, title });
        }
      });
    });
    
    return markets;
  };

  return (
    <TooltipProvider>
      <Card className={`bg-[#0e1824] border-[#1c2b3a] ${className} relative overflow-hidden`}>
        {/* Favorite Star Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          disabled={!isLoaded || isPending || !user}
          className={cn(
            "absolute top-2 right-2 z-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50",
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
        
        {/* Encabezado del evento */}
        <div className="bg-[#0e1824] border-b border-[#1c2b3a] px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-400">{sportTitle || event.sport_key}</span>
            {isLiveEvent() && (
              <Badge className="ml-2 bg-red-600 text-white text-xs">
                En Vivo
              </Badge>
            )}
          </div>
          {event.commence_time && !isLiveEvent() && (
            <Badge variant="outline" className="text-xs bg-transparent">
              {formatEventDate(event.commence_time)}
            </Badge>
          )}
        </div>
        
        {/* Cuerpo principal del evento */}
        <div className="p-4">
          {/* Título del partido con diseño similar a la imagen de referencia */}
          <div className="flex flex-col mb-4">
            <div className="bg-[#182531] px-3 py-2 rounded-t mb-1">
              <div className="flex flex-row justify-between items-center">
                <div className="text-sm font-medium">{event.home_team}</div>
                <div className="text-sm font-medium text-gray-400">
                  {isLiveEvent() && <span className="text-white bg-[#282e39] px-2 py-1 rounded mr-2">1</span>}
                </div>
              </div>
            </div>
            <div className="bg-[#182531] px-3 py-2 rounded-b">
              <div className="flex flex-row justify-between items-center">
                <div className="text-sm font-medium">{event.away_team}</div>
                <div className="text-sm font-medium text-gray-400">
                  {isLiveEvent() && <span className="text-white bg-[#282e39] px-2 py-1 rounded mr-2">0</span>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mercado principal (Ganador del partido) */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Ganador del partido</h3>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Apuesta directamente a quien ganará el partido. <br />
                    <span className="text-green-400">+194</span>: Ganarías $194 por cada $100 apostados.<br />
                    <span className="text-red-400">-245</span>: Necesitas apostar $245 para ganar $100.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {homeOdds && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-4 py-3 rounded text-sm font-bold transition-colors ${
                        isSelectionInBetSlip(event.home_team, 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#182531] hover:bg-[#1e2d3d]'
                      }`}
                      onClick={() => handleBetClick(event.home_team, homeOdds.price, 'moneyline')}
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-200">{event.home_team}</span>
                        <span className={`${homeOdds.price < 0 ? 'text-red-400' : 'text-green-400'} font-bold`}>
                          {formatAmericanOdds(homeOdds.price)}
                        </span>
                      </div>
                      <div className="text-left mt-1">
                        <span className="text-[10px] text-gray-400">
                          Probabilidad: {(oddsToImpliedProbability(homeOdds.price) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {homeOdds.price > 0 
                        ? `Ganarías $${homeOdds.price} por cada $100 apostados` 
                        : `Necesitas apostar $${Math.abs(homeOdds.price)} para ganar $100`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {awayOdds && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-4 py-3 rounded text-sm font-bold transition-colors ${
                        isSelectionInBetSlip(event.away_team, 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#182531] hover:bg-[#1e2d3d]'
                      }`}
                      onClick={() => handleBetClick(event.away_team, awayOdds.price, 'moneyline')}
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-200">{event.away_team}</span>
                        <span className={`${awayOdds.price < 0 ? 'text-red-400' : 'text-green-400'} font-bold`}>
                          {formatAmericanOdds(awayOdds.price)}
                        </span>
                      </div>
                      <div className="text-left mt-1">
                        <span className="text-[10px] text-gray-400">
                          Probabilidad: {(oddsToImpliedProbability(awayOdds.price) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {awayOdds.price > 0 
                        ? `Ganarías $${awayOdds.price} por cada $100 apostados` 
                        : `Necesitas apostar $${Math.abs(awayOdds.price)} para ganar $100`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {drawOdds && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`px-4 py-3 rounded text-sm font-bold transition-colors ${
                        isSelectionInBetSlip('Draw', 'moneyline')
                          ? 'bg-[#09b66d] text-white'
                          : 'bg-[#182531] hover:bg-[#1e2d3d]'
                      }`}
                      onClick={() => handleBetClick('Draw', drawOdds.price, 'moneyline')}
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-200">Empate</span>
                        <span className={`${drawOdds.price < 0 ? 'text-red-400' : 'text-yellow-400'} font-bold`}>
                          {formatAmericanOdds(drawOdds.price)}
                        </span>
                      </div>
                      <div className="text-left mt-1">
                        <span className="text-[10px] text-gray-400">
                          Probabilidad: {(oddsToImpliedProbability(drawOdds.price) * 100).toFixed(1)}%
                        </span>
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
              )}
            </div>
          </div>
          
          {/* Mercado de Handicap/Spread si existe */}
          {spreadMarket && spreadMarket.outcomes.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium">Handicap</h3>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Apuesta con ventaja/desventaja para equilibrar las probabilidades. <br />
                      <span className="text-blue-400">-1.5</span>: El equipo debe ganar por al menos 2 puntos.<br />
                      <span className="text-blue-400">+1.5</span>: El equipo puede perder por 1 punto y seguirías ganando.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {spreadMarket.outcomes.map((outcome, index) => {
                  const isHome = outcome.name === event.home_team;
                  const point = outcome.point;
                  const pointStr = point && point > 0 ? `+${point}` : point;
                  
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <button 
                          className={`px-4 py-3 rounded text-sm font-bold transition-colors ${
                            isSelectionInBetSlip(outcome.name, 'spread')
                              ? 'bg-[#09b66d] text-white'
                              : 'bg-[#182531] hover:bg-[#1e2d3d]'
                          }`}
                          onClick={() => {
                            handleBetClick(outcome.name, outcome.price, 'spread', outcome.point);
                          }}
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-200">{outcome.name}</span>
                            <span className="text-blue-400 font-bold">{pointStr}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">
                              {point && point > 0 ? 'Ventaja' : 'Desventaja'}
                            </span>
                            <span className="text-gray-400">
                              {formatAmericanOdds(outcome.price)}
                            </span>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {point && point > 0 
                            ? `${outcome.name} recibe ${point} puntos de ventaja` 
                            : `${outcome.name} da ${Math.abs(point || 0)} puntos`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Todos los mercados (desplegable) */}
          {event.bookmakers.length > 0 && (
            <div className="mt-4 border-t border-[#1c2b3a] pt-3">
              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center p-0 hover:bg-transparent text-[#09b66d]"
                onClick={() => setShowAllMarkets(!showAllMarkets)}
              >
                <span className="text-xs flex items-center">
                  {showAllMarkets ? 'Ocultar mercados' : `+${event.bookmakers.reduce((count, bm) => count + bm.markets.length, 0)} mercados disponibles`}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAllMarkets ? 'transform rotate-180' : ''}`} />
              </Button>
              
              {showAllMarkets && (
                <div className="mt-3 space-y-4">
                  {getAllMarkets()
                    .filter(market => market.key !== 'h2h' && market.key !== 'spreads') // Filtramos los que ya mostramos
                    .map((market, index) => {
                      const marketData = event.bookmakers[0]?.markets.find(m => m.key === market.key);
                      if (!marketData) return null;

                      return (
                        <div key={index} className="border-t border-[#1c2b3a] pt-3">
                          <h3 className="text-sm font-medium mb-2">{market.title}</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {marketData.outcomes.map((outcome, i) => (
                              <button 
                                key={i}
                                className="px-4 py-3 rounded text-sm bg-[#182531] hover:bg-[#1e2d3d]"
                                onClick={() => handleBetClick(outcome.name, outcome.price, market.key, outcome.point)}
                              >
                                <div className="flex justify-between">
                                  <span className="text-gray-200">{outcome.name}</span>
                                  <span className="text-blue-400 font-bold">
                                    {outcome.point ? (outcome.point > 0 ? `+${outcome.point}` : outcome.point) : ''}
                                  </span>
                                </div>
                                <div className="text-right mt-1">
                                  <span className="text-gray-400">{formatAmericanOdds(outcome.price)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}