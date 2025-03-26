import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search, Plus, Coins, Star, Clock, ChevronRight, Calendar, CalendarDays, Activity, Trophy, AlertTriangle, Package, Grid, ChevronDown, Settings, Gift, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { CurrencyDropdown } from "@/components/ui/currency-dropdown";
import { EventCard } from "@/components/sports/event-card";
import { NewEventCard } from "@/components/sports/new-event-card";
import { BetSlip, BetSelection } from "@/components/sports/bet-slip-simple";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Import the sports API utilities
import { 
  fetchSports, 
  fetchOdds, 
  fetchUpcomingEvents,
  formatEventDate,
  formatAmericanOdds,
  getSportColor,
  generateDemoEvents,
  Sport,
  EventOdds
} from "@/lib/sports-api";

export default function SportsBettingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSport, setActiveSport] = useState<string>("");
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  
  // Para la navegación y actualización de URL
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const filterParam = urlParams.get('filter');
  
  // Inicializar estados de filtros basados en localStorage y parámetros de URL
  const [showLiveEvents, setShowLiveEvents] = useState<boolean>(
    filterParam === 'live' || localStorage.getItem('sportsFilter') === 'live'
  );
  const [showUpcomingEvents, setShowUpcomingEvents] = useState<boolean>(
    filterParam === 'upcoming' || 
    localStorage.getItem('sportsFilter') === 'upcoming' || 
    (localStorage.getItem('sportsFilter') === null && !filterParam)
  );
  const [showFavorites, setShowFavorites] = useState<boolean>(
    filterParam === 'favorites' || localStorage.getItem('sportsFilter') === 'favorites'
  );
  const [showTomorrowEvents, setShowTomorrowEvents] = useState<boolean>(
    filterParam === 'tomorrow' || localStorage.getItem('sportsFilter') === 'tomorrow'
  );
  
  // Función para aplicar filtro y actualizar la URL y el localStorage
  const handleFilterChange = (filterType: 'live' | 'upcoming' | 'favorites' | 'tomorrow') => {
    // Actualizar estados locales
    setShowLiveEvents(filterType === 'live');
    setShowUpcomingEvents(filterType === 'upcoming');
    setShowFavorites(filterType === 'favorites');
    setShowTomorrowEvents(filterType === 'tomorrow');
    
    // Guardar en localStorage
    localStorage.setItem('sportsFilter', filterType);
    
    // Actualizar URL con el parámetro de filtro
    const newParams = new URLSearchParams();
    newParams.set('filter', filterType);
    
    // Mantener otros parámetros existentes (excepto filter)
    urlParams.forEach((value, key) => {
      if (key !== 'filter') {
        newParams.set(key, value);
      }
    });
    
    // Construir nueva URL y navegar
    const newPath = location.split('?')[0] + '?' + newParams.toString();
    setLocation(newPath);
  };
  
  const [activeTab, setActiveTab] = useState<string>("misBoletos");
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    // Inicializar con el valor del localStorage o usar un valor predeterminado (USDT)
    return localStorage.getItem('selectedCurrency') || 'USDT';
  });
  
  // Lista de criptomonedas disponibles con su valor
  const currencies = [
    { code: 'BTC', name: 'Bitcoin', value: 0.00000019, icon: '₿', color: '#f7931a' },
    { code: 'ETH', name: 'Ethereum', value: 0.00000000, icon: 'Ξ', color: '#627eea' },
    { code: 'LTC', name: 'Litecoin', value: 0.00000000, icon: 'Ł', color: '#b8b8b8' },
    { code: 'USDT', name: 'Tether', value: 0.00086244, icon: '₮', color: '#26a17b' },
    { code: 'SOL', name: 'Solana', value: 0.00000000, icon: '◎', color: '#00ffbd' },
    { code: 'DOGE', name: 'Dogecoin', value: 0.00000000, icon: 'Ð', color: '#c2a633' },
    { code: 'BCH', name: 'Bitcoin Cash', value: 0.00000000, icon: '₿', color: '#8dc351' },
    { code: 'XRP', name: 'Ripple', value: 0.00000000, icon: '✕', color: '#23292f' },
    { code: 'TRX', name: 'TRON', value: 0.00000000, icon: '♦', color: '#ef0027' },
    { code: 'EOS', name: 'EOS', value: 0.00000000, icon: 'ε', color: '#000000' }
  ];
  
  // Obtener la moneda seleccionada
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[3]; // USDT por defecto
  
  // Efecto para guardar la moneda seleccionada en localStorage y emitir evento
  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
    
    // Emitir evento para que otros componentes se actualicen
    const event = new CustomEvent('currencyChanged', { detail: selectedCurrency });
    document.dispatchEvent(event);
  }, [selectedCurrency]);
  
  // Función para formatear el estado de las apuestas para mostrar en UI
  const formatOddStatus = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'won':
        return 'Ganada';
      case 'lost':
        return 'Perdida';
      default:
        return status;
    }
  };
  
  // Fetch available sports
  const { 
    data: sportsData, 
    isLoading: sportsLoading,
    error: sportsError 
  } = useQuery<Sport[]>({
    queryKey: ['sports'],
    queryFn: fetchSports,
  });
  
  // Fetch upcoming events for all sports
  const { 
    data: upcomingEvents, 
    isLoading: eventsLoading,
    error: eventsError 
  } = useQuery<EventOdds[]>({
    queryKey: ['events', 'upcoming'],
    queryFn: () => fetchUpcomingEvents('us', 'h2h', 'american'),
  });
  
  // Fetch favorite events
  const { 
    data: favoriteEvents, 
    isLoading: favoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites
  } = useQuery<any[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user) return [];
      return apiRequest<any[]>({
        url: '/api/favorites',
        method: 'GET'
      });
    },
    enabled: !!user,
  });
  
  // Effect to refetch favorites when showFavorites changes
  useEffect(() => {
    if (showFavorites && user) {
      refetchFavorites();
    }
  }, [showFavorites, user, refetchFavorites]);
  
  // When a specific sport is selected, fetch its events
  const { 
    data: sportEvents,
    isLoading: sportEventsLoading 
  } = useQuery<EventOdds[]>({
    queryKey: ['events', activeSport],
    queryFn: () => fetchOdds(activeSport, 'us', 'h2h', 'american'),
    enabled: !!activeSport && activeSport !== 'all',
  });
  
  // Fetch user bet history
  const { 
    data: betHistory = [], 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ['/api/sports/bet-history'],
    queryFn: async () => {
      if (!user) return [];
      return apiRequest<any[]>({
        url: '/api/sports/bet-history',
        method: 'GET'
      });
    },
    enabled: !!user,
  });
  
  // Fetch user active bets
  const { 
    data: userBets = [], 
    isLoading: betsLoading 
  } = useQuery({
    queryKey: ['/api/sports/user-bets'],
    queryFn: async () => {
      if (!user) return [];
      return apiRequest<any[]>({
        url: '/api/sports/user-bets',
        method: 'GET'
      });
    },
    enabled: !!user,
  });
  
  // Crear eventos demo si no hay datos
  const demoEventsData = useMemo(() => generateDemoEvents(), []);
  
  // Usar eventos de ejemplo cuando la API no responda correctamente
  const fallbackEvents = useMemo(() => {
    // Si no tenemos datos de eventos y hay error o se ha terminado de cargar, usamos datos simulados
    if ((!upcomingEvents || upcomingEvents.length === 0) && (eventsError || !eventsLoading)) {
      return demoEventsData;
    }
    return undefined;
  }, [upcomingEvents, eventsError, eventsLoading, demoEventsData]);
  
  // Crear deportes de ejemplo cuando la API no responda
  const demoSports: Sport[] = useMemo(() => {
    return [
      { key: 'soccer_laliga', group: 'Soccer', title: 'La Liga', description: 'La Liga de España', active: true, has_outrights: false },
      { key: 'soccer_epl', group: 'Soccer', title: 'Premier League', description: 'Premier League de Inglaterra', active: true, has_outrights: false },
      { key: 'soccer_fifa_world_cup', group: 'Soccer', title: 'FIFA World Cup', description: 'Copa Mundial de la FIFA', active: true, has_outrights: false },
      { key: 'soccer_uefa_champs_league', group: 'Soccer', title: 'UEFA Champions League', description: 'UEFA Champions League', active: true, has_outrights: false },
      { key: 'basketball_nba', group: 'Basketball', title: 'NBA', description: 'National Basketball Association', active: true, has_outrights: false },
      { key: 'basketball_euroleague', group: 'Basketball', title: 'Euroleague', description: 'Euroleague de Baloncesto', active: true, has_outrights: false },
      { key: 'tennis_atp', group: 'Tennis', title: 'ATP Tennis', description: 'ATP Tennis Tour', active: true, has_outrights: false },
      { key: 'baseball_mlb', group: 'Baseball', title: 'MLB', description: 'Major League Baseball', active: true, has_outrights: false },
    ];
  }, []);
  
  // Usar deportes de ejemplo cuando la API no responda correctamente
  const fallbackSports = useMemo(() => {
    // Si no tenemos datos de deportes y hay error o se ha terminado de cargar, usamos datos simulados
    if ((!sportsData || sportsData.length === 0) && (sportsError || !sportsLoading)) {
      return demoSports;
    }
    return undefined;
  }, [sportsData, sportsError, sportsLoading, demoSports]);
  
  // Display either sport-specific events or upcoming events based on selection, with fallback to demo data
  const displayEvents = useMemo(() => {
    if (activeSport && activeSport !== 'all') {
      // Eventos específicos del deporte seleccionado
      if (sportEvents && sportEvents.length > 0) {
        return sportEvents;
      } else {
        // Usar los eventos de demostración filtrados por el deporte seleccionado
        return fallbackEvents?.filter(event => event.sport_key.includes(activeSport)) || [];
      }
    } else {
      // Todos los eventos próximos
      return upcomingEvents || fallbackEvents || [];
    }
  }, [activeSport, sportEvents, upcomingEvents, fallbackEvents]);
  
  // Helper function to check if an event is live or upcoming
  const isEventLive = (event: EventOdds): boolean => {
    // In a real app, this would check for a 'live' flag from the API
    // For demo, we'll simulate some events as live (if they're scheduled for today)
    const eventDate = new Date(event.commence_time);
    const now = new Date();
    return eventDate.getDate() === now.getDate() && 
           eventDate.getMonth() === now.getMonth() && 
           eventDate.getFullYear() === now.getFullYear() &&
           eventDate.getTime() <= now.getTime();
  };
  
  // Helper function to check if an event is tomorrow (within next 24h)
  const isEventTomorrow = (event: EventOdds): boolean => {
    const eventDate = new Date(event.commence_time);
    const now = new Date();
    
    // Tomamos el rango de mañana como desde las 00:00 de mañana hasta las 23:59 de mañana
    // Crear la fecha de mañana (start of day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Crear la fecha de mañana (end of day)
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    // Verificar si el evento está entre el inicio y fin de mañana
    return eventDate >= tomorrow && eventDate <= tomorrowEnd;
  };
  
  // Organize sports by group
  const sportsByGroup = useMemo(() => {
    // Usar los datos reales si están disponibles, si no, usar los de respaldo
    const sportsToUse = (sportsData && sportsData.length > 0) ? sportsData : fallbackSports || [];
    
    return sportsToUse.reduce((groups: Record<string, Sport[]>, sport) => {
      if (!groups[sport.group]) {
        groups[sport.group] = [];
      }
      groups[sport.group].push(sport);
      return groups;
    }, {});
  }, [sportsData, fallbackSports]);

  // Filter sports based on active filter (live, favorites, etc.)
  const filteredSportsData = useMemo(() => {
    // Determinar qué datos de deportes usar (reales o de respaldo)
    const sportsToUse = (sportsData && sportsData.length > 0) ? sportsData : fallbackSports || [];
    
    return sportsToUse.filter(sport => {
      if (showLiveEvents) {
        // Solo deportes que tienen eventos en vivo
        return displayEvents?.some(event => 
          event.sport_key.includes(sport.key) && isEventLive(event)
        );
      } else if (showUpcomingEvents) {
        // Solo deportes que tienen eventos próximos (no en vivo)
        return displayEvents?.some(event => 
          event.sport_key.includes(sport.key) && !isEventLive(event)
        );
      } else if (showTomorrowEvents) {
        // Solo deportes que tienen eventos para mañana
        return displayEvents?.some(event => 
          event.sport_key.includes(sport.key) && isEventTomorrow(event)
        );
      } else if (showFavorites) {
        // Solo deportes que tienen eventos favoritos
        return displayEvents?.some(event => 
          event.sport_key.includes(sport.key) && 
          favoriteEvents?.some(favorite => 
            favorite.gameType === 'sports' && favorite.gameId === event.id
          )
        );
      } else {
        // Si no hay filtro activo, mostrar todos los deportes
        return true;
      }
    });
  }, [sportsData, fallbackSports, displayEvents, showLiveEvents, showUpcomingEvents, showTomorrowEvents, showFavorites, favoriteEvents, isEventLive, isEventTomorrow]);

  // Organize filtered sports by group
  const filteredSportsByGroup = filteredSportsData.reduce((groups: Record<string, Sport[]>, sport) => {
    if (!groups[sport.group]) {
      groups[sport.group] = [];
    }
    groups[sport.group].push(sport);
    return groups;
  }, {});
  
  // Extract unique sport groups for the categories (use filtered or all based on filters)
  const sportGroups = Object.keys(
    showLiveEvents || showUpcomingEvents || showTomorrowEvents || showFavorites
      ? filteredSportsByGroup
      : sportsByGroup
  ).slice(0, 8);
  
  // Map sport groups to category display data
  const sportsCategories = sportGroups.map(group => {
    const color = getSportColor(group);
    return {
      name: group.toUpperCase(),
      icon: "", // We don't have actual icon files
      color
    };
  });
  
  // If data is not yet loaded, add some placeholder categories
  if (sportsCategories.length === 0) {
    [
      { name: t('sports.soccer').toUpperCase(), color: "#1e88e5", icon: "" },
      { name: t('sports.basketball').toUpperCase(), color: "#d32f2f", icon: "" },
      { name: t('sports.tennis').toUpperCase(), color: "#ff9800", icon: "" },
      { name: "MMA", color: "#4caf50", icon: "" },
      { name: "BASEBALL", color: "#ff5722", icon: "" },
      { name: "ICE HOCKEY", color: "#03a9f4", icon: "" },
      { name: "TABLE TENNIS", color: "#9c27b0", icon: "" },
      { name: "VOLLEYBALL", color: "#3949ab", icon: "" }
    ].forEach(cat => sportsCategories.push(cat));
  }
  
  // Create featured events based on real data if available
  const featuredEvents = upcomingEvents?.slice(0, 3).map((event, index) => {
    const sportTitle = sportsData?.find(s => s.key === event.sport_key)?.title || event.sport_key;
    const colors = ["#007749", "#333966", "#114f7a"];
    
    return {
      id: event.id,
      title: sportTitle,
      subtitle: `${event.home_team} vs ${event.away_team}`,
      action: t('buttons.betNow'),
      image: "", // We don't have actual image files
      backgroundColor: colors[index % colors.length],
      buttonColor: `bg-[${colors[index % colors.length]}]`,
      commence_time: event.commence_time
    };
  }) || [
    {
      id: 1,
      title: t('sports.nba'),
      subtitle: t('sports.allMatches'),
      action: t('buttons.watchNow'),
      image: "",
      backgroundColor: "#007749",
      buttonColor: "bg-[#007749]"
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
  
  // Filter events based on live/upcoming status, favorites, tomorrow's events, and selected sport
  const filteredByStatus = displayEvents?.filter(event => {
    // First filter by event status (live, upcoming, favorites, tomorrow)
    const passesStatusFilter = 
      (showLiveEvents && isEventLive(event)) ||
      (showUpcomingEvents && !isEventLive(event)) ||
      (showFavorites && favoriteEvents?.some(favorite => 
        favorite.gameType === 'sports' && favorite.gameId === event.id
      )) ||
      (showTomorrowEvents && isEventTomorrow(event)) ||
      (!showLiveEvents && !showUpcomingEvents && !showFavorites && !showTomorrowEvents);
    
    // Then filter by selected sport if any
    const passesSportFilter = 
      !activeSport || 
      activeSport === 'all' || 
      (activeSport && event.sport_key === activeSport);
    
    return passesStatusFilter && passesSportFilter;
  }) || [];
  
  // Filter events for display (limit to 10 for performance)
  const filteredEvents = filteredByStatus.slice(0, 10) || [];
  
  // Special loading state for favorites
  const isLoadingFavorites = showFavorites && favoritesLoading;
  
  // Handler for adding a bet selection
  const handleAddSelection = (selection: BetSelection) => {
    // Check if the selection already exists
    const existingSelectionIndex = betSelections.findIndex(
      bet => bet.eventId === selection.eventId && 
             bet.selectedTeam === selection.selectedTeam && 
             bet.marketType === selection.marketType
    );
    
    if (existingSelectionIndex !== -1) {
      // Remove it if it already exists (toggle behavior)
      const newSelections = [...betSelections];
      newSelections.splice(existingSelectionIndex, 1);
      setBetSelections(newSelections);
    } else {
      // Add new selection
      setBetSelections([...betSelections, selection]);
    }
  };
  
  // Handler for removing a bet selection
  const handleRemoveSelection = (id: string) => {
    setBetSelections(betSelections.filter(bet => bet.id !== id));
  };
  
  // Handler for clearing all selections
  const handleClearSelections = () => {
    setBetSelections([]);
  };

  const currencyTriggerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Header - Only visible on desktop */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10 hidden md:block">
        <div className="flex items-center justify-between h-16 px-4">
          
          <div className="hidden md:flex items-center">
            <div className="flex items-center mr-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#09b66d] to-[#f8c541] text-transparent bg-clip-text font-['Montserrat']">CRYPTOSPIN</h1>
            </div>
          </div>
          
          {/* Balance con selector de criptomonedas y botón de depósito */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center space-x-3 relative">
              {/* Caja única con selector y botón de depósito */}
              <div className="flex items-center bg-[#0e1824] rounded-full border border-[#1c2b3a] overflow-hidden">
                {/* Selector de divisas */}
                <div 
                  ref={currencyTriggerRef}
                  className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-[#192531]/70 transition-all duration-200"
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                >
                  <div className="h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: currentCurrency.color }}>
                    {currentCurrency.icon}
                  </div>
                  <span className="text-white text-sm font-bold">{currentCurrency.value.toFixed(8)}</span>
                  <ChevronDown className={`h-4 w-4 ml-2 text-white transition-transform ${isWalletOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Línea vertical separadora */}
                <div className="h-6 w-px bg-[#1c2b3a]"></div>
                
                {/* Botón de depósito */}
                <button className="flex items-center px-5 py-1.5 bg-[#09b66d] hover:bg-[#0fda85] text-white font-bold text-sm transition-all duration-200">
                  Depositar
                </button>
              </div>
              
              {/* Usando nuestro componente de portal de monedas */}
              <CurrencyDropdown 
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                currencies={currencies}
                selectedCurrency={selectedCurrency}
                onCurrencySelect={setSelectedCurrency}
                triggerRef={currencyTriggerRef}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
                <Search className="h-5 w-5" />
              </button>
              
              <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
                <Gift className="h-5 w-5" />
              </button>
              
              <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center bg-[#192531] border border-[#1c2b3a] rounded-md px-1 py-1 cursor-pointer hover:border-[#09b66d]/50 transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#09b66d] flex items-center justify-center text-white font-bold">
                    {user?.username?.substring(0, 1) || 'U'}
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-white font-medium max-w-[80px] truncate">
                      {user?.username || 'Usuario'}
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-[#09b66d] rounded-full mr-1"></div>
                      <span className="text-[10px] text-gray-400">VIP</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white mr-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-2 md:p-4 pt-16 md:pt-4 overflow-x-hidden bg-[#0b1422]">
        <div className="w-full mx-auto flex flex-col md:flex-row gap-4">
          
          {/* Left column - Events and betting options */}
          <div className="flex-1 max-w-full">
            {/* Featured Events */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {featuredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="rounded-lg overflow-hidden" 
                  style={{ background: `${event.backgroundColor}` }}
                >
                  <div className="p-3 h-[140px] relative flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                      <p className="text-sm text-white/80">{event.subtitle}</p>
                    </div>
                    
                    <Button 
                      size="sm"
                      className={`mt-2 w-fit ${event.buttonColor} hover:opacity-90 text-white`}
                    >
                      {event.action}
                    </Button>
                    
                    {/* Image placeholder */}
                    <div className="absolute right-0 bottom-0 h-full w-1/3 opacity-70 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Links - Diseño actualizado con segmentos */}
            <div className="px-4 mb-6 mt-1">
              <div className="flex justify-stretch items-center rounded-lg overflow-hidden bg-[#0e1824] border border-[#1c2b3a] divide-x divide-[#1c2b3a]">
                <button 
                  className={`flex items-center justify-center flex-1 px-2 py-2.5 ${
                    showFavorites 
                      ? 'bg-[#09b66d] text-white' 
                      : 'bg-[#192531] text-gray-300 hover:bg-[#233546]'
                  } transition-all duration-200`}
                  onClick={() => handleFilterChange('favorites')}
                >
                  <Star className={`h-4 w-4 mr-1.5 ${showFavorites ? 'text-white' : 'text-[#f8c541]'}`} />
                  <span className="text-sm font-medium">{t('sports.favorites')}</span>
                </button>
                
                <button 
                  className={`flex items-center justify-center flex-1 px-2 py-2.5 ${
                    showLiveEvents 
                      ? 'bg-[#09b66d] text-white' 
                      : 'bg-[#192531] text-gray-300 hover:bg-[#233546]'
                  } transition-all duration-200`}
                  onClick={() => handleFilterChange('live')}
                >
                  <div className={`flex items-center justify-center h-4 w-4 mr-1.5 ${showLiveEvents ? 'text-white' : 'text-red-500'}`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${showLiveEvents ? 'bg-white/70' : 'bg-red-400'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${showLiveEvents ? 'bg-white' : 'bg-red-500'}`}></span>
                    </span>
                  </div>
                  <span className="text-sm font-medium">{t('sports.live')}</span>
                </button>
                
                <button 
                  className={`flex items-center justify-center flex-1 px-2 py-2.5 ${
                    showUpcomingEvents 
                      ? 'bg-[#09b66d] text-white' 
                      : 'bg-[#192531] text-gray-300 hover:bg-[#233546]'
                  } transition-all duration-200`}
                  onClick={() => handleFilterChange('upcoming')}
                >
                  <CalendarDays className={`h-4 w-4 mr-1.5 ${showUpcomingEvents ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Próximos</span>
                </button>
                
                <button 
                  className={`flex items-center justify-center flex-1 px-2 py-2.5 ${
                    showTomorrowEvents 
                      ? 'bg-[#09b66d] text-white' 
                      : 'bg-[#192531] text-gray-300 hover:bg-[#233546]'
                  } transition-all duration-200`}
                  onClick={() => handleFilterChange('tomorrow')}
                >
                  <Calendar className={`h-4 w-4 mr-1.5 ${showTomorrowEvents ? 'text-white' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{t('sports.tomorrow')}</span>
                </button>
              </div>
            </div>
            
            {/* Sports Categories Title */}
            <div className="mb-4">
              <h2 className="text-xl font-bold">{t('sports.topSports')}</h2>
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
                      {showLiveEvents
                        ? displayEvents?.filter(event => isEventLive(event)).length || 0
                        : showUpcomingEvents
                          ? displayEvents?.filter(event => !isEventLive(event)).length || 0
                          : showTomorrowEvents
                            ? displayEvents?.filter(event => isEventTomorrow(event)).length || 0
                            : showFavorites
                              ? favoriteEvents?.length || 0
                              : displayEvents?.length || 0
                      }
                    </span>
                  </div>
                  
                  {/* Mostrar deportes filtrados según el filtro activo */}
                  {(showLiveEvents || showUpcomingEvents || showTomorrowEvents || showFavorites 
                    ? filteredSportsData 
                    : sportsData)?.map((sport) => {
                    const isActive = activeSport === sport.key;
                    const color = getSportColor(sport.group);
                    
                    // Contar eventos para este deporte según el filtro activo
                    let eventsCount = 0;
                    
                    if (showLiveEvents) {
                      // Contar eventos en vivo para este deporte
                      eventsCount = displayEvents?.filter(event => 
                        event.sport_key === sport.key && isEventLive(event)
                      )?.length || 0;
                    } else if (showUpcomingEvents) {
                      // Contar eventos próximos para este deporte
                      eventsCount = displayEvents?.filter(event => 
                        event.sport_key === sport.key && !isEventLive(event)
                      )?.length || 0;
                    } else if (showTomorrowEvents) {
                      // Contar eventos de mañana para este deporte
                      eventsCount = displayEvents?.filter(event => 
                        event.sport_key === sport.key && isEventTomorrow(event)
                      )?.length || 0;
                    } else if (showFavorites) {
                      // Contar eventos favoritos para este deporte
                      eventsCount = favoriteEvents?.filter(event => 
                        event.sport_key === sport.key
                      )?.length || 0;
                    } else {
                      // Si no hay filtro activo, mostrar todos los eventos
                      eventsCount = displayEvents?.filter(event => 
                        event.sport_key === sport.key
                      )?.length || 0;
                    }
                    
                    // No mostrar deportes sin eventos cuando se filtran
                    if ((showLiveEvents || showUpcomingEvents || showTomorrowEvents || showFavorites) && eventsCount === 0) {
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
                          ) : sport.key.includes('volleyball') || sport.group === 'Volleyball' ? (
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
                              <path d="M7 15a8 8 0 0 0 8-10" stroke="#09b66d"/>
                              <path d="M12 4c1 3.5 1.5 8-4 10" stroke="#fff"/>
                              <path d="M12 4c3 3.5 5 8 0 12" stroke="#09b66d"/>
                              <path d="M7 9C5 12 6 16 12 17" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('tabletennis') || sport.key.includes('ping_pong') || sport.key.includes('table_tennis') ? (
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
                              <rect x="5" y="10" width="14" height="8" rx="1" stroke="#09b66d"/>
                              <path d="M5 14h14" stroke="#fff"/>
                              <path d="M12 10v8" stroke="#fff"/>
                              <path d="M6 7l6-3 6 3" stroke="#fff"/>
                              <circle cx="16" cy="7" r="2" stroke="#09b66d" fill="#09b66d"/>
                            </svg>
                          ) : sport.key.includes('mma') || sport.group === 'MMA' ? (
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
                              <path d="M7 7l5-5 5 5" stroke="#fff"/>
                              <path d="M7 17l5 5 5-5" stroke="#fff"/>
                              <path d="M17 7l-5 5-5-5" stroke="#09b66d"/>
                              <path d="M17 17l-5-5-5 5" stroke="#09b66d"/>
                              <circle cx="12" cy="12" r="2" stroke="#fff" fill="#09b66d"/>
                            </svg>
                          ) : sport.key.includes('boxing') ? (
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
                              <path d="M4 8h4v9c0 1-1 2-2 2s-2-1-2-2V8z" stroke="#09b66d" fill="none"/>
                              <path d="M20 8h-4v9c0 1 1 2 2 2s2-1 2-2V8z" stroke="#09b66d" fill="none"/>
                              <path d="M8 8s1-3 4-3 4 3 4 3" stroke="#fff"/>
                              <path d="M8 12h8" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('esports') || sport.key.includes('cs2') || sport.key.includes('dota') || sport.key.includes('league') ? (
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
                              <path d="M6 11h12v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7z" stroke="#09b66d" fill="none"/>
                              <path d="M8 11V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4" stroke="#fff"/>
                              <path d="M10 14h4M8 17h8" stroke="#fff"/>
                              <circle cx="12" cy="14" r="1" fill="#fff"/>
                            </svg>
                          ) : sport.key.includes('golf') ? (
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
                              <path d="M12 3v12" stroke="#fff" strokeWidth="2"/>
                              <path d="M9 15h6l3 7H6l3-7z" stroke="#09b66d" fill="none"/>
                              <circle cx="12" cy="18" r="1" fill="#fff"/>
                            </svg>
                          ) : sport.key.includes('racing') || sport.key.includes('formula') || sport.key.includes('motorsport') ? (
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
                              <path d="M7 10h11l2 4v2H4v-2l2-4z" stroke="#09b66d" fill="none"/>
                              <path d="M8 14h8" stroke="#fff"/>
                              <circle cx="7" cy="17" r="2" stroke="#fff" fill="none"/>
                              <circle cx="17" cy="17" r="2" stroke="#fff" fill="none"/>
                              <path d="M15 6l2 4" stroke="#fff"/>
                              <path d="M7 6h4l4 3" stroke="#09b66d"/>
                            </svg>
                          ) : sport.key.includes('rugby') ? (
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
                              <path d="M6 16c2 2 6 3 10-1s3-8 1-10-6-3-10 1-3 8-1 10z" stroke="#09b66d" fill="none"/>
                              <path d="M10 8l4 4M8 10l4 4M6 12l4 4" stroke="#fff"/>
                              <path d="M12 6l4 4M14 8l4 4" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('handball') ? (
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
                              <circle cx="12" cy="7" r="3" stroke="#fff" fill="none"/>
                              <path d="M10 10l-2 9M14 10l4 9" stroke="#09b66d"/>
                              <path d="M7 18h10" stroke="#fff"/>
                              <path d="M10 13l4-1" stroke="#fff"/>
                            </svg>
                          ) : sport.key.includes('football') || sport.key.includes('nfl') ? (
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
                              <ellipse cx="12" cy="12" rx="8" ry="6" stroke="#09b66d" fill="none"/>
                              <path d="M12 6v12" stroke="#fff"/>
                              <path d="M7 9h10M7 15h10" stroke="#fff"/>
                              <path d="M8 12h8" stroke="#09b66d"/>
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
            
            {/* Upcoming Events Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {activeSport && activeSport !== 'all' ? 
                    sportsData?.find(s => s.key === activeSport)?.title || activeSport :
                    (showLiveEvents ? t('sports.liveEvents') : 
                     showFavorites ? t('sports.favorites') : 
                     showTomorrowEvents ? t('sports.tomorrow') : 
                     "Próximos Eventos")}
                </h2>
                <Link href="#">
                  <span className="text-[#09b66d] text-sm font-medium flex items-center">
                    {t('buttons.viewAll')} <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
              
              {/* Loading state */}
              {(eventsLoading || isLoadingFavorites) && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-[#121c2e] border-[#1a2e4a] p-4 animate-pulse h-28">
                      <div className="h-full flex flex-col justify-center items-center">
                        <div className="w-8 h-8 rounded-full bg-[#1e2e4a] mb-2"></div>
                        <div className="h-4 w-36 bg-[#1e2e4a] rounded"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Error state */}
              {eventsError && (
                <Card className="bg-[#121c2e] border-[#1a2e4a] p-4">
                  <div className="flex items-center justify-center space-x-2 text-[#e64d6b]">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Error loading events. Please try again later.</span>
                  </div>
                </Card>
              )}
              
              {/* Events display */}
              {!eventsLoading && !isLoadingFavorites && !eventsError && (
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <Card className="bg-[#121c2e] border-[#1a2e4a] p-4">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Calendar className="h-12 w-12 text-gray-500 mb-2" />
                        <h3 className="text-lg font-medium">No events found</h3>
                        <p className="text-sm text-gray-400">Try selecting a different sport or check back later</p>
                      </div>
                    </Card>
                  ) : (
                    filteredEvents.map((event) => {
                      const sportTitle = sportsData?.find(s => s.key === event.sport_key)?.title || event.sport_key;
                      return (
                        <NewEventCard
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
            <div className="bg-[#121c2e] border border-[#1a2e4a] rounded-lg overflow-hidden">
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
                <div className="absolute bottom-0 left-0 w-full h-px bg-[#1a2e4a]"></div>
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
                          <div key={bet.id} className="bg-[#1e2e4a] p-3 rounded-md">
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
                          <div key={bet.id} className="bg-[#1e2e4a] p-3 rounded-md">
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