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
      title: "Neon Slots",
      description: "Spin the neon reels and win big with our most popular slot game!",
      image: "/slots.jpg",
      tag: { text: "Popular", color: "secondary" as const },
      rating: 4.8,
      gameType: "slots" as const
    },
    {
      title: "Crypto Dice",
      description: "Roll the dice and test your luck with our provably fair crypto dice game!",
      image: "/dice.jpg",
      tag: { text: "New", color: "primary" as const },
      rating: 4.6,
      gameType: "dice" as const
    },
    {
      title: "Moon Crash",
      description: "Cash out before the crash! Multipliers can go to the moon in this thrilling game.",
      image: "/crash.jpg",
      tag: { text: "Hot", color: "tertiary" as const },
      rating: 4.9,
      gameType: "crash" as const
    }
  ];

  const popularGames = [
    { title: "Jackpot Gems", type: "Slots", players: 234, gameType: "slots" as const },
    { title: "Lucky Dice", type: "Dice", players: 189, gameType: "dice" as const },
    { title: "Crypto Crash", type: "Crash", players: 315, gameType: "crash" as const },
    { title: "Neon Roulette", type: "Table", players: 142, gameType: "slots" as const },
    { title: "Cyber Blackjack", type: "Card", players: 98, gameType: "dice" as const }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F1923] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F1923] border-b border-gray-800 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
                <span className="text-[#00FFAA]">Crypto</span>Spin
              </h1>
            </div>
            
            <div className="hidden md:flex flex-1 px-4">
              <div className="max-w-md w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2 rounded-lg bg-[#1A2634] border border-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00FFAA] focus:border-[#00FFAA]" 
                    placeholder="Search games..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 text-[#0F1923] font-medium text-sm hover:from-[#33FFBB] hover:to-[#00FFAA] transition-all duration-200">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Deposit</span>
              </button>
              
              <div className="px-3 py-1.5 rounded-full bg-[#1A2634] border border-gray-700 flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
              
              <NotificationDropdown />
              
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1A2634] to-[#0F1923] mb-8">
              <div className="relative z-10 p-6 md:p-8">
                <h2 className="font-heading text-xl md:text-3xl font-bold text-white mb-2">Welcome to <span className="text-[#00FFAA]">CryptoSpin</span></h2>
                <p className="text-gray-300 max-w-lg mb-4">Experience the thrill of crypto casino gaming with our selection of exciting games. Play responsibly!</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/slots">
                    <button className="px-4 py-2 bg-[#00FFAA] hover:bg-[#33FFBB] text-[#0F1923] font-medium rounded-lg transition-all duration-200">
                      Start Playing
                    </button>
                  </Link>
                  <button className="px-4 py-2 bg-[#0F1923]/50 hover:bg-[#0F1923] text-white font-medium rounded-lg border border-gray-700 transition-all duration-200">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="hidden md:block absolute top-0 right-0 w-1/3 h-full">
                <div className="w-full h-full opacity-25 bg-gradient-to-l from-[#00FFAA]/30 to-transparent"></div>
                <svg 
                  className="absolute top-1/2 right-16 transform -translate-y-1/2 opacity-30" 
                  width="200" 
                  height="200" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="100" cy="100" r="80" stroke="#00FFAA" strokeWidth="4" />
                  <path d="M100 20 L100 180" stroke="#00FFAA" strokeWidth="4" strokeDasharray="10 10" />
                  <path d="M20 100 L180 100" stroke="#00FFAA" strokeWidth="4" strokeDasharray="10 10" />
                  <circle cx="100" cy="100" r="40" stroke="#FF3E8F" strokeWidth="4" fill="#0F1923" />
                  <path d="M70 100 L130 100 M100 70 L100 130" stroke="#FF3E8F" strokeWidth="4" />
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
                <a href="#" className="text-[#00FFAA] hover:text-[#33FFBB] text-sm font-medium">View All</a>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {popularGames.map((game, index) => (
                  <Link key={index} href={`/${game.gameType}`}>
                    <div className="rounded-lg overflow-hidden bg-[#1A2634] border border-gray-800 hover:border-[#00FFAA]/30 transition-all duration-300 cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-[#1A2634] to-[#0F1923] relative overflow-hidden">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-full h-full opacity-70"
                          viewBox="0 0 200 200"
                          style={{ background: 'linear-gradient(135deg, #1A2634 0%, #0F1923 100%)' }}
                        >
                          {game.type === "Slots" && (
                            <>
                              <rect x="50" y="50" width="100" height="100" rx="10" fill="#0F1923" stroke="#333" strokeWidth="2"/>
                              <circle cx="75" cy="100" r="15" fill="#00FFAA" opacity="0.8"/>
                              <circle cx="100" cy="100" r="15" fill="#FF3E8F" opacity="0.8"/>
                              <circle cx="125" cy="100" r="15" fill="#F9C846" opacity="0.8"/>
                            </>
                          )}
                          {game.type === "Dice" && (
                            <>
                              <rect x="60" y="60" width="80" height="80" rx="10" fill="#0F1923" stroke="#333" strokeWidth="2"/>
                              <circle cx="75" cy="75" r="5" fill="#fff"/>
                              <circle cx="100" cy="100" r="5" fill="#fff"/>
                              <circle cx="125" cy="125" r="5" fill="#fff"/>
                              <circle cx="75" cy="125" r="5" fill="#fff"/>
                              <circle cx="125" cy="75" r="5" fill="#fff"/>
                            </>
                          )}
                          {game.type === "Crash" && (
                            <>
                              <rect x="50" y="50" width="100" height="100" rx="5" fill="#0F1923" stroke="#333" strokeWidth="2"/>
                              <path d="M70,130 Q90,80 110,110 T150,70" stroke="#00FFAA" strokeWidth="3" fill="none"/>
                              <circle cx="150" cy="70" r="4" fill="#00FFAA"/>
                            </>
                          )}
                          {game.type === "Table" && (
                            <>
                              <rect x="50" y="70" width="100" height="60" rx="5" fill="#0F1923" stroke="#333" strokeWidth="2"/>
                              <circle cx="70" cy="100" r="10" fill="#F9C846" opacity="0.8"/>
                              <circle cx="100" cy="100" r="10" fill="#FF3E8F" opacity="0.8"/>
                              <circle cx="130" cy="100" r="10" fill="#00FFAA" opacity="0.8"/>
                            </>
                          )}
                          {game.type === "Card" && (
                            <>
                              <rect x="70" y="60" width="40" height="60" rx="3" fill="#0F1923" stroke="#fff" strokeWidth="1"/>
                              <rect x="90" y="80" width="40" height="60" rx="3" fill="#0F1923" stroke="#fff" strokeWidth="1"/>
                              <text x="80" y="85" fill="#FF3E8F" fontSize="12">A♥</text>
                              <text x="130" y="135" fill="#00FFAA" fontSize="12">K♠</text>
                            </>
                          )}
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] to-transparent"></div>
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
