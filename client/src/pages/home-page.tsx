import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { GameCard } from "@/components/ui/game-card";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Plus, Coins, Bell } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  const featuredGames = [
    {
      title: "Moon Crash",
      description: "Cash out before the crash! Multipliers can go to the moon in this thrilling game.",
      image: "/crash.jpg",
      tag: { text: "Hot", color: "tertiary" as const },
      rating: 4.9,
      gameType: "crash" as const
    },
    {
      title: "Crypto Crash Pro",
      description: "Our premium version with higher multipliers and better odds. Test your timing!",
      image: "/crash.jpg",
      tag: { text: "Premium", color: "primary" as const },
      rating: 4.8,
      gameType: "crash" as const
    },
    {
      title: "Space Crash",
      description: "Space-themed crash game with unique visuals and special bonuses on consecutive wins.",
      image: "/crash.jpg",
      tag: { text: "New", color: "secondary" as const },
      rating: 4.7,
      gameType: "crash" as const
    }
  ];

  const popularGames = [
    { title: "Moon Crash", type: "Crash", players: 315, gameType: "crash" as const },
    { title: "Crypto Crash Pro", type: "Crash", players: 278, gameType: "crash" as const },
    { title: "Space Crash", type: "Crash", players: 246, gameType: "crash" as const },
    { title: "Rocket Crash", type: "Crash", players: 205, gameType: "crash" as const },
    { title: "Neon Crash", type: "Crash", players: 184, gameType: "crash" as const }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0e1824] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only visible on desktop */}
        <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10 hidden md:block">
          <div className="flex items-center justify-between h-16 px-4">
            
            <div className="hidden md:flex flex-1 px-4">
              <div className="max-w-md w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-[#192531] border border-[#1c2b3a] text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#09b66d] focus:border-[#09b66d]" 
                    placeholder="Search games..."
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
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#192531] to-[#0e1824] mb-8">
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="font-heading text-xl md:text-3xl font-bold text-white mb-2">Welcome to <span className="text-[#09b66d]">CryptoSpin</span></h2>
                <p className="text-gray-300 max-w-lg mb-4">Experience the thrill of crypto casino gaming with our selection of exciting games. Play responsibly!</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/crash">
                    <button className="px-4 py-2 bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium rounded-md transition-all duration-200">
                      Start Playing
                    </button>
                  </Link>
                  <button className="px-4 py-2 bg-[#313d4a] hover:bg-[#2a3441] text-white font-medium rounded-md transition-all duration-200">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full">
                <div className="w-full h-full opacity-25 bg-gradient-to-l from-[#09b66d]/30 to-transparent"></div>
                <svg 
                  className="absolute top-1/2 right-16 transform -translate-y-1/2 opacity-30" 
                  width="200" 
                  height="200" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="100" cy="100" r="80" stroke="#09b66d" strokeWidth="4" />
                  <path d="M100 20 L100 180" stroke="#09b66d" strokeWidth="4" strokeDasharray="10 10" />
                  <path d="M20 100 L180 100" stroke="#09b66d" strokeWidth="4" strokeDasharray="10 10" />
                  <circle cx="100" cy="100" r="40" stroke="#fff" strokeWidth="4" fill="#0e1824" />
                  <path d="M70 100 L130 100 M100 70 L100 130" stroke="#fff" strokeWidth="4" />
                </svg>
              </div>
            </div>
            
            {/* Featured Games */}
            <div className="mb-8">
              <h2 className="font-heading text-xl font-bold text-white mb-4">Featured Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredGames.map((game, index) => (
                  <GameCard key={index} {...game} />
                ))}
              </div>
            </div>
            
            {/* Popular Games */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-heading text-xl font-bold text-white">Popular Games</h2>
                <a href="#" className="text-[#09b66d] hover:text-[#0fda85] text-sm font-medium">View All</a>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {popularGames.map((game, index) => (
                  <Link key={index} href={`/${game.gameType}`}>
                    <div className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30 transition-all duration-300 cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-full h-full opacity-70"
                          viewBox="0 0 200 200"
                          style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
                        >
                          {/* All items will show crash graphic in our new design */}
                          <rect x="50" y="50" width="100" height="100" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2"/>
                          <path d="M70,130 Q90,80 110,110 T150,70" stroke="#09b66d" strokeWidth="3" fill="none"/>
                          <circle cx="150" cy="70" r="4" fill="#09b66d"/>
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1824] to-transparent"></div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-heading font-medium text-white text-sm">{game.title}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-400">{game.type}</span>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">{game.players}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
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
