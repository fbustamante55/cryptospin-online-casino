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
    <Card className={`bg-[#121c2e] border-[#1a2e4a] overflow-hidden ${className} hover:border-[#2a3e5a] transition-colors`}>
      {/* Encabezado con el título de la liga y deporte */}
      <div className="bg-gradient-to-r from-[#121c2e] to-[#1a2e4a] p-2 flex justify-between items-center border-b border-[#1a2e4a]">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-[#1e2e4a] flex items-center justify-center mr-2">
            {event.sport_key.includes('soccer') && <span className="text-xs">⚽</span>}
            {event.sport_key.includes('basketball') && <span className="text-xs">🏀</span>}
            {event.sport_key.includes('tennis') && <span className="text-xs">🎾</span>}
            {event.sport_key.includes('baseball') && <span className="text-xs">⚾</span>}
            {!event.sport_key.includes('soccer') && 
             !event.sport_key.includes('basketball') && 
             !event.sport_key.includes('tennis') && 
             !event.sport_key.includes('baseball') && <span className="text-xs">🏆</span>}
          </div>
          <span className="text-xs font-medium text-white">{sportTitle || event.sport_key}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          className="h-6 w-6 p-0 hover:bg-[#1e2e4a]"
          title="Añadir a favoritos"
        >
          <Star
            className={cn(
              "h-4 w-4",
              favoriteData?.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
            )}
          />
        </Button>
      </div>
      
      {/* Contenido principal - diseño mejorado */}
      <div className="p-3">
        {/* Barra de estado en vivo */}
        {isLiveEvent() && (
          <div className="flex items-center justify-between mb-3 bg-[#1a2736] p-1.5 rounded-md">
            <Badge className="bg-red-600 text-white text-xs py-0.5 px-2">
              EN VIVO
            </Badge>
            <span className="text-xs text-gray-300">
              <span className="text-xs font-bold text-white">45:00</span> Medio Tiempo
            </span>
          </div>
        )}
        
        {/* Equipos y cuotas - Diseño mejorado */}
        <div className="flex flex-col space-y-3">
          {/* Equipos con iconos y puntuación */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center w-5/12">
              <div className="w-8 h-8 bg-[#1e2e4a] rounded-full flex items-center justify-center mb-1">
                <span className="text-xs font-bold text-white">🏠</span>
              </div>
              <span className="text-xs font-medium text-center line-clamp-1">{event.home_team}</span>
              {isLiveEvent() && <span className="text-sm font-bold text-[#09b66d]">0</span>}
            </div>
            
            <div className="flex flex-col items-center w-2/12">
              <span className="text-xs text-gray-400 mb-1">VS</span>
              {isLiveEvent() && <span className="text-xs font-bold text-red-500">EN VIVO</span>}
            </div>
            
            <div className="flex flex-col items-center w-5/12">
              <div className="w-8 h-8 bg-[#1e2e4a] rounded-full flex items-center justify-center mb-1">
                <span className="text-xs font-bold text-white">✈️</span>
              </div>
              <span className="text-xs font-medium text-center line-clamp-1">{event.away_team}</span>
              {isLiveEvent() && <span className="text-sm font-bold text-[#09b66d]">0</span>}
            </div>
          </div>
          
          {/* Título de apuestas */}
          <div className="bg-[#0e1624] py-1 px-2 rounded-t-md border-b border-[#1a2e4a]">
            <span className="text-xs font-semibold text-white">ELIGE TU APUESTA (1X2)</span>
          </div>
          
          {/* Botones de apuestas en formato horizontal con etiquetas claras */}
          <div className="flex items-stretch space-x-2">
            {/* Equipo local (1) */}
            {homeOdds && (
              <button
                className={`flex-1 py-2 px-2 rounded-md flex flex-col items-center transition-colors ${
                  isSelectionInBetSlip(event.home_team, 'h2h')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                }`}
                onClick={() => handleBetClick(event.home_team, homeOdds.price, 'h2h')}
              >
                <span className="text-xs font-semibold mb-1">1</span>
                <span className="text-sm font-bold">{(homeOdds.price).toFixed(2)}</span>
                <span className="text-xs mt-1 line-clamp-1">Local</span>
              </button>
            )}
            
            {/* Empate (X) */}
            {drawOdds && (
              <button
                className={`flex-1 py-2 px-2 rounded-md flex flex-col items-center transition-colors ${
                  isSelectionInBetSlip('Draw', 'h2h')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                }`}
                onClick={() => handleBetClick('Draw', drawOdds.price, 'h2h')}
              >
                <span className="text-xs font-semibold mb-1">X</span>
                <span className="text-sm font-bold">{(drawOdds.price).toFixed(2)}</span>
                <span className="text-xs mt-1">Empate</span>
              </button>
            )}
            
            {/* Equipo visitante (2) */}
            {awayOdds && (
              <button
                className={`flex-1 py-2 px-2 rounded-md flex flex-col items-center transition-colors ${
                  isSelectionInBetSlip(event.away_team, 'h2h')
                    ? 'bg-[#09b66d] text-white'
                    : 'bg-[#1e2e4a] hover:bg-[#263b5b] text-white'
                }`}
                onClick={() => handleBetClick(event.away_team, awayOdds.price, 'h2h')}
              >
                <span className="text-xs font-semibold mb-1">2</span>
                <span className="text-sm font-bold">{(awayOdds.price).toFixed(2)}</span>
                <span className="text-xs mt-1 line-clamp-1">Visitante</span>
              </button>
            )}
          </div>
          
          {/* Información adicional */}
          <div className="flex justify-between items-center text-xs text-gray-400 pt-1 border-t border-[#1a2e4a]">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatEventDate(event.commence_time)}</span>
            </div>
            <div className="flex items-center">
              <span>Más mercados</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}