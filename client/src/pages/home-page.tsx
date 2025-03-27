import { GameCard } from "@/components/ui/game-card";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search, Gift, Bell, ChevronDown, ChevronUp, Settings, Trophy, Dices, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { CurrencyDropdown } from "@/components/ui/currency-dropdown";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { SlotopolCasinoGamesSection } from "@/components/slots/slotopol-casino-games-section";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  
  // Lista de criptomonedas disponibles con su valor (todos a 0)
  const currencies = [
    { code: 'BTC', name: 'Bitcoin', value: 0.00000000, icon: '₿', color: '#f7931a' },
    { code: 'ETH', name: 'Ethereum', value: 0.00000000, icon: 'Ξ', color: '#627eea' },
    { code: 'LTC', name: 'Litecoin', value: 0.00000000, icon: 'Ł', color: '#b8b8b8' },
    { code: 'USDT', name: 'Tether', value: 0.00000000, icon: '₮', color: '#26a17b' },
    { code: 'SOL', name: 'Solana', value: 0.00000000, icon: '◎', color: '#00ffbd' },
    { code: 'DOGE', name: 'Dogecoin', value: 0.00000000, icon: 'Ð', color: '#c2a633' },
    { code: 'BCH', name: 'Bitcoin Cash', value: 0.00000000, icon: '₿', color: '#8dc351' },
    { code: 'XRP', name: 'Ripple', value: 0.00000000, icon: '✕', color: '#23292f' },
    { code: 'TRX', name: 'TRON', value: 0.00000000, icon: '♦', color: '#ef0027' },
    { code: 'EOS', name: 'EOS', value: 0.00000000, icon: 'ε', color: '#000000' }
  ];
  
  // Obtener la moneda seleccionada
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[3]; // USDT por defecto

  const featuredGames = [
    {
      title: t("games.crash_title"),
      description: t("games.crash_description"),
      image: "/images/games/crash.webp",
      tag: { text: "Hot", color: "tertiary" as const },
      rating: 4.9,
      gameType: "crash" as const
    },
    {
      title: t("games.slots_book_of_egypt_title"),
      description: t("games.slots_book_of_egypt_description"),
      image: "/images/games/book-of-egypt.webp",
      tag: { text: "HOT", color: "primary" as const },
      rating: 4.9,
      gameType: "slots" as const,
      gameId: "book-of-egypt"
    },
    {
      title: t("games.keno_title"),
      description: t("games.keno_description"),
      image: "/images/games/keno.webp",
      tag: { text: "Nuevo", color: "secondary" as const },
      rating: 4.5,
      gameType: "keno" as const
    }
  ];

  const popularGames = [
    { title: t("games.crash_title"), type: t("games.crash"), players: 315, gameType: "crash" as const },
    { title: t("games.slots_50gems_title"), type: t("games.slots"), players: 301, gameType: "slots" as const, gameId: "50gems" },
    { title: t("games.keno_title"), type: t("games.keno"), players: 298, gameType: "keno" as const },
    { title: t("games.slots_777_title"), type: t("games.slots"), players: 265, gameType: "slots" as const, gameId: "777" },
    { title: t("games.slots_book_of_egypt_title"), type: t("games.slots"), players: 243, gameType: "slots" as const, gameId: "book-of-egypt" }
  ];

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
              
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/50 transition-all duration-200">
                <NotificationDropdown />
              </div>
              
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
          
          {/* Casino Slots from Slotopol */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl font-bold text-white">CryptoSpin Originals</h2>
              <Link href="/slots" className="text-[#09b66d] hover:text-[#0fda85] text-sm font-medium">{t('buttons.viewAll')}</Link>
            </div>
            
            <SlotopolCasinoGamesSection />
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
                <Link key={index} href={game.gameType === "slots" && game.gameId ? `/${game.gameType}/${game.gameId}` : `/${game.gameType}`}>
                  <div className="rounded-lg overflow-hidden bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/30 transition-all duration-300 cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-[#192531] to-[#0e1824] relative overflow-hidden">
                      {game.gameType === "keno" ? (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-full h-full opacity-70"
                          viewBox="0 0 200 200"
                          style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
                        >
                          {/* Keno graphic */}
                          <rect x="40" y="40" width="120" height="120" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2"/>
                          <circle cx="70" cy="70" r="12" fill="#09b66d" opacity="0.9" />
                          <circle cx="100" cy="70" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="130" cy="70" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="70" cy="100" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="100" cy="100" r="12" fill="#09b66d" opacity="0.9" />
                          <circle cx="130" cy="100" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="70" cy="130" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="100" cy="130" r="12" fill="#1c2b3a" opacity="0.5" />
                          <circle cx="130" cy="130" r="12" fill="#09b66d" opacity="0.9" />
                        </svg>
                      ) : game.gameType === "crash" ? (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-full h-full opacity-70"
                          viewBox="0 0 200 200"
                          style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
                        >
                          {/* Crash graphic */}
                          <rect x="50" y="50" width="100" height="100" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2"/>
                          <path d="M70,130 Q90,80 110,110 T150,70" stroke="#09b66d" strokeWidth="3" fill="none"/>
                          <circle cx="150" cy="70" r="4" fill="#09b66d"/>
                        </svg>
                      ) : (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-full h-full opacity-70"
                          viewBox="0 0 200 200"
                          style={{ background: 'linear-gradient(135deg, #192531 0%, #0e1824 100%)' }}
                        >
                          {/* Slots graphic */}
                          <rect x="40" y="50" width="120" height="100" rx="5" fill="#0e1824" stroke="#1c2b3a" strokeWidth="2"/>
                          {/* Slots reels */}
                          <rect x="50" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                          <rect x="85" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                          <rect x="120" y="60" width="30" height="80" fill="#192531" stroke="#1c2b3a" strokeWidth="1"/>
                          {/* Slots symbols */}
                          <circle cx="65" cy="75" r="10" fill="#f9c846" />
                          <text x="65" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">7</text>
                          <circle cx="100" cy="75" r="10" fill="#09b66d" />
                          <text x="100" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">$</text>
                          <circle cx="135" cy="75" r="10" fill="#f95258" />
                          <text x="135" y="79" textAnchor="middle" fontSize="14" fill="#0e1824" fontWeight="bold">♦</text>
                          {/* Lever */}
                          <rect x="165" y="60" width="5" height="40" fill="#09b66d" />
                          <circle cx="167.5" cy="110" r="10" fill="#f9c846" />
                        </svg>
                      )}
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
