import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Calendar, ChevronRight, Package, Tv, 
  Timer, Zap, Trophy, TrendingUp, BarChart3, BarChart2, Heart, Star, 
  Shield, Monitor, Video, Flame, Clock, Activity, Award
} from 'lucide-react';
import { BetSlip, BetSelection } from '@/components/sports/bet-slip-simple';
import { EventCard } from '@/components/sports/event-card';
import { EventOdds, fetchOdds, fetchSports, formatAmericanOdds, getSportColor, formatEventDate } from '@/lib/sports-api';
import { useTranslation } from 'react-i18next';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { OddsWidget } from '@/components/sports/odds-widget';

export default function LiveEventsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  const [activeTab, setActiveTab] = useState('misBoletos');
  const [activeSport, setActiveSport] = useState<string>('all');

  // Obtener lista de deportes y comprobar el API key
  const { data: sportsData, isLoading: sportsLoading } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      try {
        // Intentar obtener los deportes de la API
        const sports = await fetchSports();
        return sports;
      } catch (err) {
        console.error('Error fetching sports:', err);
        // Fallback a deportes estáticos
        return [
          { key: 'soccer_spain_la_liga', group: 'Soccer', title: 'La Liga', description: 'Spanish Soccer', active: true, has_outrights: false },
          { key: 'basketball_nba', group: 'Basketball', title: 'NBA', description: 'US Basketball', active: true, has_outrights: false },
          { key: 'soccer_epl', group: 'Soccer', title: 'Premier League', description: 'English Soccer', active: true, has_outrights: false },
          { key: 'tennis_wta_aus_open', group: 'Tennis', title: 'WTA Aus Open', description: 'Women Tennis', active: true, has_outrights: false },
          { key: 'mma_ufc', group: 'MMA', title: 'UFC', description: 'Ultimate Fighting Championship', active: true, has_outrights: false },
          { key: 'baseball_mlb', group: 'Baseball', title: 'MLB', description: 'Major League Baseball', active: true, has_outrights: false },
          { key: 'cricket_test_match', group: 'Cricket', title: 'Test Matches', description: 'International Cricket', active: true, has_outrights: false },
          { key: 'baseball_kbo', group: 'Baseball', title: 'KBO', description: 'Korean Baseball Organization', active: true, has_outrights: false },
          { key: 'icehockey_nhl', group: 'Hockey', title: 'NHL', description: 'National Hockey League', active: true, has_outrights: false }
        ];
      }
    },
    staleTime: 600000, // 10 minutos
  });

  // Obtener eventos deportivos
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['/api/sports/events'],
    queryFn: async () => {
      try {
        // Intentar obtener eventos de la API
        const response = await apiRequest<{events: EventOdds[]}>({ 
          url: '/api/sports/events',
          method: 'GET'
        });
        return response.events;
      } catch (err) {
        console.error('Error fetching events:', err);
        throw err;
      }
    },
    staleTime: 60000, // 1 minuto
  });

  // Obtener favoritos del usuario
  const { data: favoriteEvents, isLoading: favoritesLoading } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const response = await apiRequest<any[]>({ 
        url: '/api/favorites',
        method: 'GET'
      });
      return response;
    },
  });

  // Obtener apuestas del usuario
  const { data: userBets = [] } = useQuery({
    queryKey: ['/api/sports/user-bets'],
    queryFn: async () => {
      try {
        const response = await apiRequest<any[]>({ 
          url: '/api/sports/user-bets',
          method: 'GET'
        });
        return response;
      } catch (error) {
        console.error('Error fetching user bets:', error);
        return [];
      }
    },
  });

  // Obtener historial de apuestas
  const { data: betHistory = [] } = useQuery({
    queryKey: ['/api/sports/bet-history'],
    queryFn: async () => {
      try {
        const response = await apiRequest<any[]>({ 
          url: '/api/sports/bet-history',
          method: 'GET'
        });
        return response;
      } catch (error) {
        console.error('Error fetching bet history:', error);
        return [];
      }
    },
  });

  // Definir los eventos a mostrar (todos o filtrados)
  const displayEvents = Array.isArray(eventsData) ? eventsData : [];

  // Función para determinar si un evento está en vivo
  const isEventLive = (event: EventOdds): boolean => {
    // En una app real, esto verificaría una bandera 'live' de la API
    // Para demo, simularemos que algunos eventos están en vivo (si están programados para hoy)
    const eventDate = new Date(event.commence_time);
    const now = new Date();
    return eventDate.getDate() === now.getDate() && 
           eventDate.getMonth() === now.getMonth() && 
           eventDate.getFullYear() === now.getFullYear() &&
           eventDate.getTime() <= now.getTime();
  };

  // Función para determinar si un evento es de mañana
  const isEventTomorrow = (event: EventOdds): boolean => {
    const eventDate = new Date(event.commence_time);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return eventDate.getDate() === tomorrow.getDate() &&
           eventDate.getMonth() === tomorrow.getMonth() &&
           eventDate.getFullYear() === tomorrow.getFullYear();
  };

  // Contar eventos en vivo para cada deporte
  const sportsWithLiveEvents = sportsData?.map(sport => {
    const liveEventsCount = displayEvents.filter(event => 
      event.sport_key === sport.key && isEventLive(event)
    ).length;
    
    return {
      ...sport,
      liveEventsCount
    };
  }).filter(sport => sport.liveEventsCount > 0) || [];

  // Filter events based on live events and selected sport
  const filteredByStatus = displayEvents.filter(event => {
    // Solo mostrar eventos en vivo
    const passesStatusFilter = isEventLive(event);
    
    // Luego filtrar por deporte seleccionado, si hay uno
    const passesSportFilter = 
      !activeSport || 
      activeSport === 'all' || 
      (activeSport && event.sport_key === activeSport);
    
    return passesStatusFilter && passesSportFilter;
  }) || [];
  
  // Limitar a 10 eventos para rendimiento
  const filteredEvents = filteredByStatus.slice(0, 10) || [];
  
  // Handler para agregar una selección de apuesta
  const handleAddSelection = (selection: BetSelection) => {
    // Comprobar si la selección ya existe
    const existingSelectionIndex = betSelections.findIndex(
      bet => bet.eventId === selection.eventId && 
             bet.selectedTeam === selection.selectedTeam && 
             bet.marketType === selection.marketType
    );
    
    if (existingSelectionIndex !== -1) {
      // Eliminarla si ya existe (comportamiento de toggle)
      const newSelections = [...betSelections];
      newSelections.splice(existingSelectionIndex, 1);
      setBetSelections(newSelections);
    } else {
      // Agregar nueva selección
      setBetSelections([...betSelections, selection]);
    }
  };
  
  // Handler para eliminar una selección
  const handleRemoveSelection = (id: string) => {
    setBetSelections(betSelections.filter(selection => selection.id !== id));
  };
  
  // Handler para limpiar todas las selecciones
  const handleClearSelections = () => {
    setBetSelections([]);
  };
  
  // Formatear el estado de una apuesta para mostrar
  const formatOddStatus = (status: string) => {
    switch (status) {
      case 'won':
        return 'Ganada';
      case 'lost':
        return 'Perdida';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  // Banners promocionales
  interface PromoData {
    id: number;
    title: string;
    subtitle: string;
    action: string;
    image: string;
    gradient: string;
    icon: React.ReactNode;
    buttonColor: string;
  }
  
  const promotions: PromoData[] = [
    {
      id: 1,
      title: "Potencia tus Apuestas",
      subtitle: "Cuota mejorada x2 en la primera apuesta del día",
      action: "Ver Promoción",
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=60",
      gradient: "from-[#09b66d]/90 to-[#09b66d]/10",
      icon: <Zap className="h-5 w-5" />,
      buttonColor: "bg-[#09b66d] hover:bg-[#08a962]"
    },
    {
      id: 2,
      title: "Apuesta Sin Riesgo",
      subtitle: "Devolución en créditos si pierdes tu primera apuesta live",
      action: "Activar Bono",
      image: "https://images.unsplash.com/photo-1529720317453-c8da503f2051?auto=format&fit=crop&w=500&q=60",
      gradient: "from-[#e64d6b]/90 to-[#e64d6b]/10",
      icon: <Shield className="h-5 w-5" />,
      buttonColor: "bg-[#e64d6b] hover:bg-[#d54562]"
    },
    {
      id: 3,
      title: "Copa América 2025",
      subtitle: "Apuestas anticipadas con mejor cuota garantizada",
      action: "Apostar Ahora",
      image: "https://images.unsplash.com/photo-1579952929770-3a4981d9a3e7?auto=format&fit=crop&w=500&q=60",
      gradient: "from-[#114f7a]/90 to-[#114f7a]/10",
      icon: <Trophy className="h-5 w-5" />,
      buttonColor: "bg-[#114f7a] hover:bg-[#0f4469]"
    }
  ];

  // Imagen de fondo para cada deporte
  const getSportBackgroundImage = (sportKey: string): string => {
    if (sportKey.includes('soccer')) {
      return 'https://images.unsplash.com/photo-1508098682722-e99c643e7f66?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('basketball')) {
      return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('baseball')) {
      return 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('tennis')) {
      return 'https://images.unsplash.com/photo-1531315396756-905d68d21b56?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('hockey')) {
      return 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('mma') || sportKey.includes('ufc')) {
      return 'https://images.unsplash.com/photo-1555597673-b21d5c3f65af?auto=format&fit=crop&w=1200&q=60';
    } else if (sportKey.includes('cricket')) {
      return 'https://images.unsplash.com/photo-1593766788229-8bb31ade4c65?auto=format&fit=crop&w=1200&q=60';
    } else {
      return 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=60';
    }
  };

  // Función para obtener estadísticas aleatorias para un evento
  const getRandomStats = (sportKey: string) => {
    if (sportKey.includes('soccer')) {
      return {
        possessionHome: Math.floor(Math.random() * 30) + 40,
        possessionAway: Math.floor(Math.random() * 30) + 30,
        shotsHome: Math.floor(Math.random() * 15) + 5,
        shotsAway: Math.floor(Math.random() * 15) + 5,
        cornersHome: Math.floor(Math.random() * 8) + 2,
        cornersAway: Math.floor(Math.random() * 8) + 2,
        yellowCardsHome: Math.floor(Math.random() * 3),
        yellowCardsAway: Math.floor(Math.random() * 3),
        dangerousAttacksHome: Math.floor(Math.random() * 15) + 8,
        dangerousAttacksAway: Math.floor(Math.random() * 15) + 8,
      };
    } else if (sportKey.includes('basketball')) {
      return {
        pointsHome: Math.floor(Math.random() * 40) + 50,
        pointsAway: Math.floor(Math.random() * 40) + 50,
        reboundsHome: Math.floor(Math.random() * 20) + 15,
        reboundsAway: Math.floor(Math.random() * 20) + 15,
        assistsHome: Math.floor(Math.random() * 15) + 10,
        assistsAway: Math.floor(Math.random() * 15) + 10,
      };
    } else if (sportKey.includes('baseball')) {
      return {
        inning: Math.floor(Math.random() * 9) + 1,
        hitsHome: Math.floor(Math.random() * 10) + 3,
        hitsAway: Math.floor(Math.random() * 10) + 3,
        errorsHome: Math.floor(Math.random() * 3),
        errorsAway: Math.floor(Math.random() * 3),
      };
    } else if (sportKey.includes('tennis')) {
      const setsHome = Math.floor(Math.random() * 2);
      const setsAway = Math.floor(Math.random() * 2);
      return {
        currentSet: Math.min(setsHome + setsAway + 1, 3),
        setsHome,
        setsAway,
        gamesHome: Math.floor(Math.random() * 6) + 1,
        gamesAway: Math.floor(Math.random() * 6) + 1,
        acesHome: Math.floor(Math.random() * 10) + 1,
        acesAway: Math.floor(Math.random() * 10) + 1,
      };
    } else {
      return {
        scoreHome: Math.floor(Math.random() * 5),
        scoreAway: Math.floor(Math.random() * 5),
        timeElapsed: `${Math.floor(Math.random() * 90)}:00`,
      };
    }
  };

  // Verificar si hay eventos para mostrar la sección de destacados
  const hasLiveEvents = filteredEvents.length > 0;
  const featuredEvent = hasLiveEvents ? filteredEvents[0] : null;
  const featuredSportKey = featuredEvent?.sport_key || '';
  const featuredStats = featuredEvent ? getRandomStats(featuredSportKey) : null;

  return (
    <>
      <main className="relative container mx-auto px-4 py-6">
        {/* Hero Banner con Evento Destacado */}
        {featuredEvent && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-[#1c2b3a]">
            <div className="absolute inset-0 z-0">
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${getSportBackgroundImage(featuredSportKey)})`,
                  filter: 'brightness(0.3) saturate(1.2)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e1824] via-transparent to-transparent opacity-90" />
            </div>
            
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                <div>
                  <Badge variant="outline" className="text-[#09b66d] border-[#09b66d] mb-2 font-semibold">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    EN VIVO
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {featuredEvent.home_team} vs {featuredEvent.away_team}
                  </h2>
                  <div className="flex items-center mt-2 text-gray-300">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatEventDate(featuredEvent.commence_time)}</span>
                    <Badge className="ml-2 bg-[#192531] text-gray-300">
                      {sportsData?.find(s => s.key === featuredEvent.sport_key)?.title || featuredEvent.sport_key}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button 
                    className="bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium"
                    onClick={() => {
                      // Crear una selección para equipo local
                      const homeSelection: BetSelection = {
                        id: `${featuredEvent.id}-home`,
                        eventId: featuredEvent.id,
                        sportKey: featuredEvent.sport_key,
                        sportTitle: sportsData?.find(s => s.key === featuredEvent.sport_key)?.title || featuredEvent.sport_key,
                        homeTeam: featuredEvent.home_team,
                        awayTeam: featuredEvent.away_team,
                        selectedTeam: featuredEvent.home_team,
                        odds: featuredEvent.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === featuredEvent.home_team)?.price || 1.5,
                        marketType: 'moneyline'
                      };
                      
                      handleAddSelection(homeSelection);
                    }}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Apostar Ahora
                  </Button>
                </div>
              </div>
              
              {/* Estadísticas de juego basado en el tipo de deporte */}
              {featuredStats && (
                <div className="bg-[#192531]/80 rounded-xl p-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Estadísticas del Partido</h3>
                  
                  {featuredSportKey.includes('soccer') && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-400">Posesión</span>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 my-2">
                          <div className="bg-[#09b66d] h-2.5 rounded-full" style={{ width: `${featuredStats.possessionHome}%` }}></div>
                        </div>
                        <div className="flex justify-between w-full">
                          <span className="text-xs font-medium text-white">{featuredStats.possessionHome}%</span>
                          <span className="text-xs font-medium text-white">{featuredStats.possessionAway}%</span>
                        </div>
                        <div className="flex justify-between w-full mt-4 bg-[#0e1824] p-2 rounded-lg">
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1 text-[#09b66d]" />
                            <span className="text-xs font-medium text-white">{featuredStats.dangerousAttacksHome}</span>
                          </div>
                          <span className="text-xs text-gray-400">Ataques Peligrosos</span>
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-white">{featuredStats.dangerousAttacksAway}</span>
                            <BarChart3 className="h-4 w-4 ml-1 text-[#09b66d]" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-around">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.shotsHome}</span>
                          <span className="text-xs text-gray-400">Tiros</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.cornersHome}</span>
                          <span className="text-xs text-gray-400">Corners</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.yellowCardsHome}</span>
                          <span className="text-xs text-gray-400">T. Amarillas</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-around">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.shotsAway}</span>
                          <span className="text-xs text-gray-400">Tiros</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.cornersAway}</span>
                          <span className="text-xs text-gray-400">Corners</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.yellowCardsAway}</span>
                          <span className="text-xs text-gray-400">T. Amarillas</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {featuredSportKey.includes('basketball') && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">{featuredStats.pointsHome}</span>
                          <span className="text-xl font-medium text-gray-400">-</span>
                          <span className="text-3xl font-bold text-white">{featuredStats.pointsAway}</span>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">Puntuación</span>
                      </div>
                      
                      <div className="flex justify-around">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.reboundsHome}</span>
                          <span className="text-xs text-gray-400">Rebotes</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.assistsHome}</span>
                          <span className="text-xs text-gray-400">Asistencias</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-around">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.reboundsAway}</span>
                          <span className="text-xs text-gray-400">Rebotes</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-white">{featuredStats.assistsAway}</span>
                          <span className="text-xs text-gray-400">Asistencias</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {featuredSportKey.includes('tennis') && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">Set Actual</span>
                        <div className="text-2xl font-bold text-white">{featuredStats.currentSet}</div>
                        <div className="flex justify-center gap-2 mt-1">
                          <div className="text-white bg-[#0e1824] px-2 py-1 rounded text-sm">{featuredStats.setsHome}</div>
                          <div className="text-white bg-[#0e1824] px-2 py-1 rounded text-sm">{featuredStats.setsAway}</div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">Sets</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">Games</span>
                        <div className="flex justify-center gap-2 mt-1">
                          <div className="text-2xl font-bold text-white">{featuredStats.gamesHome}</div>
                          <div className="text-gray-400 text-2xl">-</div>
                          <div className="text-2xl font-bold text-white">{featuredStats.gamesAway}</div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">Aces</span>
                        <div className="flex justify-center gap-8 mt-1">
                          <div className="text-xl font-bold text-white">{featuredStats.acesHome}</div>
                          <div className="text-xl font-bold text-white">{featuredStats.acesAway}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Opciones de apuesta para el evento destacado */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredEvent.bookmakers && featuredEvent.bookmakers[0]?.markets[0]?.outcomes.map((outcome, index) => (
                  <div 
                    key={`${outcome.name}-${index}`}
                    className="bg-[#192531]/80 hover:bg-[#192531] cursor-pointer transition-colors rounded-xl p-3 flex items-center justify-between"
                    onClick={() => {
                      const selection: BetSelection = {
                        id: `${featuredEvent.id}-${outcome.name}`,
                        eventId: featuredEvent.id,
                        sportKey: featuredEvent.sport_key,
                        sportTitle: sportsData?.find(s => s.key === featuredEvent.sport_key)?.title || featuredEvent.sport_key,
                        homeTeam: featuredEvent.home_team,
                        awayTeam: featuredEvent.away_team,
                        selectedTeam: outcome.name,
                        odds: outcome.price,
                        marketType: 'moneyline'
                      };
                      
                      handleAddSelection(selection);
                    }}
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{outcome.name}</span>
                      <p className="text-xs text-gray-400">
                        {outcome.name === featuredEvent.home_team ? 'Local' : 
                         outcome.name === featuredEvent.away_team ? 'Visitante' : 'Empate'}
                      </p>
                    </div>
                    <div className="text-lg font-bold text-[#09b66d]">
                      {formatAmericanOdds(outcome.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-[#09b66d]" />
            {t('sports.liveEvents')}
          </h1>
          <p className="text-gray-400">Todos los eventos en vivo disponibles para apostar en tiempo real</p>
        </div>
        
        {/* Contenido principal */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Columna principal */}
          <div className="flex-1">
            {/* Carrusel de promociones */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promotions.map((promo) => (
                  <div 
                    key={promo.id}
                    className="rounded-xl overflow-hidden h-44 relative flex flex-col justify-between bg-gradient-to-br from-[#0e1824] to-[#1c2b3a] border border-[#1c2b3a] hover:border-gray-600 transition-all cursor-pointer group"
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <div 
                        className="w-full h-full bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-500"
                        style={{ backgroundImage: `url(${promo.image})` }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${promo.gradient}`} />
                    </div>
                    
                    <div className="relative z-10 p-4 flex flex-col h-full justify-between">
                      <div>
                        <div className="inline-block rounded-lg bg-white/10 backdrop-blur-sm p-2 mb-2">
                          {promo.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>
                        <p className="text-sm text-white/80 max-w-[90%]">{promo.subtitle}</p>
                      </div>
                      <button className={`text-sm px-4 py-2 rounded-md font-medium text-white ${promo.buttonColor} mt-3 shadow-lg w-fit`}>
                        {promo.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Widget de Cuotas */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-[#09b66d]" />
                  Cuotas en Vivo
                </h3>
                <Button variant="outline" size="sm" className="text-xs bg-[#192531] border-[#1c2b3a] hover:bg-[#1e2d3d]">
                  Ver Todas las Cuotas
                </Button>
              </div>
              <div className="bg-[#0e1824] border border-[#1c2b3a] rounded-md p-4">
                <p className="text-sm text-gray-400 mb-4">
                  Consulta las cuotas más actualizadas para los principales eventos deportivos. Actualización en tiempo real.
                </p>
                <OddsWidget 
                  sportKey="soccer_epl" 
                  bookmakerKeys="draftkings" 
                  oddsFormat="decimal" 
                  markets="h2h,spreads,totals" 
                  marketNames="h2h:Ganador,spreads:Handicap,totals:Total" 
                  height="450px"
                  className="mt-2"
                />
              </div>
            </div>
            
            {/* Sports Categories Scrollable Bar */}
            <div className="mb-8 bg-[#0e1824] border border-[#1c2b3a] rounded-md overflow-x-hidden">
              <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center p-1 gap-1 min-w-max">
                  <div 
                    className={`flex flex-col items-center py-2 px-3 cursor-pointer min-w-[65px] ${activeSport === 'all' ? 'text-[#09b66d]' : 'text-gray-400'}`}
                    onClick={() => setActiveSport('all')}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-md bg-[#192531] mb-1 ${activeSport === 'all' ? 'border-b-2 border-[#09b66d]' : ''}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Todo</span>
                    <span className="text-xs font-bold text-white">
                      {filteredByStatus.length || 0}
                    </span>
                  </div>
                  
                  {/* Mostrar solo deportes con eventos en vivo */}
                  {sportsWithLiveEvents?.map((sport) => {
                    const isActive = activeSport === sport.key;
                    const color = getSportColor(sport.group);
                    
                    // Contar eventos en vivo para este deporte
                    const eventsCount = displayEvents.filter(event => 
                      event.sport_key === sport.key && isEventLive(event)
                    ).length || 0;
                    
                    // No mostrar deportes sin eventos en vivo
                    if (eventsCount === 0) {
                      return null;
                    }
                    
                    return (
                      <div 
                        key={sport.key}
                        className={`flex flex-col items-center py-2 px-3 cursor-pointer min-w-[65px] ${isActive ? 'text-[#09b66d]' : 'text-gray-400'}`}
                        onClick={() => {
                          if (activeSport === sport.key) {
                            setActiveSport('all');
                          } else {
                            setActiveSport(sport.key);
                          }
                        }}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-md bg-[#192531] mb-1 ${isActive ? 'border-b-2 border-[#09b66d]' : ''}`}>
                          {sport.key === 'cricket_test_match' || sport.key === 'cricket_odi' || sport.key.includes('cricket') ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M6 3v18M18 9l-8 8M18 15v4h-4M13 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" stroke="#09b66d"/>
                              <path d="M7 21h10" stroke="#fff"/>
                            </svg>
                          ) : sport.key === 'baseball_mlb' || sport.key.includes('baseball') ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="8" stroke="#fff" fill="none"/>
                              <path d="M5.5 5.5l2 2M18.5 5.5l-2 2M5.5 18.5l2-2M18.5 18.5l-2-2" stroke="#fff"/>
                              <path d="M12 20.5V16M12 8V3.5" stroke="#09b66d"/>
                              <path d="M3.5 12H8M16 12h4.5" stroke="#09b66d"/>
                              <path d="M10 10l4 4M10 14l4-4" stroke="#fff"/>
                            </svg>
                          ) : sport.key === 'baseball_kbo' || sport.key.includes('kbo') ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              {/* Logo KBO con bate, pelota y letras */}
                              <path d="M5 17A9 9 0 0 1 14 8 9 9 0 0 1 5 17Z" stroke="#09b66d" fill="none"/>
                              <path d="M18 6L13 11" stroke="#09b66d" strokeWidth="2"/>
                              <path d="M9 9c0 1 .8 2 2 2M9 13c0 1 .8 2 2 2" stroke="#fff"/>
                              <path d="M18 4L20 6M20 4L18 6" stroke="#fff"/>
                              <path d="M5 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="#09b66d"/>
                            </svg>
                          ) : sport.key === 'icehockey_nhl' || sport.key.includes('hockey') ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              {/* Logo de hockey con palo y disco */}
                              <path d="M12 7v10" stroke="#fff" strokeWidth="2"/>
                              <path d="M17 16l-10 3" stroke="#09b66d" strokeWidth="2"/>
                              <path d="M7 16l10 3" stroke="#09b66d" strokeWidth="2"/>
                              <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#fff" fill="#192531"/>
                              <path d="M12 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="#09b66d" fill="#09b66d"/>
                            </svg>
                          ) : sport.key === 'lacrosse' || sport.key.includes('lacrosse') ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              {/* Logo de lacrosse con palo y pelota */}
                              <path d="M6 12c5-8 12-3 12 2 0 3-4 4-6 2" stroke="#09b66d" strokeWidth="1.5"/>
                              <path d="M6 12c0 0 2 6 10 6" stroke="#09b66d" strokeWidth="1.5"/>
                              <path d="M18 14c0 0-4-1-6-4" stroke="#fff" strokeWidth="1.5"/>
                              <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#09b66d"/>
                              <path d="M6 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('soccer') || sport.group === 'Soccer' ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="8" stroke="#fff" fill="none"/>
                              <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#fff"/>
                              <path d="M8 8l2 2M16 8l-2 2M8 16l2-2M16 16l-2-2" stroke="#09b66d"/>
                              <path d="M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="#09b66d"/>
                            </svg>
                          ) : sport.key.includes('basketball') || sport.group === 'Basketball' ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="8" stroke="#fff" fill="none"/>
                              <path d="M4.5 4.5a10 10 0 0 1 15 15M4.5 19.5a10 10 0 0 1 15-15" stroke="#09b66d"/>
                              <path d="M12 4v16M4 12h16" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('tennis') || sport.group === 'Tennis' ? (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="7" stroke="#fff" fill="none"/>
                              <path d="M6 6c1.5 1.5 3 5 3 10" stroke="#09b66d"/>
                              <path d="M18 6c-1.5 1.5-3 5-3 10" stroke="#09b66d"/>
                              <path d="M6 18c1.5-1.5 5-3 10-3" stroke="#fff"/>
                              <path d="M6 6c1.5 1.5 5 3 10 3" stroke="#fff"/>
                            </svg>
                          ) : (
                            <svg 
                              className="w-5 h-5" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="1.5"
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="8" stroke="#09b66d" fill="none"/>
                              <path d="M12 8v8M8 12h8" stroke="#fff"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-semibold">{sport.title}</span>
                        <span className="text-xs font-bold text-white">{eventsCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Live Events Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-[#09b66d]" />
                  {activeSport && activeSport !== 'all' ? 
                    sportsData?.find(s => s.key === activeSport)?.title || activeSport :
                    "Estadísticas de Eventos en Vivo"}
                </h2>
                <Link href="/sports">
                  <span className="text-[#09b66d] text-sm font-medium flex items-center hover:underline">
                    {t('buttons.viewAll')} <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
              
              {/* Loading state */}
              {eventsLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-[#192531] border-[#1c2b3a] p-4 animate-pulse h-28">
                      <div className="h-full flex flex-col justify-center items-center">
                        <div className="w-8 h-8 rounded-full bg-[#1c2b3a] mb-2"></div>
                        <div className="h-4 w-36 bg-[#1c2b3a] rounded"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Error state */}
              {eventsError && (
                <Card className="bg-[#192531] border-[#1c2b3a] p-4">
                  <div className="flex items-center justify-center space-x-2 text-[#e64d6b]">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Error cargando eventos. Por favor, inténtelo más tarde.</span>
                  </div>
                </Card>
              )}
              
              {/* Events display */}
              {!eventsLoading && !eventsError && (
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <Card className="bg-[#192531] border-[#1c2b3a] p-8">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative mb-4">
                          <Tv className="h-16 w-16 text-gray-700" />
                          <div className="absolute -top-1 -right-1 rounded-full bg-[#192531] border border-gray-700 p-1">
                            <AlertTriangle className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No hay eventos en vivo en este momento</h3>
                        <p className="text-base text-gray-400 text-center max-w-md">
                          Intenta seleccionar un deporte diferente o vuelve más tarde
                          para ver los próximos eventos en vivo
                        </p>
                        
                        <Button
                          variant="outline"
                          className="mt-6 border-[#09b66d] text-[#09b66d] hover:bg-[#09b66d] hover:text-white"
                          onClick={() => {
                            // Navegar a deportes para ver todos los eventos
                            setLocation('/sports');
                          }}
                        >
                          Ver todos los eventos deportivos
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredEvents.slice(1).map((event) => {
                          const sportTitle = sportsData?.find(s => s.key === event.sport_key)?.title || event.sport_key;
                          const sportStats = getRandomStats(event.sport_key);
                          
                          return (
                            <Card 
                              key={event.id}
                              className="bg-[#192531] border-[#1c2b3a] overflow-hidden transition-all hover:border-[#09b66d]/50"
                            >
                              <div className="relative">
                                <div className="h-20 overflow-hidden">
                                  <div 
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ 
                                      backgroundImage: `url(${getSportBackgroundImage(event.sport_key)})`,
                                      filter: 'brightness(0.6)'
                                    }}
                                  />
                                </div>
                                
                                <div className="absolute top-2 left-3">
                                  <Badge className="bg-[#e64d6b] text-white">
                                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                                    LIVE
                                  </Badge>
                                </div>
                                
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#192531] to-transparent h-10" />
                              </div>
                              
                              <div className="p-4">
                                <div className="flex items-center mb-2">
                                  <Badge variant="outline" className="text-gray-300 border-gray-600 mr-2">
                                    {sportTitle}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    {formatEventDate(event.commence_time)}
                                  </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-3">
                                  {event.home_team} vs {event.away_team}
                                </h3>
                                
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                  {event.bookmakers && event.bookmakers[0]?.markets[0]?.outcomes.map((outcome, index) => (
                                    <div 
                                      key={`${outcome.name}-${index}`}
                                      className="bg-[#0e1824] hover:bg-[#09b66d]/10 cursor-pointer transition-colors rounded-lg p-2 flex flex-col items-center justify-center border border-[#1c2b3a] hover:border-[#09b66d]"
                                      onClick={() => {
                                        const selection: BetSelection = {
                                          id: `${event.id}-${outcome.name}`,
                                          eventId: event.id,
                                          sportKey: event.sport_key,
                                          sportTitle: sportTitle,
                                          homeTeam: event.home_team,
                                          awayTeam: event.away_team,
                                          selectedTeam: outcome.name,
                                          odds: outcome.price,
                                          marketType: 'moneyline'
                                        };
                                        
                                        handleAddSelection(selection);
                                      }}
                                    >
                                      <span className="text-xs font-medium text-gray-400 mb-1">
                                        {outcome.name === event.home_team ? 'Local' : 
                                         outcome.name === event.away_team ? 'Visitante' : 'Empate'}
                                      </span>
                                      <span className="text-base font-bold text-[#09b66d]">
                                        {formatAmericanOdds(outcome.price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                <Button 
                                  className="w-full bg-[#0e1824] hover:bg-[#192531] border border-[#1c2b3a] text-white"
                                  variant="outline"
                                  onClick={() => {
                                    // Destacar este evento (solo visual para demo)
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  <Monitor className="w-4 h-4 mr-1.5" />
                                  Ver detalles del partido
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                      
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filteredEvents.slice(0, 3).map((event, idx) => {
                          const sportTitle = sportsData?.find(s => s.key === event.sport_key)?.title || event.sport_key;
                          if (idx === 0) return null; // Ya mostramos el primero como destacado
                          
                          // Crear un estilo diferente para los eventos "recomendados"
                          return (
                            <Card 
                              key={`compact-${event.id}`}
                              className="bg-[#192531] border-[#1c2b3a] p-4 hover:border-[#09b66d]/50 transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <Badge className="bg-[#09b66d]/20 text-[#09b66d] border border-[#09b66d]/30">
                                  DESTACADO
                                </Badge>
                                <Star className="h-4 w-4 text-[#09b66d]" />
                              </div>
                              
                              <h3 className="text-lg font-bold text-white my-2">
                                {event.home_team} vs {event.away_team}
                              </h3>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline" className="text-xs text-gray-300 border-gray-700">
                                  {sportTitle}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {formatEventDate(event.commence_time)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                {event.bookmakers && event.bookmakers[0]?.markets[0]?.outcomes.map((outcome, index) => (
                                  <div 
                                    key={`mini-${outcome.name}-${index}`}
                                    className="bg-[#0e1824] hover:bg-[#09b66d]/10 cursor-pointer transition-colors rounded-lg p-2 flex items-center justify-between border border-[#1c2b3a] hover:border-[#09b66d]"
                                    onClick={() => {
                                      const selection: BetSelection = {
                                        id: `${event.id}-${outcome.name}`,
                                        eventId: event.id,
                                        sportKey: event.sport_key,
                                        sportTitle: sportTitle,
                                        homeTeam: event.home_team,
                                        awayTeam: event.away_team,
                                        selectedTeam: outcome.name,
                                        odds: outcome.price,
                                        marketType: 'moneyline'
                                      };
                                      
                                      handleAddSelection(selection);
                                    }}
                                  >
                                    <span className="text-xs font-medium text-gray-400">
                                      {outcome.name === event.home_team ? '1' : 
                                       outcome.name === event.away_team ? '2' : 'X'}
                                    </span>
                                    <span className="text-sm font-bold text-[#09b66d]">
                                      {formatAmericanOdds(outcome.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                      
                      {/* EventCards de respaldo para más partidos */}
                      {filteredEvents.length > 3 && (
                        <div className="space-y-4 mt-8">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-white flex items-center">
                              <BarChart3 className="h-4 w-4 mr-2 text-[#09b66d]" />
                              Más Estadísticas en Vivo
                            </h3>
                          </div>
                          
                          {filteredEvents.slice(3).map((event) => {
                            const sportTitle = sportsData?.find(s => s.key === event.sport_key)?.title || event.sport_key;
                            return (
                              <EventCard
                                key={event.id}
                                event={event}
                                onAddSelection={handleAddSelection}
                                selectedBets={betSelections}
                                sportTitle={sportTitle}
                              />
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Tablón de Apuestas - Panel lateral */}
          <div className="w-full md:w-80 lg:w-96 mt-4 md:mt-0">
            <div className="bg-[#0e1824] border border-[#1c2b3a] rounded-lg overflow-hidden">
              {/* Título del tablón de apuestas */}
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-bold">Tablón de Apuestas</h2>
                <p className="text-xs text-gray-400">
                  Seleccione sus apuestas y calcule las ganancias potenciales
                </p>
              </div>
              
              {/* Pestañas del Tablón - Estilo moderno con línea debajo */}
              <div className="flex px-4 mt-2 relative">
                <button 
                  className={`py-2 mr-4 text-sm font-medium relative ${
                    activeTab === 'misBoletos' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('misBoletos')}
                >
                  Mis Boletos
                  {activeTab === 'misBoletos' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#09b66d]"></div>
                  )}
                </button>
                <button 
                  className={`py-2 mr-4 text-sm font-medium relative ${
                    activeTab === 'misApuestas' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('misApuestas')}
                >
                  Mis Apuestas
                  {activeTab === 'misApuestas' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#09b66d]"></div>
                  )}
                </button>
                <button 
                  className={`py-2 text-sm font-medium relative ${
                    activeTab === 'historial' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('historial')}
                >
                  Historial
                  {activeTab === 'historial' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#09b66d]"></div>
                  )}
                </button>
                <div className="absolute bottom-0 left-0 w-full h-px bg-[#1c2b3a]"></div>
              </div>
              
              {/* Contenido según la pestaña seleccionada */}
              <div className="p-1">
                {activeTab === 'misBoletos' && (
                  <BetSlip 
                    selections={betSelections}
                    onRemoveSelection={handleRemoveSelection}
                    onClearSelections={handleClearSelections}
                  />
                )}
                
                {activeTab === 'misApuestas' && (
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-2">Apuestas pendientes</h3>
                    {userBets.length > 0 ? (
                      <div className="space-y-3">
                        {userBets.filter(bet => bet.status === 'pending').map((bet) => (
                          <div key={bet.id} className="bg-[#182531] p-3 rounded-md">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs">{bet.sportTitle}</span>
                              <Badge variant="outline" className="text-xs">{formatOddStatus(bet.status)}</Badge>
                            </div>
                            <p className="text-sm mb-1">{bet.homeTeam} vs {bet.awayTeam}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-[#09b66d]">
                                  {bet.selectedTeam} 
                                  {bet.point ? ` (${bet.point > 0 ? '+' : ''}${bet.point})` : ''}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Apostado: ${bet.betAmount}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{formatAmericanOdds(bet.odds)}</p>
                                <p className="text-xs text-[#09b66d]">
                                  Posible ganancia: ${bet.potentialWin}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-sm text-gray-400">No tienes apuestas pendientes</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'historial' && (
                  <div className="p-3">
                    <h3 className="text-sm font-medium mb-2">Historial de apuestas</h3>
                    {betHistory.length > 0 ? (
                      <div className="space-y-3">
                        {betHistory.map((bet) => (
                          <div key={bet.id} className="bg-[#182531] p-3 rounded-md">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs">{bet.sportTitle}</span>
                              <Badge 
                                className={`text-xs ${
                                  bet.status === 'won' 
                                    ? 'bg-[#09b66d]' 
                                    : bet.status === 'lost' 
                                      ? 'bg-red-500' 
                                      : 'bg-blue-500'
                                }`}
                              >
                                {formatOddStatus(bet.status)}
                              </Badge>
                            </div>
                            <p className="text-sm mb-1">{bet.homeTeam} vs {bet.awayTeam}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-[#09b66d]">
                                  {bet.selectedTeam}
                                  {bet.point ? ` (${bet.point > 0 ? '+' : ''}${bet.point})` : ''}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Apostado: ${bet.betAmount}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{formatAmericanOdds(bet.odds)}</p>
                                {bet.status === 'won' && (
                                  <p className="text-xs text-[#09b66d]">
                                    Ganancia: ${bet.settledAmount}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-sm text-gray-400">No tienes historial de apuestas</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}