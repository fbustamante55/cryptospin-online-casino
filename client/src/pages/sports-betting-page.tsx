import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Plus, Coins, Bell, Star, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SportsBettingPage() {
  const { user } = useAuth();
  
  const featuredEvents = [
    {
      id: 1,
      title: "De la NBA",
      subtitle: "Todas las partidas",
      action: "Transmisión",
      image: "/src/assets/nba.png",
      backgroundColor: "#007749",
      buttonColor: "bg-[#007749]"
    },
    {
      id: 2,
      title: "Pago en el 3er Q",
      subtitle: "Seguro para los malos inicios",
      action: "Ver Partidos",
      image: "/src/assets/basketball.png",
      backgroundColor: "#333966",
      buttonColor: "bg-[#333966]"
    },
    {
      id: 3,
      title: "Premier League",
      subtitle: "Paga por 3 goles",
      action: "Apuestas Ahora",
      image: "/src/assets/premier.png",
      backgroundColor: "#114f7a",
      buttonColor: "bg-[#114f7a]"
    }
  ];
  
  const sportsCategories = [
    { name: "SOCCER", icon: "/src/assets/soccer.png", color: "#1e88e5" },
    { name: "BASKETBALL", icon: "/src/assets/basketball.png", color: "#d32f2f" },
    { name: "TENNIS", icon: "/src/assets/tennis.png", color: "#ff9800" },
    { name: "MMA", icon: "/src/assets/mma.png", color: "#4caf50" },
    { name: "BASEBALL", icon: "/src/assets/baseball.png", color: "#ff5722" },
    { name: "ICE HOCKEY", icon: "/src/assets/hockey.png", color: "#03a9f4" },
    { name: "TABLE TENNIS", icon: "/src/assets/table-tennis.png", color: "#9c27b0" },
    { name: "VOLLEYBALL", icon: "/src/assets/volleyball.png", color: "#3949ab" }
  ];
  
  const liveEvents = [
    {
      id: 1,
      league: "Premier League",
      team1: "Manchester United",
      team2: "Liverpool",
      time: "32:15",
      score: "1-2",
      odds: {
        team1: 4.50,
        draw: 3.25,
        team2: 1.72
      }
    },
    {
      id: 2,
      league: "NBA",
      team1: "Boston Celtics",
      team2: "LA Lakers",
      time: "Q3 - 05:40",
      score: "78-72",
      odds: {
        team1: 1.45,
        team2: 2.70
      }
    },
    {
      id: 3,
      league: "ATP Miami",
      team1: "Rafael Nadal",
      team2: "Novak Djokovic",
      time: "Set 2",
      score: "6-4, 3-2",
      odds: {
        team1: 2.20,
        team2: 1.65
      }
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
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
                    placeholder="Buscar eventos..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-1.5 rounded-md bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium text-sm transition-all duration-200">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Deposit</span>
              </button>
              
              <div className="px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
              
              <NotificationDropdown />
              
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        
        {/* Main Content - Add top padding on mobile for the mobile header */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
          <div className="max-w-7xl mx-auto">
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
                    
                    {/* Image placeholder - in a real app you'd use a real image */}
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
                Favoritos
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                En Vivo
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                Hoy
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                Mañana
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                Fútbol
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                Baloncesto
              </Button>
              <Button variant="outline" size="sm" className="bg-[#192531] border-[#1c2b3a] text-white">
                Tenis
              </Button>
            </div>
            
            {/* Sports Categories */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Mejores Deportes</h2>
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
                      {/* This would be an actual image in a real app */}
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold">{sport.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Live Events Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Eventos en Vivo</h2>
                <Link href="#">
                  <span className="text-[#09b66d] text-sm font-medium flex items-center">
                    Ver Todo <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
              
              <div className="space-y-4">
                {liveEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="bg-[#192531] border-[#1c2b3a] p-4 hover:border-[#1c2b3a]/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">{event.league}</span>
                      <div className="flex items-center">
                        <span className="text-xs bg-[#e64d6b] text-white px-1.5 py-0.5 rounded">
                          LIVE
                        </span>
                        <span className="ml-2 text-xs text-white">{event.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{event.team1}</div>
                        <div className="text-sm font-medium">{event.team2}</div>
                      </div>
                      
                      <div className="mx-4 text-center">
                        <div className="text-lg font-bold text-white">{event.score}</div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-[#282e39] hover:bg-[#313d4a] rounded text-sm font-bold">
                          {event.odds.team1}
                        </button>
                        {event.odds.draw && (
                          <button className="px-3 py-1 bg-[#282e39] hover:bg-[#313d4a] rounded text-sm font-bold">
                            {event.odds.draw}
                          </button>
                        )}
                        <button className="px-3 py-1 bg-[#282e39] hover:bg-[#313d4a] rounded text-sm font-bold">
                          {event.odds.team2}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <button className="text-xs text-[#09b66d] font-medium">+125 mercados</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}