import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { EventOdds } from '@/lib/sports-api';
import { formatEventDate, formatAmericanOdds } from '@/lib/sports-api';
import { BetSelection } from '@/components/sports/bet-slip';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import { Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
        <div className="text-sm font-medium mb-2 truncate">{event.home_team} vs {event.away_team}</div>
        
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-xs text-center text-gray-400">{t('sports.team')}</div>
          <div className="text-xs text-center text-gray-400">{t('sports.moneyline')}</div>
          <div className="text-xs text-center text-gray-400">{t('sports.spread')}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-1 items-center">
          <div className="text-xs font-medium truncate">{event.home_team}</div>
          
          <div className="text-center">
            {homeOdds && (
              <button 
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isSelectionInBetSlip(event.home_team, 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick(event.home_team, homeOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(homeOdds.price)}
              </button>
            )}
          </div>
          
          <div className="text-center">
            {spreadMarket?.outcomes.find(o => o.name === event.home_team) && (
              <button 
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isSelectionInBetSlip(event.home_team, 'spread')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => {
                  const outcome = spreadMarket.outcomes.find(o => o.name === event.home_team);
                  if (outcome) {
                    handleBetClick(event.home_team, outcome.price, 'spread', outcome.point);
                  }
                }}
              >
                {spreadMarket.outcomes.find(o => o.name === event.home_team)?.point}
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-1 items-center">
          <div className="text-xs font-medium truncate">{event.away_team}</div>
          
          <div className="text-center">
            {awayOdds && (
              <button 
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isSelectionInBetSlip(event.away_team, 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick(event.away_team, awayOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(awayOdds.price)}
              </button>
            )}
          </div>
          
          <div className="text-center">
            {spreadMarket?.outcomes.find(o => o.name === event.away_team) && (
              <button 
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isSelectionInBetSlip(event.away_team, 'spread')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => {
                  const outcome = spreadMarket.outcomes.find(o => o.name === event.away_team);
                  if (outcome) {
                    handleBetClick(event.away_team, outcome.price, 'spread', outcome.point);
                  }
                }}
              >
                {spreadMarket.outcomes.find(o => o.name === event.away_team)?.point}
              </button>
            )}
          </div>
        </div>
        
        {/* Draw row (for soccer and other sports that have draws) */}
        {drawOdds && (
          <div className="grid grid-cols-3 gap-2 items-center pt-1 border-t border-[#1c2b3a]">
            <div className="text-xs font-medium">Draw</div>
            
            <div className="text-center">
              <button 
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                  isSelectionInBetSlip('Draw', 'moneyline')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#282e39] hover:bg-[#313d4a]'
                }`}
                onClick={() => handleBetClick('Draw', drawOdds.price, 'moneyline')}
              >
                {formatAmericanOdds(drawOdds.price)}
              </button>
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
  );
}