import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, ChevronRight, Package, Tv } from 'lucide-react';
import { BetSlip, BetSelection } from '@/components/sports/bet-slip-simple';
import { EventCard } from '@/components/sports/event-card';
import { EventOdds, fetchOdds, fetchSports, formatAmericanOdds, getSportColor } from '@/lib/sports-api';
import { useTranslation } from 'react-i18next';

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
  const promotions = [
    {
      id: 1,
      title: t('sports.boostOdds'),
      subtitle: t('sports.getBoost'),
      action: t('buttons.seeAll'),
      image: "",
      backgroundColor: "#1a2639",
      buttonColor: "bg-[#1a2639]"
    },
    {
      id: 2,
      title: t('sports.pay3rdQuarter'),
      subtitle: t('sports.badStartsInsurance'),
      action: t('buttons.viewMatches'),
      image: "",
      backgroundColor: "#333966",
      buttonColor: "bg-[#333966]"
    },
    {
      id: 3,
      title: t('sports.premierLeague'),
      subtitle: t('sports.pay3Goals'),
      action: t('buttons.betNow'),
      image: "",
      backgroundColor: "#114f7a",
      buttonColor: "bg-[#114f7a]"
    }
  ];

  return (
    <>
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t('sports.liveEvents')}</h1>
          <p className="text-gray-400">{t('sports.liveEventsDescription')}</p>
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
                    className="rounded-lg p-4 h-40 flex flex-col justify-between bg-gradient-to-br from-[#0e1824] to-[#0e1824]"
                    style={{ backgroundColor: promo.backgroundColor }}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>
                      <p className="text-sm text-gray-300 mb-4">{promo.subtitle}</p>
                    </div>
                    <button className={`text-sm px-4 py-2 rounded-md text-white ${promo.buttonColor}`}>
                      {promo.action}
                    </button>
                  </div>
                ))}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {activeSport && activeSport !== 'all' ? 
                    sportsData?.find(s => s.key === activeSport)?.title || activeSport :
                    "Eventos en Vivo"}
                </h2>
                <Link href="/sports">
                  <span className="text-[#09b66d] text-sm font-medium flex items-center">
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
                    <Card className="bg-[#192531] border-[#1c2b3a] p-4">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Tv className="h-12 w-12 text-gray-500 mb-2" />
                        <h3 className="text-lg font-medium">No hay eventos en vivo en este momento</h3>
                        <p className="text-sm text-gray-400">Intenta seleccionar un deporte diferente o vuelve más tarde</p>
                      </div>
                    </Card>
                  ) : (
                    filteredEvents.map((event) => {
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
                    })
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