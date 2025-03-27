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
    {
      name: "Casino",
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
        </svg>
      </div>,
      path: "/",
      active: !location.includes('/sports') && location === "/",
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
          path: "/slots"
        },
        {
          name: "Crash",
          icon: <Rocket className="w-4 h-4 text-gray-300" />,
          path: "/crash"
        },
        {
          name: "Ruleta",
          icon: <div className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-13a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </div>,
          path: "/roulette"
        },
        {
          name: "Blackjack",
          icon: <div className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 2v16H7V4h10z"/>
            </svg>
          </div>,
          path: "/blackjack"
        }
      ]
    },
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
          path: "/sports/popular"
        },
        {
          name: "Mis apuestas",
          icon: <FileText className="w-4 h-4 text-gray-300" />,
          path: "/sports/bets"
        }
      ]
    },
    {
      name: "Promociones",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Target className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Recompensas",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Gift className="w-4 h-4 text-white" />
      </div>,
      path: "/rewards",
      badge: 1
    },
    {
      name: "RTP en vivo",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Clock className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Recomienda y gana",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Users className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Canjear",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Wallet className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Club VIP",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Award className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Soporte",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Headset className="w-4 h-4 text-white" />
      </div>,
      path: "/support",
      hasChildren: true,
      children: [
        {
          name: "Centro de ayuda",
          icon: <HelpCircle className="w-4 h-4 text-gray-300" />,
          path: "/support"
        },
        {
          name: "Chat en vivo",
          icon: <MessageCircle className="w-4 h-4 text-gray-300" />,
          path: "/support/chat"
        },
        {
          name: "Contacto",
          icon: <HeartHandshake className="w-4 h-4 text-gray-300" />,
          path: "/support/contact"
        }
      ]
    },
    {
      name: "Idioma",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Globe className="w-4 h-4 text-white" />
      </div>,
      path: "#",
      hasChildren: true
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
  const renderSidebarItem = (item: SidebarItem, index: number | string, isChild = false) => {
    const isExpanded = expandedItems[index];
    const hasActiveChild = item.children?.some(child => child.active);
    
    return (
      <div key={`${index}-${item.name}`}>
        {/* Ítem principal */}
        <div 
          className={cn(
            "group flex items-center justify-between px-3 py-2 mx-2 rounded-lg text-white transition-colors cursor-pointer",
            (item.active || hasActiveChild) ? "bg-[#192531]" : "hover:bg-[#192531]",
            isChild && "pl-8 pr-3 py-1.5 mx-3 my-0.5 rounded-md"
          )}
          onClick={() => {
            if (item.hasChildren && !sidebarCollapsed) {
              toggleExpand(index.toString());
            } else if (item.path) {
              window.location.href = item.path;
            }
          }}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            {(!sidebarCollapsed || isChild) && (
              <span className={cn(
                "font-medium text-sm",
                (item.active || hasActiveChild) ? "text-white" : "text-gray-300 group-hover:text-white"
              )}>
                {item.name}
              </span>
            )}
          </div>
          
          {(!sidebarCollapsed || isChild) && (
            <>
              {item.badge !== undefined && (
                <div className="h-5 w-auto min-w-5 px-1 rounded-full bg-[#09b66d] text-white text-xs font-bold flex items-center justify-center">
                  {item.badge}
                </div>
              )}
              {item.hasChildren && !isChild && (
                isExpanded ? 
                <ChevronDown className="h-4 w-4 text-gray-300" /> : 
                <ChevronRight className="h-4 w-4 text-gray-300" />
              )}
            </>
          )}
        </div>
        
        {/* Subitems si está expandido */}
        {item.hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mt-1 ml-4 space-y-1 border-l border-[#1c2b3a] pl-2">
            {item.children?.map((child, childIndex) => (
              renderSidebarItem(child, `${index}-${childIndex}`, true)
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-[#0e1824] border-r border-[#1c2b3a] transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header with Logo */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#1c2b3a]">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#09b66d] flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="ml-2 font-bold text-white">CryptoSpin</span>
            </div>
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className="text-gray-400 hover:text-white p-1"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="h-8 w-8 rounded-full bg-[#09b66d] flex items-center justify-center hover:bg-[#0fda85] transition-colors"
            >
              <span className="text-white font-bold text-sm">CS</span>
            </button>
          </div>
        )}
      </div>

      {/* Balance Widget */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 m-2 rounded-lg bg-[#192531] border border-[#1c2b3a]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-300">Balance</div>
              <div className="text-md font-medium text-white">{user?.balance || "0.00"} €</div>
            </div>
            <div className="flex space-x-1">
              <button className="py-1 px-2 text-xs bg-[#09b66d] hover:bg-[#0fda85] text-white rounded-md transition-colors">
                Depositar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Items */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="py-2 space-y-1">
          {sidebarItems.map((item, index) => (
            renderSidebarItem(item, index)
          ))}
        </div>
      </div>

      {/* Total Bets Counter */}
      {!sidebarCollapsed && (
        <div className="mt-auto px-3 py-3 mx-2 mb-2 rounded-lg bg-[#192531] border border-[#1c2b3a]">
          <div className="text-xs text-gray-300 mb-1">Total apuestas</div>
          <div className="text-sm font-medium text-white">{totalBets}</div>
        </div>
      )}
    </div>
  );
}
