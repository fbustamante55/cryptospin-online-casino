import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Plus, Coins, Star, Clock, ChevronRight, Calendar, Activity, Trophy, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EventCard } from "@/components/sports/event-card";
import { BetSlip, BetSelection } from "@/components/sports/bet-slip";
import { nanoid } from "nanoid";

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
  
  // Organize sports by group
  const sportsByGroup = sportsData?.reduce((groups: Record<string, Sport[]>, sport) => {
    if (!groups[sport.group]) {
      groups[sport.group] = [];
    }
    groups[sport.group].push(sport);
    return groups;
  }, {}) || {};
  
  // Extract unique sport groups for the categories
  const sportGroups = Object.keys(sportsByGroup).slice(0, 8);
  
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
  
  // Filter events for display
  const filteredEvents = displayEvents?.slice(0, 10) || [];
  
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
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
          
          {/* Left column - Events and betting options */}
          <div className="flex-1">
            {/* Featured Events */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {featuredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="rounded-lg overflow-hidden" 
                  style={{ background: `${event.backgroundColor}` }}
                >
                  <div className="p-4 h-[150px] relative flex flex-col justify-between">
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
                      <div className="w-24 h-24 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Links */}
            <div className="flex items-center space-x-2 mb-6 overflow-x-auto py-2">
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                <Star className="h-4 w-4 mr-1 text-[#f8c541]" />
                {t('sports.favorites')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {t('sports.live')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                {t('sports.today')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                {t('sports.tomorrow')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                {t('sports.soccer')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                {t('sports.basketball')}
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                {t('sports.tennis')}
              </Button>
            </div>
            
            {/* Sports Categories */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">{t('sports.topSports')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                {sportsCategories.map((sport, index) => (
                  <div 
                    key={index} 
                    className="bg-[#192531] rounded-lg overflow-hidden aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-[#1c2b3a] transition-colors"
                    style={{ 
                      background: `linear-gradient(to bottom, ${sport.color}33, #192531)`,
                      borderTop: `3px solid ${sport.color}`
                    }}
                  >
                    <div className="w-14 h-14 bg-[#1c2b3a] rounded-full flex items-center justify-center mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold">{sport.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Upcoming Events Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('sports.upcomingEvents')}</h2>
                <Link href="#">
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
                    <span>Error loading events. Please try again later.</span>
                  </div>
                </Card>
              )}
              
              {/* Events display */}
              {!eventsLoading && !eventsError && (
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