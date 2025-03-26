import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Plus, Coins, Star, Clock, ChevronRight, Calendar, CalendarDays, Activity, Trophy, AlertTriangle, Package, Grid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { EventCard } from "@/components/sports/event-card";
import { BetSlip, BetSelection } from "@/components/sports/bet-slip";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";

// Import the sports API utilities
import { 
  fetchSports, 
  fetchOdds, 
  fetchUpcomingEvents,
  formatEventDate,
  formatAmericanOdds,
  getSportColor,
  Sport,
  EventOdds
} from "@/lib/sports-api";

export default function SportsBettingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSport, setActiveSport] = useState<string>("");
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  const [showLiveEvents, setShowLiveEvents] = useState<boolean>(localStorage.getItem('sportsFilter') === 'live');
  const [showUpcomingEvents, setShowUpcomingEvents] = useState<boolean>(localStorage.getItem('sportsFilter') === 'upcoming' || localStorage.getItem('sportsFilter') === null);
  const [showFavorites, setShowFavorites] = useState<boolean>(localStorage.getItem('sportsFilter') === 'favorites');
  const [showTomorrowEvents, setShowTomorrowEvents] = useState<boolean>(localStorage.getItem('sportsFilter') === 'tomorrow');
  
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
  
  // Display either sport-specific events or upcoming events based on selection
  const displayEvents = activeSport && activeSport !== 'all' ? sportEvents : upcomingEvents;
  
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
  const sportsByGroup = sportsData?.reduce((groups: Record<string, Sport[]>, sport) => {
    if (!groups[sport.group]) {
      groups[sport.group] = [];
    }
    groups[sport.group].push(sport);
    return groups;
  }, {}) || {};

  // Filter sports based on active filter (live, favorites, etc.)
  const filteredSportsData = sportsData?.filter(sport => {
    if (showLiveEvents) {
      // Solo deportes que tienen eventos en vivo
      return displayEvents?.some(event => 
        event.sport_key === sport.key && isEventLive(event)
      );
    } else if (showUpcomingEvents) {
      // Solo deportes que tienen eventos próximos (no en vivo)
      return displayEvents?.some(event => 
        event.sport_key === sport.key && !isEventLive(event)
      );
    } else if (showTomorrowEvents) {
      // Solo deportes que tienen eventos para mañana
      return displayEvents?.some(event => 
        event.sport_key === sport.key && isEventTomorrow(event)
      );
    } else if (showFavorites) {
      // Solo deportes que tienen eventos favoritos
      return displayEvents?.some(event => 
        event.sport_key === sport.key && 
        favoriteEvents?.some(favorite => 
          favorite.gameType === 'sports' && favorite.gameId === event.id
        )
      );
    } else {
      // Si no hay filtro activo, mostrar todos los deportes
      return true;
    }
  }) || [];

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

  return (
    <>
      {/* Header - Only visible on desktop */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10 hidden md:block">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="hidden md:flex flex-1 items-center px-4">
            <div className="flex items-center mr-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#09b66d] to-[#f8c541] text-transparent bg-clip-text font-['Montserrat']">CRYPTOSPIN</h1>
            </div>
            <div className="max-w-md w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2 rounded-md bg-[#192531] border border-[#1c2b3a] text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#09b66d] focus:border-[#09b66d]" 
                  placeholder={t('sports.searchEvents')}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center px-3 py-1.5 rounded-md bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium text-sm transition-all duration-200">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>{t('buttons.deposit')}</span>
            </button>
            
            <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
              <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
              <span className="text-sm font-semibold">{user?.balance}</span>
            </div>
            
            <NotificationDropdown />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-2 md:p-4 pt-16 md:pt-4 overflow-x-hidden">
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
            
            {/* Quick Links */}
            <div className="flex justify-center items-center flex-wrap gap-2 mb-4 py-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="min-w-[105px] bg-[#192531] border-[#1c2b3a] text-white hover:bg-[#09b66d] hover:border-[#09b66d] transition-all"
                onClick={() => {
                  setShowFavorites(true);
                  setShowLiveEvents(false);
                  setShowUpcomingEvents(false);
                  setShowTomorrowEvents(false);
                  localStorage.setItem('sportsFilter', 'favorites');
                }}
              >
                <Star className="h-4 w-4 mr-1 text-[#f8c541]" />
                {t('sports.favorites')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="min-w-[105px] bg-[#192531] border-[#1c2b3a] text-white hover:bg-[#09b66d] hover:border-[#09b66d] transition-all"
                onClick={() => {
                  setShowLiveEvents(true);
                  setShowFavorites(false);
                  setShowUpcomingEvents(false);
                  setShowTomorrowEvents(false);
                  localStorage.setItem('sportsFilter', 'live');
                }}
              >
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {t('sports.live')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="min-w-[105px] bg-[#192531] border-[#1c2b3a] text-white hover:bg-[#09b66d] hover:border-[#09b66d] transition-all"
                onClick={() => {
                  setShowUpcomingEvents(true);
                  setShowFavorites(false);
                  setShowLiveEvents(false);
                  setShowTomorrowEvents(false);
                  localStorage.setItem('sportsFilter', 'upcoming');
                }}
              >
                <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                Próximos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="min-w-[105px] bg-[#192531] border-[#1c2b3a] text-white hover:bg-[#09b66d] hover:border-[#09b66d] transition-all"
                onClick={() => {
                  setShowTomorrowEvents(true);
                  setShowFavorites(false);
                  setShowLiveEvents(false);
                  setShowUpcomingEvents(false);
                  localStorage.setItem('sportsFilter', 'tomorrow');
                  
                  // Debugging: Log eventos de mañana para verificar si existen
                  console.log("Eventos para mañana:", 
                    displayEvents?.filter(event => isEventTomorrow(event))
                  );
                }}
              >
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {t('sports.tomorrow')}
              </Button>
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
                    <span className="text-xs font-bold text-white">1546</span>
                  </div>
                  
                  {/* Mostrar deportes filtrados según el filtro activo */}
                  {(showLiveEvents || showUpcomingEvents || showTomorrowEvents || showFavorites 
                    ? filteredSportsData 
                    : sportsData)?.map((sport) => {
                    const isActive = activeSport === sport.key;
                    const color = getSportColor(sport.group);
                    // Número aleatorio para simular cantidad de eventos (en producción debería venir del API)
                    const eventsCount = Math.floor(Math.random() * 100) + 1;
                    
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
                          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
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
                    <span>Error loading events. Please try again later.</span>
                  </div>
                </Card>
              )}
              
              {/* Events display */}
              {!eventsLoading && !isLoadingFavorites && !eventsError && (
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <Card className="bg-[#192531] border-[#1c2b3a] p-4">
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
          
          {/* Right column - Bet Slip */}
          <div className="w-full md:w-80 lg:w-96 mt-4 md:mt-0">
            <BetSlip 
              selections={betSelections}
              onRemoveSelection={handleRemoveSelection}
              onClearSelections={handleClearSelections}
            />
          </div>
        </div>
      </main>
    </>
  );
}