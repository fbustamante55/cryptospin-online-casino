import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { EventOdds } from '@/lib/sports-api';
import { formatAmericanOdds, oddsToImpliedProbability, formatEventDate } from '@/lib/sports-api';
import { BetSelection } from '@/components/sports/bet-slip';
import { nanoid } from 'nanoid';
import { useTranslation } from 'react-i18next';
import { Star, Clock } from "lucide-react";
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

export function NewEventCard({ 
  event, 
  onAddSelection, 
  selectedBets, 
  sportTitle = '', 
  className = '' 
}: EventCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  
  const gameType = 'sports';
  const gameId = event.id;
  const gameName = `${event.home_team} vs. ${event.away_team}`;

  // Get the moneyline (h2h) market if available
  const moneylineMarket = event.bookmakers?.length > 0 
    ? event.bookmakers[0].markets.find(market => market.key === 'h2h') 
    : undefined;
  
  // Extract moneyline odds for home, away and draw (if soccer)
  const homeOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.home_team);
  const awayOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === event.away_team);
  const drawOdds = moneylineMarket?.outcomes.find(outcome => outcome.name === 'Draw');
  
  // Check isFavorite from the API
  const { data: favoriteData } = useQuery({
    queryKey: ['/api/favorites/check', gameType, gameId],
    queryFn: async () => {
      return apiRequest<{ isFavorite: boolean }>({
        url: `/api/favorites/check?gameType=${gameType}&gameId=${gameId}`,
        method: 'GET'
      });
    }
  });
  
  // Mutation to add to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ id: number }>({
        url: '/api/favorites',
        method: 'POST',
        data: {
          gameType,
          gameId,
          gameTitle: gameName
        }
      });
    },
    onSuccess: (data) => {
      setFavoriteId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: "Añadido a favoritos",
        description: `${event.home_team} vs ${event.away_team} ha sido añadido a tus favoritos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo añadir a favoritos: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to remove from favorites
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (favoriteId: number) => {
      return apiRequest({
        url: `/api/favorites/${favoriteId}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setFavoriteId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: "Eliminado de favoritos",
        description: `${event.home_team} vs ${event.away_team} ha sido eliminado de tus favoritos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar de favoritos: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle toggling favorite status
  const toggleFavorite = () => {
    if (favoriteData?.isFavorite && favoriteId) {
      removeFromFavoritesMutation.mutate(favoriteId);
    } else {
      addToFavoritesMutation.mutate();
    }
  };
  
  // Create a bet selection when user clicks on a bet option
  const handleBetClick = (teamName: string, odds: number, marketType: string, point?: number) => {
    const selection: BetSelection = {
      id: nanoid(),
      eventId: event.id,
      sportKey: event.sport_key,
      sportTitle: sportTitle || event.sport_key,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      selectedTeam: teamName,
      odds,
      marketType,
      point
    };
    
    onAddSelection(selection);
  };
  
  // Check if a selection is already in the bet slip
  const isSelectionInBetSlip = (teamName: string, marketType: string): boolean => {
    return selectedBets.some(
      bet => bet.selectedTeam === teamName && 
            bet.marketType === marketType && 
            bet.eventId === event.id
    );
  };
  
  // Función para detectar si el evento está en vivo basado en la fecha
  const isLiveEvent = () => {
    const now = new Date();
    const eventDate = new Date(event.commence_time);
    return eventDate <= now;
  };
  
  // Eliminamos la función duplicada, ya que ahora usamos la importada
  // desde sports-api.ts

  return (
    <Card className={`bg-[#121c2e] border-[#1a2e4a] overflow-hidden ${className}`}>
      {/* Encabezado con el título de la liga */}
      <div className="bg-[#121c2e] border-b border-[#1a2e4a] p-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-400">{sportTitle || event.sport_key}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          className="h-5 w-5 p-0"
        >
          <Star
            className={cn(
              "h-3 w-3",
              favoriteData?.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
            )}
          />
        </Button>
      </div>
      
      {/* Fecha del evento */}
      <div className="bg-[#121c2e] px-3 py-1 border-b border-[#1a2e4a]">
        <div className="flex items-center text-xs text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatEventDate(event.commence_time)}</span>
        </div>
      </div>
      
      {/* Contenido principal - basado en el diseño del screenshot */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          {/* Sección de estado (En Vivo / Medio Tiempo) */}
          <div className="flex">
            {isLiveEvent() && (
              <Badge className="mr-2 bg-red-600 text-white text-xs py-0 px-1.5 h-4">
                En Vivo
              </Badge>
            )}
            {isLiveEvent() && (
              <span className="text-xs text-gray-400">Medio Tiempo</span>
            )}
          </div>
          
          {/* Indicador 1x2 */}
          <div className="text-xs font-semibold text-gray-400">1x2</div>
        </div>
        
        {/* Equipos y cuotas */}
        <div className="flex flex-col space-y-1">
          {/* Nombres de equipos */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium">{event.home_team} vs {event.away_team}</span>
              {isLiveEvent() && <span className="ml-2 text-sm font-bold">0-0</span>}
            </div>
          </div>
          
          {/* Botones de apuestas en formato horizontal */}
          <div className="flex justify-between items-center">
            {/* Equipo local */}
            {homeOdds && (
              <div className="flex items-center">
                <button
                  className={`min-w-[60px] py-1 px-2 rounded text-sm font-semibold text-center transition-colors ${
                    isSelectionInBetSlip(event.home_team, 'h2h')
                      ? 'bg-[#09b66d] text-white'
                      : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                  }`}
                  onClick={() => handleBetClick(event.home_team, homeOdds.price, 'h2h')}
                >
                  {(homeOdds.price).toFixed(2)}
                </button>
                {/* Signo + a la derecha del botón */}
                <div className="text-gray-400 text-sm ml-2 mr-2">+</div>
              </div>
            )}
            
            {/* Empate (solo para deportes que pueden terminar en empate) */}
            {drawOdds && (
              <div className="flex items-center">
                <button
                  className={`min-w-[60px] py-1 px-2 rounded text-sm font-semibold text-center transition-colors ${
                    isSelectionInBetSlip('Draw', 'h2h')
                      ? 'bg-[#09b66d] text-white'
                      : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                  }`}
                  onClick={() => handleBetClick('Draw', drawOdds.price, 'h2h')}
                >
                  {(drawOdds.price).toFixed(2)}
                </button>
                {/* Signo + a la derecha del botón */}
                <div className="text-gray-400 text-sm ml-2 mr-2">+</div>
              </div>
            )}
            
            {/* Equipo visitante */}
            {awayOdds && (
              <div className="flex items-center">
                <button
                  className={`min-w-[60px] py-1 px-2 rounded text-sm font-semibold text-center transition-colors ${
                    isSelectionInBetSlip(event.away_team, 'h2h')
                      ? 'bg-[#09b66d] text-white'
                      : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                  }`}
                  onClick={() => handleBetClick(event.away_team, awayOdds.price, 'h2h')}
                >
                  {(awayOdds.price).toFixed(2)}
                </button>
                {/* No hay signo + después del último botón */}
              </div>
            )}
          </div>
          
          {/* Etiquetas de los equipos */}
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{event.home_team}</span>
            {drawOdds && <span>Empate</span>}
            <span>{event.away_team}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}