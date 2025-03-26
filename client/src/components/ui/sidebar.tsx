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
  HeartHandshake,
  Headset,
  BookOpenText
} from "lucide-react";
import { useState } from "react";
import { SidebarLanguageSwitcher } from "./sidebar-language-switcher";
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Determinar el tab activo basado en la URL actual
  const [activeTab, setActiveTab] = useState(
    location.includes('/sports') ? 'deportes' : 'casino'
  );

  const isActive = (path: string) => location === path;

  const favoriteItems = [
    { name: t('sidebar.favorites'), path: "/favorites", icon: <Star className="h-4 w-4" /> },
    { name: t('sidebar.recent'), path: "/recent", icon: <Clock className="h-4 w-4" /> },
    { name: t('sidebar.challenges'), icon: <Target className="h-4 w-4" /> },
    { name: t('sidebar.myBets'), icon: <BarChart className="h-4 w-4" /> },
  ];

  const gameItems = [
    { name: t('sidebar.cryptoSpinOriginals'), path: "/crash", icon: <Home className="h-4 w-4" /> },
    { name: t('sidebar.cryptoSpinExclusives'), path: "/crash", icon: <Star className="h-4 w-4" /> },
    { name: t('sidebar.crash'), path: "/crash", icon: <TrendingUp className="h-4 w-4" /> },
    { name: t('sidebar.liveCasino'), path: "/crash", icon: <PlayCircle className="h-4 w-4" /> },
    { name: t('sidebar.tvShows'), path: "/crash", icon: <Tv className="h-4 w-4" /> },
    { name: t('sidebar.releases'), path: "/crash", icon: <Rocket className="h-4 w-4" /> },
    { name: t('sidebar.bonusBuy'), path: "/wallet", icon: <DollarSign className="h-4 w-4" /> },
    { name: t('sidebar.enhancedRTP'), path: "/crash", icon: <Zap className="h-4 w-4" /> },
  ];
  
  // Elementos para la sección de deportes
  const sportsItems = [
    { name: t('sidebar.liveEvents'), icon: <Tv className="h-4 w-4" />, badge: "24", path: "/sports", onClick: () => handleSportsFilter('live') },
    { name: "Próximos Eventos", icon: <Clock className="h-4 w-4" />, path: "/sports", onClick: () => handleSportsFilter('upcoming') },
    { name: t('sidebar.myBets'), icon: <BarChart className="h-4 w-4" /> },
  ];
  
  // Función para filtrar eventos deportivos
  const [, setLocation] = useLocation();

  const handleSportsFilter = (filter: 'live' | 'upcoming') => {
    // Guardar filtro en localStorage
    localStorage.setItem('sportsFilter', filter);
    
    // Navegar a la página de deportes
    setLocation('/sports');
  };
  
  // Deportes populares
  const popularSports = [
    { name: t('sports.soccer'), icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: t('sports.basketball'), icon: <Tv className="h-4 w-4" />, hasArrow: true },
    { name: t('sports.tennis'), icon: <Tv className="h-4 w-4" />, hasArrow: true },
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
    { name: t('sidebar.profile'), path: "/profile", icon: <User className="h-4 w-4" />, hasArrow: true },
    { name: t('sidebar.promotions'), path: "#", icon: <Gift className="h-4 w-4" />, hasArrow: true },
    { name: t('sidebar.affiliate'), path: "#", icon: <Users className="h-4 w-4" /> },
    { name: t('sidebar.vipClub'), path: "#", icon: <Award className="h-4 w-4" /> },
    { name: t('sidebar.blog'), path: "#", icon: <FileText className="h-4 w-4" /> },
    { name: t('sidebar.forum'), path: "#", icon: <MessageCircle className="h-4 w-4" /> },
    { name: t('sidebar.sponsorships'), path: "#", icon: <HeartHandshake className="h-4 w-4" />, hasArrow: true },
    { name: t('sidebar.responsibleGaming'), path: "#", icon: <BookOpenText className="h-4 w-4" /> },
    { name: t('sidebar.liveSupport'), path: "#", icon: <Headset className="h-4 w-4" /> },
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
              onClick={() => {
                setActiveTab('casino');
                setLocation('/');
              }}
            >
              {t('tabs.casino')}
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-white font-medium text-sm ml-1 ${activeTab === 'deportes' ? 'bg-[#09b66d]' : 'bg-[#313d4a] hover:bg-[#2a3441]'}`}
              onClick={() => {
                setActiveTab('deportes');
                setLocation('/sports');
              }}
            >
              {t('tabs.sports')}
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

            {/* Games section - Casino tab */}
            <div>
              {!sidebarCollapsed && (
                <div className="px-4 py-3 text-gray-400 font-semibold text-sm">
                  {t('sidebar.games')}
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
                  {t('sidebar.providers')}
                </div>
              )}
              <Link 
                href="#"
                className="flex items-center px-4 py-3 text-white hover:bg-[#192531] transition-colors"
              >
                <span className="text-gray-400">
                  <Zap className="h-4 w-4" />
                </span>
                {!sidebarCollapsed && <span className="ml-3">{t('sidebar.providers')}</span>}
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
                  href={item.path || "#"}
                  onClick={item.onClick}
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
                  {t('sidebar.topSports')}
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
          {/* Idioma Selector */}
          <SidebarLanguageSwitcher collapsed={sidebarCollapsed} />
          
          {/* Otros items */}
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
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
