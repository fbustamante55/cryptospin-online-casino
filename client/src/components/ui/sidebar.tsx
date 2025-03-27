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
  BookOpenText,
  Calendar,
  Trophy,
  Globe,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  GamepadIcon
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SidebarLanguageSwitcher } from "./sidebar-language-switcher";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { fetchOdds, EventOdds } from "@/lib/sports-api";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  className?: string;
}

interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  active?: boolean;
  hasChildren?: boolean;
  badge?: number | string;
  children?: SidebarItem[];
  customComponent?: React.ReactNode;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const [totalBets, setTotalBets] = useState("8,065,415,781");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Determinar el tab activo basado en la URL actual
  const [activeTab, setActiveTab] = useState(
    location.includes('/sports') ? 'deportes' : 'casino'
  );
  
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

  // Toggle para expandir/colapsar subcategorías
  const toggleExpand = (index: string) => {
    setExpandedItems(prev => ({ 
      ...prev, 
      [index]: !prev[index] 
    }));
  };

  const sidebarItems: SidebarItem[] = [
    // Sección principal de juegos
    {
      name: "Casino",
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
        </svg>
      </div>,
      path: "/",
      active: !location.includes('/sports') && !location.includes('/rewards') && !location.includes('/support') && !location.includes('/wallet'),
      hasChildren: true,
      children: [
        {
          name: "Casino Lobby",
          icon: <GamepadIcon className="w-4 h-4 text-gray-300" />,
          path: "/",
          active: location === "/"
        },
        {
          name: "Tragamonedas",
          icon: <div className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8zm0 2h8v16H8V4zm6 13a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
          </div>,
          path: "/slots",
          active: location.includes('/slots'),
          hasChildren: true,
          children: [
            {
              name: "Popular",
              icon: <Star className="w-3 h-3 text-gray-300" />,
              path: "/slots/popular",
            },
            {
              name: "Nuevos",
              icon: <Zap className="w-3 h-3 text-gray-300" />,
              path: "/slots/new",
            },
            {
              name: "Jackpots",
              icon: <DollarSign className="w-3 h-3 text-gray-300" />,
              path: "/slots/jackpots",
            }
          ]
        },
        {
          name: "Crash",
          icon: <Rocket className="w-4 h-4 text-gray-300" />,
          path: "/crash",
          active: location.includes('/crash')
        },
        {
          name: "Ruleta",
          icon: <div className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-13a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </div>,
          path: "/roulette",
          active: location.includes('/roulette')
        },
        {
          name: "Blackjack",
          icon: <div className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 2v16H7V4h10z"/>
            </svg>
          </div>,
          path: "/blackjack",
          active: location.includes('/blackjack')
        }
      ]
    },
    // Sección de deportes
    {
      name: "Sportsbook",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-white" />
      </div>,
      path: "/sports",
      active: location.includes('/sports'),
      hasChildren: true,
      children: [
        {
          name: "En vivo",
          icon: <Zap className="w-4 h-4 text-gray-300" />,
          path: "/sports/vivo",
          badge: liveEventsCount > 0 ? liveEventsCount : undefined,
          active: location.includes('/sports/vivo')
        },
        {
          name: "Próximos",
          icon: <Calendar className="w-4 h-4 text-gray-300" />,
          path: "/sports",
          active: location === "/sports"
        },
        {
          name: "Populares",
          icon: <Star className="w-4 h-4 text-gray-300" />,
          path: "/sports/popular",
          active: location.includes('/sports/popular'),
          hasChildren: true,
          children: [
            {
              name: "Fútbol",
              icon: <span className="text-gray-300 text-xs">⚽</span>,
              path: "/sports/popular/football",
            },
            {
              name: "Baloncesto",
              icon: <span className="text-gray-300 text-xs">🏀</span>,
              path: "/sports/popular/basketball",
            },
            {
              name: "Tenis",
              icon: <span className="text-gray-300 text-xs">🎾</span>,
              path: "/sports/popular/tennis",
            }
          ]
        },
        {
          name: "Mis apuestas",
          icon: <FileText className="w-4 h-4 text-gray-300" />,
          path: "/sports/bets",
          active: location.includes('/sports/bets')
        }
      ]
    },
    // Sección de Promociones y Recompensas
    {
      name: "Promociones",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Target className="w-4 h-4 text-white" />
      </div>,
      path: "/promotions",
      active: location.includes('/promotions')
    },
    {
      name: "Recompensas",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Gift className="w-4 h-4 text-white" />
      </div>,
      path: "/rewards",
      badge: 1,
      active: location.includes('/rewards')
    },
    // Sección de RTP en vivo
    {
      name: "RTP en vivo",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Clock className="w-4 h-4 text-white" />
      </div>,
      path: "/rtp-live",
      active: location.includes('/rtp-live')
    },
    // Recomienda y gana
    {
      name: "Recomienda y gana",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>,
      path: "/refer",
      active: location.includes('/refer')
    },
    // Club VIP
    {
      name: "Club VIP",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Award className="w-4 h-4 text-white" />
      </div>,
      path: "/vip",
      active: location.includes('/vip')
    },
    // Sección de Pagos (sin submenús)
    {
      name: "Pagos",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Wallet className="w-4 h-4 text-white" />
      </div>,
      path: "/wallet",
      active: location.includes('/wallet')
    },
    // Sección de Soporte e Idioma
    {
      name: "Soporte",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Headset className="w-4 h-4 text-white" />
      </div>,
      path: "/support",
      active: location.includes('/support'),
      hasChildren: true,
      children: [
        {
          name: "Centro de ayuda",
          icon: <HelpCircle className="w-4 h-4 text-gray-300" />,
          path: "/support",
        },
        {
          name: "Chat en vivo",
          icon: <MessageCircle className="w-4 h-4 text-gray-300" />,
          path: "/support/chat",
        },
        {
          name: "Contacto",
          icon: <HeartHandshake className="w-4 h-4 text-gray-300" />,
          path: "/support/contact",
        }
      ]
    },
    {
      name: "Idioma",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Globe className="w-4 h-4 text-white" />
      </div>,
      path: "#",
      hasChildren: false,
      customComponent: <SidebarLanguageSwitcher collapsed={sidebarCollapsed} />
    }
  ];

  // UseEffect para expandir automáticamente el menú activo
  useEffect(() => {
    sidebarItems.forEach((item, index) => {
      if (item.active && item.hasChildren) {
        setExpandedItems(prev => ({ ...prev, [index]: true }));
      }
      
      // Revisar subcategorías
      item.children?.forEach(child => {
        if (child.active && item.hasChildren) {
          setExpandedItems(prev => ({ ...prev, [index]: true }));
        }
      });
    });
  }, [location]);

  // Cerrar menús al colapsar sidebar
  useEffect(() => {
    if (sidebarCollapsed) {
      setExpandedItems({});
    }
  }, [sidebarCollapsed]);

  // Render de un ítem del sidebar
  const renderSidebarItem = (item: SidebarItem, index: number | string, isChild = false, nestLevel = 0) => {
    const isExpanded = expandedItems[index];
    const hasActiveChild = item.children?.some(child => 
      child.active || child.children?.some(subchild => subchild.active)
    );
    
    // Si el ítem tiene un componente personalizado, renderizarlo
    if (item.customComponent) {
      return (
        <div key={`${index}-${item.name}`}>
          {item.customComponent}
        </div>
      );
    }
    
    // Calcular indentación basada en el nivel de anidado
    const indentationClasses = isChild 
      ? nestLevel === 1 
        ? "pl-8 pr-3" 
        : nestLevel === 2 
          ? "pl-12 pr-3" 
          : "pl-16 pr-3"
      : "";
    
    // Ajustar tamaño del texto e iconos basado en nivel de anidado
    const textSizeClass = isChild && nestLevel > 1 ? "text-xs" : "text-sm";
    const iconSizeClass = isChild && nestLevel > 1 ? "w-3 h-3" : "w-4 h-4";
    
    return (
      <motion.div key={`${index}-${item.name}`}>
        {/* Ítem principal */}
        <motion.div 
          className={cn(
            "group flex items-center justify-between px-3 py-2 mx-2 rounded-lg text-white cursor-pointer",
            (item.active || hasActiveChild) ? "bg-[#192531]" : "",
            isChild && "py-1.5 mx-3 my-0.5 rounded-md",
            indentationClasses
          )}
          onClick={() => {
            if (item.hasChildren && !sidebarCollapsed) {
              toggleExpand(index.toString());
            } else if (item.path) {
              window.location.href = item.path;
            }
          }}
          whileHover={{ 
            backgroundColor: "#192531",
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          animate={
            (item.active || hasActiveChild) 
              ? { backgroundColor: "#192531" } 
              : { backgroundColor: "rgba(0,0,0,0)" }
          }
        >
          <motion.div className="flex items-center space-x-3">
            <motion.div 
              className={cn(isChild && iconSizeClass)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {item.icon}
            </motion.div>
            {(!sidebarCollapsed || isChild) && (
              <motion.span 
                className={cn(
                  `font-medium ${textSizeClass}`,
                  (item.active || hasActiveChild) ? "text-white" : "text-gray-300 group-hover:text-white"
                )}
                animate={{ 
                  color: (item.active || hasActiveChild) ? "#ffffff" : "#94a3b8" 
                }}
                whileHover={{ color: "#ffffff" }}
              >
                {item.name}
              </motion.span>
            )}
          </motion.div>
          
          {(!sidebarCollapsed || isChild) && (
            <div className="flex items-center">
              {item.badge !== undefined && (
                <motion.div 
                  className={cn(
                    "h-5 w-auto min-w-5 px-1 rounded-full bg-[#09b66d] text-white text-xs font-bold flex items-center justify-center",
                    nestLevel > 1 && "h-4 min-w-4 text-[10px]"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {item.badge}
                </motion.div>
              )}
              {item.hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronRight className={cn("h-4 w-4 text-gray-300 ml-1", nestLevel > 1 && "h-3 w-3")} />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Subitems si está expandido */}
        <AnimatePresence>
          {item.hasChildren && isExpanded && !sidebarCollapsed && (
            <motion.div 
              className={cn(
                "mt-1 space-y-1",
                nestLevel === 0 ? "ml-4 border-l border-[#1c2b3a] pl-2" : 
                nestLevel === 1 ? "ml-2 pl-1" : "ml-1"
              )}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {item.children?.map((child, childIndex) => (
                renderSidebarItem(child, `${index}-${childIndex}`, true, nestLevel + 1)
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className={cn(
        "hidden md:flex flex-col bg-[#0e1824] border-r border-[#1c2b3a]",
        className
      )}
      animate={{
        width: sidebarCollapsed ? "4rem" : "16rem"
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
    >
      {/* Sidebar Header with Logo */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#1c2b3a]">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div 
              className="flex items-center justify-between w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              key="expanded-header"
            >
              <div className="flex items-center">
                <motion.div 
                  className="h-8 w-8 rounded-full bg-[#09b66d] flex items-center justify-center"
                  whileHover={{ scale: 1.05, backgroundColor: "#0fda85" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-white font-bold text-sm">CS</span>
                </motion.div>
                <motion.span 
                  className="ml-2 font-bold text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  CryptoSpin
                </motion.span>
              </div>
              <motion.button 
                onClick={() => setSidebarCollapsed(true)}
                className="text-gray-400 p-1 rounded-full"
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: "#192531",
                  color: "#ffffff" 
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="w-full flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              key="collapsed-header"
            >
              <motion.button
                onClick={() => setSidebarCollapsed(false)}
                className="h-8 w-8 rounded-full bg-[#09b66d] flex items-center justify-center"
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: "#0fda85"
                }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-white font-bold text-sm">CS</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Balance Widget */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="px-4 py-3 m-2 rounded-lg bg-[#192531] border border-[#1c2b3a]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ delay: 0.1, duration: 0.3 }}
            aria-label="Balance del usuario"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-300">Balance</div>
                <div className="text-md font-medium text-white">{user?.balance || "0.00"} €</div>
              </div>
              <motion.div className="flex space-x-1">
                <motion.button 
                  className="py-1 px-2 text-xs bg-[#09b66d] text-white rounded-md"
                  whileHover={{ 
                    scale: 1.05, 
                    backgroundColor: "#0fda85" 
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Depositar
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Items */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="py-2 space-y-1">
          {sidebarItems.map((item, index) => (
            renderSidebarItem(item, index)
          ))}
        </div>
      </div>

      {/* Total Bets Counter */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="mt-auto px-3 py-3 mx-2 mb-2 rounded-lg bg-[#192531] border border-[#1c2b3a]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            aria-label="Contador de apuestas totales"
          >
            <div className="text-xs text-gray-300 mb-1">Total apuestas</div>
            <div className="text-sm font-medium text-white">{totalBets}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
