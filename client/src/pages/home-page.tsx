import { GameCard } from "@/components/ui/game-card";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Gift, Bell, ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

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
    <>
      {/* Header - Only visible on desktop */}
      <header className="bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-10 hidden md:block">
        <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          
          {/* Left area with navigation */}
          <div className="flex items-center space-x-6">
            <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            
            <Link href="/sports-betting">
              <span className="text-white hover:text-[#09b66d] text-sm font-medium transition-all duration-200">Deportes</span>
            </Link>
            
            <Link href="/">
              <span className="text-white hover:text-[#09b66d] text-sm font-medium transition-all duration-200">Casino</span>
            </Link>
          </div>
          
          {/* Center area with logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#09b66d] to-[#f8c541] text-transparent bg-clip-text font-['Montserrat']">CRYPTOSPIN</h1>
          </div>
          
          {/* Right area with balance and actions */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col bg-[#192531] border border-[#1c2b3a] rounded-md px-3 py-2 mr-3 min-w-[160px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">USD</span>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></div>
                  <span className="text-white text-sm font-medium">${user?.balance || '0.00'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 mr-1">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#f7931a]">
                      <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="currentColor"/>
                      <path d="M22.5782 14.0388C22.9343 11.9404 21.3427 10.8312 19.1464 10.0939L19.8511 7.45592L18.214 7.0481L17.5274 9.60958C17.1197 9.50227 16.7011 9.40006 16.2849 9.29881L16.9773 6.71766L15.3411 6.31006L14.6361 8.94708C14.2959 8.86481 13.9613 8.78327 13.6359 8.69708L13.6371 8.69076L11.4188 8.12288L10.9848 9.85061C10.9848 9.85061 12.1947 10.1099 12.1631 10.1297C12.8439 10.2973 12.9621 10.7512 12.9387 11.1168L12.1367 14.1034C12.1894 14.1164 12.2567 14.136 12.3267 14.1673C12.2684 14.1535 12.2071 14.1383 12.1443 14.1238L11.0105 18.3108C10.9331 18.5279 10.7302 18.859 10.2543 18.7431C10.2758 18.7701 9.07552 18.4693 9.07552 18.4693L8.26001 20.3364L10.3563 20.8776C10.7328 20.9766 11.1021 21.0804 11.4644 21.1789L10.7507 23.8526L12.3864 24.2608L13.0914 21.6245C13.5173 21.7455 13.931 21.8568 14.3366 21.9625L13.6344 24.5843L15.2715 24.9927L15.9852 22.3244C18.8915 22.8906 21.0638 22.6642 21.9919 20.0375C22.748 17.9314 21.9812 16.8413 20.5111 16.1307C21.5449 15.8971 22.3241 15.2679 22.5782 14.0388ZM18.9478 19.0625C18.4168 21.17 15.1134 20.1152 14.025 19.8305L14.9714 16.2688C16.0598 16.5548 19.5004 16.8763 18.9478 19.0625ZM19.4789 14.0089C18.9957 15.9338 16.2483 15.0291 15.3443 14.7915L16.2056 11.5654C17.1096 11.803 19.9804 12.0081 19.4789 14.0089Z" fill="white"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-400">BTC</span>
                </div>
                <span className="text-white text-sm font-medium">0.052</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center">
                  <div className="h-3 w-3 mr-1">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#627eea]">
                      <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="currentColor"/>
                      <path d="M16.498 4V12.87L23.995 16.22L16.498 4Z" fill="white" fillOpacity="0.602"/>
                      <path d="M16.498 4L9 16.22L16.498 12.87V4Z" fill="white"/>
                      <path d="M16.498 21.968V27.995L24 17.616L16.498 21.968Z" fill="white" fillOpacity="0.602"/>
                      <path d="M16.498 27.995V21.967L9 17.616L16.498 27.995Z" fill="white"/>
                      <path d="M16.498 20.573L23.995 16.22L16.498 12.872V20.573Z" fill="white" fillOpacity="0.2"/>
                      <path d="M9 16.22L16.498 20.573V12.872L9 16.22Z" fill="white" fillOpacity="0.602"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-400">ETH</span>
                </div>
                <span className="text-white text-sm font-medium">0.847</span>
              </div>
            </div>
            
            <button className="flex items-center px-4 py-2 rounded-md bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium text-sm transition-all duration-200 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-1.5" />
              {t('buttons.deposit')}
            </button>
            
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
      
      {/* Main Content - Add top padding on mobile for the mobile header */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#192531] to-[#0e1824] mb-8">
            <div className="relative z-10 p-6 md:p-8">
              <h2 className="font-heading text-xl md:text-3xl font-bold text-white mb-2">{t('home.welcome')} <span className="text-[#09b66d]">CryptoSpin</span></h2>
              <p className="text-gray-300 max-w-lg mb-4">{t('home.welcomeDescription')}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/crash">
                  <button className="px-4 py-2 bg-[#09b66d] hover:bg-[#0fda85] text-white font-medium rounded-md transition-all duration-200">
                    {t('buttons.startPlaying')}
                  </button>
                </Link>
                <button className="px-4 py-2 bg-[#313d4a] hover:bg-[#2a3441] text-white font-medium rounded-md transition-all duration-200">
                  {t('buttons.learnMore')}
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
            <h2 className="font-heading text-xl font-bold text-white mb-4">{t('home.featuredGames')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredGames.map((game, index) => (
                <GameCard key={index} {...game} />
              ))}
            </div>
          </div>
          
          {/* Popular Games */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl font-bold text-white">{t('home.popularGames')}</h2>
              <a href="#" className="text-[#09b66d] hover:text-[#0fda85] text-sm font-medium">{t('buttons.viewAll')}</a>
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
    </>
  );
}
