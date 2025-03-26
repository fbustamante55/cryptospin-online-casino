import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Home,
  TrendingUp,
  Wallet,
  Clock,
  User,
  Star,
  Target,
  BarChart,
  Tv,
  Rocket,
  PlayCircle,
  DollarSign,
  Zap,
  Menu,
  Gift,
  Users,
  Award,
  FileText,
  MessageCircle,
  Globe,
  HeartHandshake,
  Headset,
  BookOpenText
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("casino");

  const isActive = (path: string) => location === path;

  const favoriteItems = [
    { name: "Favoritos", icon: <Star className="h-4 w-4" /> },
    { name: "Reciente", icon: <Clock className="h-4 w-4" /> },
    { name: "Desafíos", icon: <Target className="h-4 w-4" /> },
    { name: "Mis Apuestas", icon: <BarChart className="h-4 w-4" /> },
  ];

  const gameItems = [
    { name: "Originales de CryptoSpin", path: "/crash", icon: <Home className="h-4 w-4" /> },
    { name: "Exclusivos de CryptoSpin", path: "/crash", icon: <Star className="h-4 w-4" /> },
    { name: "Crash", path: "/crash", icon: <TrendingUp className="h-4 w-4" /> },
    { name: "Casino en Vivo", path: "/crash", icon: <PlayCircle className="h-4 w-4" /> },
    { name: "Concursos de TV", path: "/crash", icon: <Tv className="h-4 w-4" /> },
    { name: "Lanzamientos", path: "/crash", icon: <Rocket className="h-4 w-4" /> },
    { name: "Compra de bonificación", path: "/wallet", icon: <DollarSign className="h-4 w-4" /> },
    { name: "RTP mejorado", path: "/crash", icon: <Zap className="h-4 w-4" /> },
  ];
  
  // Elementos para la sección de deportes
  const sportsItems = [
    { name: "Eventos en Vivo", icon: <Tv className="h-4 w-4" />, badge: "24" },
    { name: "Empezando Pronto", icon: <Clock className="h-4 w-4" /> },
    { name: "Mis Apuestas", icon: <BarChart className="h-4 w-4" /> },
  ];
  
  // Deportes populares
  const popularSports = [
    { name: "Fútbol", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Baloncesto", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Tenis", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "MMA", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Béisbol", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Hockey sobre hielo", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Tenis de Mesa", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Vóleibol", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "CS2", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Carreras", icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: "Todos los Deportes", icon: <Tv className="h-4 w-4" />, hasArrow: true },
  ];
  
  const footerItems = [
    { name: "Perfil", path: "/profile", icon: <User className="h-4 w-4" />, hasArrow: true },
    { name: "Promociones", path: "#", icon: <Gift className="h-4 w-4" />, hasArrow: true },
    { name: "Afiliado", path: "#", icon: <Users className="h-4 w-4" /> },
    { name: "Club VIP", path: "#", icon: <Award className="h-4 w-4" /> },
    { name: "Blog", path: "#", icon: <FileText className="h-4 w-4" /> },
    { name: "Foro", path: "#", icon: <MessageCircle className="h-4 w-4" /> },
    { name: "Patrocinios", path: "#", icon: <HeartHandshake className="h-4 w-4" />, hasArrow: true },
    { name: "Juego Responsable", path: "#", icon: <BookOpenText className="h-4 w-4" /> },
    { name: "Soporte en vivo", path: "#", icon: <Headset className="h-4 w-4" /> },
    { name: "Idioma: Español", path: "#", icon: <Globe className="h-4 w-4" />, hasArrow: true },
  ];

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-[#0e1824] border-r border-[#1c2b3a] transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Top section with menu button and tabs */}
      <div className="flex items-center border-b border-[#1c2b3a] p-2">
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-gray-400 hover:text-white p-1"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {!sidebarCollapsed && (
          <div className="flex ml-2">
            <button 
              className={`px-4 py-2 rounded-md text-white font-medium text-sm ${activeTab === 'casino' ? 'bg-[#09b66d]' : 'bg-[#313d4a] hover:bg-[#2a3441]'}`}
              onClick={() => setActiveTab('casino')}
            >
              CASINO
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-white font-medium text-sm ml-1 ${activeTab === 'deportes' ? 'bg-[#09b66d]' : 'bg-[#313d4a] hover:bg-[#2a3441]'}`}
              onClick={() => {
                setActiveTab('deportes');
                window.location.href = '/sports';
              }}
            >
              DEPORTES
            </button>
          </div>
        )}
      </div>

      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'casino' ? (
          <>
            {/* Favorites section - Casino tab */}
            <div className="py-2 border-b border-[#1c2b3a]">
              {favoriteItems.map((item, index) => (
                <Link 
                  key={index} 
                  href="#"
                  className="flex items-center px-4 py-3 text-white hover:bg-[#192531] transition-colors"
                >
                  <span className="text-gray-400">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
            </div>

            {/* Games section - Casino tab */}
            <div>
              {!sidebarCollapsed && (
                <div className="px-4 py-3 text-gray-400 font-semibold text-sm">
                  Juegos
                </div>
              )}

              {gameItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.path || "#"}
                  className={cn(
                    "flex items-center px-4 py-3 text-white hover:bg-[#192531] transition-colors",
                    item.path && isActive(item.path) ? "bg-[#192531]" : ""
                  )}
                >
                  <span className={cn(
                    "", 
                    item.path && isActive(item.path) ? "text-[#09b66d]" : "text-gray-400"
                  )}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
            </div>

            {/* Providers section - Casino tab */}
            <div className="border-t border-[#1c2b3a]">
              {!sidebarCollapsed && (
                <div className="px-4 py-3 text-gray-400 font-semibold text-sm">
                  Proveedores
                </div>
              )}
              <Link 
                href="#"
                className="flex items-center px-4 py-3 text-white hover:bg-[#192531] transition-colors"
              >
                <span className="text-gray-400">
                  <Zap className="h-4 w-4" />
                </span>
                {!sidebarCollapsed && <span className="ml-3">Proveedores</span>}
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Sports section */}
            <div className="py-2">
              {sportsItems.map((item, index) => (
                <Link 
                  key={index} 
                  href="#"
                  className="flex items-center justify-between px-4 py-3 text-white hover:bg-[#192531] transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-gray-400">
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="text-xs bg-[#f8c541] text-[#0e1824] font-bold px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Mejores Deportes section */}
            <div className="border-t border-[#1c2b3a]">
              {!sidebarCollapsed && (
                <div className="px-4 py-3 text-gray-400 font-semibold text-sm">
                  Mejores Deportes
                </div>
              )}
              
              {popularSports.map((item, index) => (
                <Link 
                  key={index} 
                  href="#"
                  className="flex items-center justify-between px-4 py-3 text-white hover:bg-[#192531] transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-gray-400">
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.hasArrow && (
                    <span className="text-gray-400">
                      <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
        
        {/* Footer Items */}
        <div className="border-t border-[#1c2b3a]">
          {footerItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.path || "#"}
              className="flex items-center justify-between px-4 py-3 text-white hover:bg-[#192531] transition-colors"
            >
              <div className="flex items-center">
                <span className="text-gray-400">
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
              </div>
              {!sidebarCollapsed && item.hasArrow && (
                <span className="text-gray-400">
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
      
      {/* User section */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-[#1c2b3a]">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#09b66d] flex items-center justify-center text-[#0e1824]">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <button 
                onClick={() => logoutMutation.mutate()}
                className="text-xs text-gray-400 hover:text-[#09b66d]"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
