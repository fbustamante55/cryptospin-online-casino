import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  Home, 
  TrendingUp, 
  Wallet, 
  User, 
  Star, 
  BarChart, 
  Menu, 
  Trophy, 
  Gift, 
  Award, 
  Headset,
  X,
  Calendar,
  Zap,
  FileText,
  Bell,
  Rocket,
  Settings,
  LogOut,
  Plus,
  Clock,
  Target,
  Users,
  Globe,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Componente para cada ítem del drawer menu
interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  badge?: number | string;
  onClick?: () => void;
  active?: boolean;
  hasSubmenu?: boolean;
  toggleSubmenu?: () => void;
  isSubmenuOpen?: boolean;
}

function DrawerItem({ 
  icon, 
  label, 
  path, 
  badge, 
  onClick, 
  active,
  hasSubmenu,
  toggleSubmenu,
  isSubmenuOpen
}: DrawerItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-3 hover:bg-[#192531] cursor-pointer",
        active ? "bg-[#192531]" : ""
      )}
      onClick={onClick || (hasSubmenu ? toggleSubmenu : () => path && (window.location.href = path))}
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-300">{icon}</div>
        <span className="text-gray-100">{label}</span>
      </div>
      <div className="flex items-center">
        {badge && (
          <div className="h-5 w-auto min-w-5 px-1 rounded-full bg-[#09b66d] text-white text-xs font-bold flex items-center justify-center mr-2">
            {badge}
          </div>
        )}
        {hasSubmenu && (
          <div className="w-5 h-5 flex items-center justify-center text-gray-400">
            {isSubmenuOpen ? (
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para cada ítem del submenu
function DrawerSubmenuItem({ icon, label, path, active }: { icon: React.ReactNode; label: string; path: string; active?: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center pl-10 pr-4 py-2 hover:bg-[#1c2b3a] cursor-pointer",
        active ? "bg-[#1c2b3a]" : ""
      )}
      onClick={() => window.location.href = path}
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-gray-300">{label}</span>
      </div>
    </div>
  );
}

// Componente de drawer personalizado para móvil
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function MobileDrawer({ open, onClose, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backdropRef.current && backdropRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevenir scroll
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = ''; // Restaurar scroll
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 transform transition-all duration-300 ease-in-out md:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ visibility: open ? 'visible' : 'hidden' }}
    >
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="absolute top-0 left-0 h-full w-[280px] bg-[#0e1824] border-r border-[#1c2b3a] shadow-xl transform transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {children}
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  // Determinar el tab activo basado en la URL actual
  const [activeTab, setActiveTab] = useState(
    location.includes('/sports') ? 'deportes' : 'casino'
  );
  
  // Toggle para expandir/colapsar subcategorías
  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({ 
      ...prev, 
      [menuName]: !prev[menuName] 
    }));
  };

  // Consulta para obtener eventos deportivos
  const { data: eventsData } = useQuery({ 
    queryKey: ['/api/sports/events'],
    queryFn: async () => {
      try {
        const response = await apiRequest({
          url: '/api/sports/events',
          method: 'GET'
        });
        return response;
      } catch (error) {
        console.error("Error fetching sports events:", error);
        return { events: [] };
      }
    },
    refetchInterval: 60000 // Actualizar cada minuto
  });
  
  // Calcular el número de eventos en vivo
  useEffect(() => {
    if (eventsData?.events) {
      // Filtrar los eventos que son en vivo (comenzaron en las últimas 3 horas)
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      
      // Contar eventos cuyo tiempo de inicio es antes de ahora pero después de hace 3 horas
      const liveEvents = eventsData.events.filter((event: any) => {
        const eventDate = new Date(event.commence_time);
        return eventDate < now && eventDate > threeHoursAgo;
      });
      
      setLiveEventsCount(liveEvents.length);
    }
  }, [eventsData]);
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/crash" && location === "/crash") return true;
    if (path === "/wallet" && ["/wallet", "/history"].includes(location)) return true;
    if (path === "/profile" && location === "/profile") return true;
    if (path === "/sports" && location === "/sports") return true;
    if (path.includes('/sports') && location.includes('/sports')) return true;
    return false;
  };

  // Obtener el ID del usuario formateado, evitando errores con toString()
  const getUserIdFormatted = () => {
    if (!user || !user.id) return '123456';
    const idStr = String(user.id); // Convertir a string de forma segura
    return idStr.length > 8 ? idStr.substring(0, 8) : idStr;
  };

  return (
    <>
      {/* Mobile Drawer */}
      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1c2b3a] flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-[#09b66d] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <div className="text-xl font-bold text-white ml-2">CryptoSpin</div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* User info and balance */}
        <div className="px-4 py-3 border-b border-[#1c2b3a]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#192531] flex items-center justify-center">
                <User className="h-4 w-4 text-gray-300" />
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-white">{user?.username || 'Usuario'}</div>
                <div className="text-xs text-gray-400">ID: {getUserIdFormatted()}</div>
              </div>
            </div>
            <button 
              onClick={() => logoutMutation.mutate()}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between bg-[#192531] rounded-lg p-3">
            <div>
              <div className="text-xs text-gray-400">Balance</div>
              <div className="text-sm font-medium text-white">{user?.balance || "0.00"} €</div>
            </div>
            <div className="flex space-x-1">
              <button 
                className="h-8 w-8 flex items-center justify-center bg-[#09b66d] hover:bg-[#0fda85] text-white rounded-md transition-colors"
                onClick={() => {
                  setSidebarOpen(false);
                  window.location.href = '/wallet';
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu items */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {/* Casino Section */}
          <DrawerItem 
            icon={<div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
              </svg>
            </div>}
            label="Casino"
            hasSubmenu={true}
            toggleSubmenu={() => toggleMenu('casino')}
            isSubmenuOpen={expandedMenus['casino']}
            active={!location.includes('/sports') && location === "/"}
          />
          {expandedMenus['casino'] && (
            <div className="bg-[#0a111a]">
              <DrawerSubmenuItem 
                icon={<Home className="h-4 w-4" />}
                label="Casino Lobby"
                path="/"
                active={location === "/"}
              />
              <DrawerSubmenuItem 
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8zm0 2h8v16H8V4zm6 13a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>}
                label="Tragamonedas"
                path="/slots"
              />
              <DrawerSubmenuItem 
                icon={<Rocket className="h-4 w-4" />}
                label="Crash"
                path="/crash"
              />
              <DrawerSubmenuItem 
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-13a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>}
                label="Ruleta"
                path="/roulette"
              />
              <DrawerSubmenuItem 
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 2v16H7V4h10z"/>
                </svg>}
                label="Blackjack"
                path="/blackjack"
              />
            </div>
          )}
          
          {/* Sportsbook Section */}
          <DrawerItem 
            icon={<Trophy className="h-5 w-5" />}
            label="Sportsbook"
            hasSubmenu={true}
            toggleSubmenu={() => toggleMenu('sportsbook')}
            isSubmenuOpen={expandedMenus['sportsbook']}
            active={location.includes('/sports')}
          />
          {expandedMenus['sportsbook'] && (
            <div className="bg-[#0a111a]">
              <DrawerSubmenuItem 
                icon={<Zap className="h-4 w-4" />}
                label="En vivo"
                path="/sports/vivo"
                active={location.includes('/sports/vivo')}
              />
              <DrawerSubmenuItem 
                icon={<Calendar className="h-4 w-4" />}
                label="Próximos"
                path="/sports"
                active={location === "/sports"}
              />
              <DrawerSubmenuItem 
                icon={<Star className="h-4 w-4" />}
                label="Populares"
                path="/sports/popular"
              />
              <DrawerSubmenuItem 
                icon={<FileText className="h-4 w-4" />}
                label="Mis apuestas"
                path="/sports/bets"
              />
            </div>
          )}
          
          {/* Otros menús */}
          <DrawerItem 
            icon={<Target className="h-5 w-5" />}
            label="Promociones"
            path="#"
          />
          
          <DrawerItem 
            icon={<Gift className="h-5 w-5" />}
            label="Recompensas"
            path="/rewards"
            badge={1}
          />
          
          <DrawerItem 
            icon={<Clock className="h-5 w-5" />}
            label="RTP en vivo"
            path="#"
          />
          
          <DrawerItem 
            icon={<Users className="h-5 w-5" />}
            label="Recomienda y gana"
            path="#"
          />
          
          <DrawerItem 
            icon={<Wallet className="h-5 w-5" />}
            label="Billetera"
            path="/wallet"
          />
          
          <DrawerItem 
            icon={<Award className="h-5 w-5" />}
            label="Club VIP"
            path="#"
          />
          
          <DrawerItem 
            icon={<Headset className="h-5 w-5" />}
            label="Soporte"
            hasSubmenu={true}
            toggleSubmenu={() => toggleMenu('support')}
            isSubmenuOpen={expandedMenus['support']}
          />
          {expandedMenus['support'] && (
            <div className="bg-[#0a111a]">
              <DrawerSubmenuItem 
                icon={<Headset className="h-4 w-4" />}
                label="Centro de ayuda"
                path="/support"
              />
              <DrawerSubmenuItem 
                icon={<MessageCircle className="h-4 w-4" />}
                label="Chat en vivo"
                path="/support/chat"
              />
            </div>
          )}
          
          <DrawerItem 
            icon={<Globe className="h-5 w-5" />}
            label="Idioma"
            hasSubmenu={true}
            toggleSubmenu={() => toggleMenu('language')}
            isSubmenuOpen={expandedMenus['language']}
          />
          {expandedMenus['language'] && (
            <div className="bg-[#0a111a] py-2 px-4 grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 p-2 hover:bg-[#192531] rounded cursor-pointer">
                <span className="text-lg">🇪🇸</span>
                <span className="text-sm text-gray-300">Español</span>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-[#192531] rounded cursor-pointer">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm text-gray-300">English</span>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-[#192531] rounded cursor-pointer">
                <span className="text-lg">🇫🇷</span>
                <span className="text-sm text-gray-300">Français</span>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-[#192531] rounded cursor-pointer">
                <span className="text-lg">🇩🇪</span>
                <span className="text-sm text-gray-300">Deutsch</span>
              </div>
            </div>
          )}
        </div>
      </MobileDrawer>
      
      {/* Top mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#0e1824] border-b border-[#1c2b3a] z-20 px-4 py-2 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="text-gray-400 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <h1 className="text-lg font-bold text-white">CryptoSpin</h1>
        
        <div className="flex">
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ${activeTab === 'casino' ? 'bg-[#09b66d]' : 'bg-[#192531] hover:bg-[#243442]'}`}
            onClick={() => {
              setActiveTab('casino');
              window.location.href = '/';
            }}
          >
            CASINO
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-white font-medium text-sm ml-1 ${activeTab === 'deportes' ? 'bg-[#09b66d]' : 'bg-[#192531] hover:bg-[#243442]'}`}
            onClick={() => {
              setActiveTab('deportes');
              window.location.href = '/sports';
            }}
          >
            DEPORTES
          </button>
        </div>
        
        <button 
          className="text-gray-400 hover:text-white" 
          onClick={() => window.location.href = '/profile'}
        >
          <User className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e1824] border-t border-[#1c2b3a] z-10">
        <div className="flex justify-around">
          <Link href="/" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/") ? "text-white" : "text-gray-300"
          )}>
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
              </svg>
            </div>
            <span className="text-xs mt-1">Casino</span>
          </Link>
          
          <Link href="/sports" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/sports") ? "text-white" : "text-gray-300"
          )}>
            <Trophy className="h-5 w-5" />
            <span className="text-xs mt-1">Deportes</span>
          </Link>
          
          <Link href="/wallet" className={cn(
            "flex flex-col items-center py-3 px-4",
            isActive("/wallet") ? "text-white" : "text-gray-300"
          )}>
            <Wallet className="h-5 w-5" />
            <span className="text-xs mt-1">Billetera</span>
          </Link>
          
          <Link href="/rewards" className={cn(
            "flex flex-col items-center py-3 px-4 relative",
            isActive("/rewards") ? "text-white" : "text-gray-300"
          )}>
            <Gift className="h-5 w-5" />
            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#09b66d] text-white text-xs font-bold flex items-center justify-center">
              1
            </div>
            <span className="text-xs mt-1">Recompensas</span>
          </Link>
          
          <button 
            onClick={() => setSidebarOpen(true)} 
            className={cn(
              "flex flex-col items-center py-3 px-4",
              "text-gray-300"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1">Menú</span>
          </button>
        </div>
      </div>
    </>
  );
}
