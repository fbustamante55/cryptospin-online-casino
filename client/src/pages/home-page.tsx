import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search, Gift, Bell, ChevronDown, Sparkles, Clock, TrendingUp, Star } from "lucide-react";
// Importar el icono ChevronDown como SVG por si hay problemas con lucide-react
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { CurrencyDropdown } from "@/components/ui/currency-dropdown";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { LiveActivityTable } from "@/components/ui/live-activity-table";
import { DepositModal } from "@/components/ui/deposit-modal";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [activeGameCategory, setActiveGameCategory] = useState("all");
  
  // Obtener los juegos favoritos del usuario
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user
  });
  
  // Obtener las últimas actividades del usuario (juegos recientes)
  const { data: recentActivities, isLoading: isLoadingRecentActivities } = useQuery({
    queryKey: ["/api/user/activities"],
    queryFn: async () => {
      // Solo intentar obtener actividades si el usuario está autenticado
      if (!user) return { activities: [] };
      
      const res = await fetch("/api/user/activities?limit=5&type=wallet_bet");
      if (!res.ok) {
        throw new Error("Failed to fetch recent activities");
      }
      return res.json();
    },
    enabled: !!user
  });
  
  // Función para obtener juegos recientes del usuario
  const getRecentGames = () => {
    if (!recentActivities || !recentActivities.activities) return [];
    
    // Filtrar actividades de tipo wallet_bet y extraer nombres de juego únicos
    const gameSet = new Set<string>();
    const games: Array<{name: string, timestamp: Date | string}> = [];
    
    if (recentActivities.activities && Array.isArray(recentActivities.activities)) {
      recentActivities.activities.forEach((activity: any) => {
        if (activity.gameType && !gameSet.has(activity.gameType)) {
          gameSet.add(activity.gameType);
          games.push({
            name: activity.gameType,
            timestamp: activity.timestamp
          });
        }
      });
    }
    
    return games.slice(0, 5); // Retornar máximo 5 juegos
  };
  
  return (
    <>
      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0e1824]">
        <div className="max-w-7xl mx-auto">
        
          {/* Mensaje de bienvenida personalizado */}
          {user && (
            <div className="mb-6 p-4 bg-[#1A2634] rounded-xl border border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">¡Bienvenido, {user.username}!</h2>
                  <p className="text-gray-400 mt-1">Tu balance actual: <span className="text-[#09b66d] font-bold">{user.balance} créditos</span></p>
                </div>
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-[#09b66d] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#09b66d]/90 transition-colors"
                >
                  Depositar
                </button>
              </div>
            </div>
          )}
          {/* Banner promocional con carrusel */}
          <div className="rounded-xl overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promoción 1 */}
              <div className="bg-gradient-to-r from-[#1d1a42] to-[#2d2166] p-4 rounded-xl relative overflow-hidden border border-[#3d3180] transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
                <div className="bg-[#FF51FF]/10 absolute top-0 left-0 w-full h-full rounded-xl"></div>
                <div className="flex items-start justify-between">
                  <div className="z-10">
                    <span className="bg-[#FF51FF]/30 text-white text-xs py-1 px-2 rounded-md">PATROCINADO</span>
                    <h3 className="text-white font-bold text-2xl mt-2">FSP</h3>
                    <p className="text-gray-300 text-sm mb-4">Nuevo Studio Original<br/>Live mix.</p>
                    <button className="text-xs bg-white text-[#2d2166] font-semibold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all">
                      Jugar Ahora
                    </button>
                  </div>
                  <div className="flex items-center h-full">
                    <div className="h-20 w-20 relative">
                      <div className="absolute w-16 h-16 rounded-full bg-[#FF51FF] opacity-50 blur-md"></div>
                      <div className="absolute w-16 h-16 rounded-full bg-[#51BDFF] opacity-50 blur-md transform translate-x-4 translate-y-4"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white rounded-full shadow-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promoción 2 */}
              <div className="bg-gradient-to-r from-[#1a2238] to-[#273559] p-4 rounded-xl relative overflow-hidden border border-[#2f4275] transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
                <div className="bg-[#51BDFF]/10 absolute top-0 left-0 w-full h-full rounded-xl"></div>
                <div className="flex items-start justify-between">
                  <div className="z-10">
                    <span className="bg-[#51BDFF]/30 text-white text-xs py-1 px-2 rounded-md">PROMOCIÓN</span>
                    <h3 className="text-white font-bold text-2xl mt-2">Sorteo de</h3>
                    <h4 className="text-[#51BDFF] font-bold text-xl">$75,000</h4>
                    <p className="text-gray-300 text-xs mb-4">Todos Los Sábados en Stake Live mix.</p>
                    <button className="text-xs bg-[#51BDFF] text-[#1a2238] font-semibold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all">
                      Más Información
                    </button>
                  </div>
                  <div className="h-24 w-24 relative">
                    <img src="/images/money-stack.webp" alt="Money stack" className="h-full w-full object-contain" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTIyMzgiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPkJpbGxldGVzPC90ZXh0Pjwvc3ZnPg==';
                    }} />
                  </div>
                </div>
              </div>

              {/* Promoción 3 */}
              <div className="bg-gradient-to-r from-[#1a2836] to-[#0e1824] p-4 rounded-xl relative overflow-hidden border border-[#2c3c4a] transition-transform duration-300 hover:scale-[1.02] cursor-pointer">
                <div className="bg-[#FFD700]/10 absolute top-0 left-0 w-full h-full rounded-xl"></div>
                <div className="flex items-start justify-between">
                  <div className="z-10">
                    <span className="bg-[#FFD700]/30 text-white text-xs py-1 px-2 rounded-md">PROMOCIÓN</span>
                    <h3 className="text-white font-bold text-2xl mt-2">Completa el</h3>
                    <h4 className="text-[#FFD700] font-bold text-xl">Casino</h4>
                    <p className="text-gray-300 text-xs mb-4">$5,000 En Premios<br/>Live mix.</p>
                    <button className="text-xs bg-[#FFD700] text-[#1a2836] font-semibold py-2 px-4 rounded-md hover:bg-opacity-90 transition-all">
                      Jugar Ahora
                    </button>
                  </div>
                  <div className="h-24 w-24 relative">
                    <img src="/images/crown.webp" alt="Crown" className="h-full w-full object-contain" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxYTI4MzYiLz48cGF0aCBkPSJNMjUgNzAgTDUwIDMwIDc1IDcwIDI1IDcwIiBmaWxsPSIjRkZENzAwIi8+PHBhdGggZD0iTTQwIDcwIEw1MCA1MCA2MCA3MCBMNDAgNzAiIGZpbGw9IiMxYTI4MzYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjI1IiByPSI1IiBmaWxsPSIjRkZENzAwIi8+PGNpcmNsZSBjeD0iMjUiIGN5PSI2MCIgcj0iNSIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjUiIGZpbGw9IiNGRkQ3MDAiLz48L3N2Zz4=';
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Busca tu juego..."
              className="w-full bg-[#192531] border border-[#1c2b3a] text-gray-300 py-3 px-5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#09b66d]/50 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Tabs para categorías */}
          <div className="mb-8">
            <Tabs defaultValue="all" onValueChange={setActiveGameCategory}>
              <TabsList className="bg-[#192531] border border-[#1c2b3a] w-full h-auto flex flex-wrap md:flex-nowrap overflow-x-auto hide-scrollbar">
                <TabsTrigger 
                  value="all" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span>Lobby</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="originals" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Originales</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="slots" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Slots</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="live" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Casino en Vivo</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="tv" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <span>Concursos de TV</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="exclusive" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <span>Exclusivos</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="new" 
                  className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Lanzamientos</span>
                </TabsTrigger>
                
                {user && (
                  <TabsTrigger 
                    value="favorites" 
                    className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                  >
                    <Star className="w-4 h-4" />
                    <span>Favoritos</span>
                  </TabsTrigger>
                )}
                
                {user && (
                  <TabsTrigger 
                    value="recent" 
                    className="flex items-center gap-2 data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Recientes</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Área de juegos para la categoría seleccionada */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-white text-xl font-bold">
                  {activeGameCategory === 'all' && 'Juegos Populares'}
                  {activeGameCategory === 'originals' && 'Originales'}
                  {activeGameCategory === 'slots' && 'Slots'}
                  {activeGameCategory === 'live' && 'Casino en Vivo'}
                  {activeGameCategory === 'tv' && 'Concursos de TV'}
                  {activeGameCategory === 'exclusive' && 'Exclusivos'}
                  {activeGameCategory === 'new' && 'Nuevos Lanzamientos'}
                  {activeGameCategory === 'favorites' && 'Tus Favoritos'}
                  {activeGameCategory === 'recent' && 'Jugados Recientemente'}
                </h2>
                {activeGameCategory === 'favorites' && (
                  <span className="text-gray-400 text-xs">({favorites?.length || 0} juegos)</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <button className="bg-[#192531] text-xs py-1 px-2 rounded-md hover:bg-[#1c2b3a] transition-colors text-gray-300">
                  Ver Todos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {/* Juego 1 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#471a54] to-[#2d1034]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">DICE</div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-[#FF51FF]/80 text-white text-xs px-2 py-1 rounded">HOT</div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Dice</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">DICE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>207</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 2 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#1a6fb6] to-[#0c3c63]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">MINES</div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-[#51BDFF]/80 text-white text-xs px-2 py-1 rounded">HOT</div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Mines</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">MINAS</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>189</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 3 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#9c4889] to-[#5d2b52]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">PLINKO</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Plinko</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">STAKE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>176</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 4 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#d97d20] to-[#854e15]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">CRASH</div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-[#FF9147]/80 text-white text-xs px-2 py-1 rounded">HOT</div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Crash</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">STAKE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>315</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 5 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#cf3946] to-[#931f29]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">PUMP</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Pump</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">STAKE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>142</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 6 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#d9bf1a] to-[#93821a]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">LIMBO</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Limbo</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">STAKE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>98</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Juego 7 */}
              <div className="group cursor-pointer">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] group-hover:border-[#09b66d]/40 transition-all duration-300">
                  <div className="aspect-square relative bg-gradient-to-br from-[#27ae60] to-[#176f3d]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">KENO</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Keno</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">STAKE</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>87</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Slots */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-xl font-bold">Slots</h2>
              <div className="flex space-x-2">
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Slot 1 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#5a005a] to-[#260026]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#a00096] flex items-center justify-center shadow-lg">
                        <span className="text-white text-3xl font-bold">★</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Sweet Bonanza</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">PRAGMATIC</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>735</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 2 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#4b371c] to-[#241a0e]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#9e7439] flex items-center justify-center shadow-lg">
                        <span className="text-white text-3xl font-bold">⚔️</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Duel at Dawn</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">HACKSAW</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>462</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 3 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#e7a1cf] to-[#d979b7]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#f4c0e2] flex items-center justify-center shadow-lg">
                        <span className="text-[#d979b7] text-3xl font-bold">♦</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Gates of Olympus</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">PRAGMATIC</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>589</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 4 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#694323] to-[#3d2814]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#aa6e3a] flex items-center justify-center shadow-lg">
                        <span className="text-white text-3xl font-bold">🔫</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Wanted Dead or Wild</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">HACKSAW</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>373</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 5 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#1a3c87] to-[#0f2350]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#2a5cca] flex items-center justify-center shadow-lg">
                        <span className="text-white text-3xl font-bold">⚡</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Zeus vs Hades</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">PRAGMATIC</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>382</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 6 */}
              <div className="cursor-pointer group">
                <div className="bg-[#192531] rounded-lg overflow-hidden border border-[#1c2b3a] transition-colors group-hover:border-[#09b66d]/40">
                  <div className="aspect-square relative bg-gradient-to-br from-[#e052a0] to-[#8523a7]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#f173b8] flex items-center justify-center shadow-lg">
                        <span className="text-white text-3xl font-bold">🍬</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white font-medium text-sm">Sugar Rush</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">PRAGMATIC</span>
                      <div className="flex items-center text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>433</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Proveedores */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-xl font-bold">Proveedores</h2>
              <div className="flex space-x-2">
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button className="bg-[#192531] p-1 rounded-md hover:bg-[#1c2b3a] transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/pragmatic.webp" alt="Pragmatic Play" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPlBSQUdNQVRJQyBQTEFZPC90ZXh0Pjwvc3ZnPg==';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/evolution.webp" alt="Evolution" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPkVWT0xVVElPTiBHQU1JTkc8L3RleHQ+PC9zdmc+';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/hacksaw.webp" alt="Hacksaw" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPkhBQ0tTQVcgR0FNSU5HPC90ZXh0Pjwvc3ZnPg==';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/nolimit.webp" alt="NoLimit City" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPk5PIExJTUlUIENJVFk8L3RleHQ+PC9zdmc+';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/push.webp" alt="Push Gaming" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPlBVU0ggR0FNSU5HPC90ZXh0Pjwvc3ZnPg==';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/twist.webp" alt="Twist Gaming" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPlRXSVNUIEdBTUlORzwvdGV4dD48L3N2Zz4=';
                }} />
              </div>
              <div className="bg-[#192531] flex items-center justify-center p-4 rounded-lg border border-[#1c2b3a] hover:border-[#09b66d]/40 transition-all cursor-pointer">
                <img src="/images/providers/relax.webp" alt="Relax Gaming" className="h-8" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNDQgMzYiPjxyZWN0IHdpZHRoPSIxNDQiIGhlaWdodD0iMzYiIGZpbGw9IiMxOTI1MzEiLz48dGV4dCB4PSI3MiIgeT0iMTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii40ZW0iPlJFTEFYIEdBTUlORzwvdGV4dD48L3N2Zz4=';
                }} />
              </div>
            </div>
          </div>
          
          {/* Actividad de juegos en tiempo real */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-xl font-bold">Actividad en Tiempo Real</h2>
            </div>
            <LiveActivityTable />
          </div>
        </div>
      </main>
    </>
  );
}
