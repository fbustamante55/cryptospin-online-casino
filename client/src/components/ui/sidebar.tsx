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
            (item.active || hasActiveChild) ? "bg-[var(--nova-primary-light)]" : "",
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
            backgroundColor: "var(--nova-primary)",
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          animate={
            (item.active || hasActiveChild) 
              ? { backgroundColor: "var(--nova-primary-light)" } 
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
                    "h-5 w-auto min-w-5 px-1 rounded-full bg-[var(--nova-secondary)] text-[var(--nova-primary-dark)] text-xs font-bold flex items-center justify-center",
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
        "hidden md:flex flex-col bg-[var(--nova-primary-dark)] border-r border-[var(--nova-primary-light)]",
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
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--nova-primary-light)]">
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
                  className="h-8 w-8 rounded-full bg-[var(--nova-secondary)] flex items-center justify-center"
                  whileHover={{ scale: 1.05, backgroundColor: "var(--nova-secondary-light)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-[var(--nova-primary-dark)] font-bold text-sm">NF</span>
                </motion.div>
                <motion.span 
                  className="ml-2 font-bold bg-gradient-to-r from-[var(--nova-secondary-dark)] to-[var(--nova-secondary-light)] text-transparent bg-clip-text font-['Playfair_Display']"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  NOVA FORTUNE
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
                className="h-8 w-8 rounded-full bg-[var(--nova-secondary)] flex items-center justify-center"
                whileHover={{ 
                  scale: 1.1, 
                  backgroundColor: "var(--nova-secondary-light)"
                }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-[var(--nova-primary-dark)] font-bold text-sm">NF</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Items */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="py-2 space-y-1">
          {sidebarItems.map((item, index) => (
            renderSidebarItem(item, index)
          ))}
        </div>
      </div>
      
      {/* Social Media Component */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="px-3 py-3 mx-2 mb-2 rounded-lg bg-[var(--nova-primary)] border border-[var(--nova-primary-light)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            aria-label="Redes Sociales"
          >
            <div className="text-xs text-gray-300 mb-2">Síguenos</div>
            <div className="flex items-center space-x-3">
              <a 
                href="https://twitter.com/cryptospin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a 
                href="https://discord.gg/cryptospin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.608 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1634-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
              <a 
                href="https://t.me/cryptospin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a 
                href="https://instagram.com/cryptospin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Total Bets Counter */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div 
            className="mt-auto px-3 py-3 mx-2 mb-2 rounded-lg bg-[var(--nova-primary)] border border-[var(--nova-primary-light)]"
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
