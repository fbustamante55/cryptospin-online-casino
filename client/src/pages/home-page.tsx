import { GameCard } from "@/components/ui/game-card";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { UserDropdown } from "@/components/ui/user-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search, Gift, Bell, ChevronDown, ChevronUp, Settings, Trophy, Dices, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  
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
                <button className="flex items-center px-5 py-1.5 bg-[#f8c541] hover:bg-[#f9d252] text-[#0e1824] font-bold text-sm transition-all duration-200">
                  Depositar
                </button>
              </div>
              
              {/* Menú desplegable de selección de moneda */}
              {isWalletOpen && (
                <div className="absolute top-12 bg-[#0e1824] border border-[#1c2b3a] rounded-lg shadow-lg w-60 z-50">
                  {/* Buscador */}
                  <div className="p-3 border-b border-[#1c2b3a]">
                    <div className="flex items-center bg-[#192531] rounded-md px-3 py-2">
                      <Search className="h-4 w-4 text-gray-400 mr-2" />
                      <input 
                        className="bg-transparent text-white text-sm w-full focus:outline-none" 
                        placeholder="Buscar Divisas" 
                        type="text"
                      />
                    </div>
                  </div>
                  
                  {/* Lista de monedas */}
                  <div className="max-h-60 overflow-y-auto">
                    {currencies.map((currency) => (
                      <div 
                        key={currency.code} 
                        className={`flex items-center justify-between p-3 hover:bg-[#192531] cursor-pointer ${currency.code === selectedCurrency ? 'bg-[#192531]' : ''}`}
                        onClick={() => {
                          setSelectedCurrency(currency.code);
                          setIsWalletOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3`} style={{ backgroundColor: currency.color }}>
                            <span className="text-white text-xs font-bold">{currency.icon}</span>
                          </div>
                          <div className="text-white text-sm">{currency.code}</div>
                        </div>
                        <div className="text-white text-sm">{currency.value.toFixed(8)}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="p-3 border-t border-[#1c2b3a]">
                    <div className="flex items-center text-[#09b66d] hover:text-[#0fda85] text-sm cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Configuración de Monedero</span>
                    </div>
                  </div>
                </div>
              )}
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
