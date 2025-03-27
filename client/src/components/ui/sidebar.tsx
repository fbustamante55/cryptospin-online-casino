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
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { SidebarLanguageSwitcher } from "./sidebar-language-switcher";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { fetchOdds, EventOdds } from "@/lib/sports-api";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const [totalBets, setTotalBets] = useState("8,065,415,781");
  
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

  // Define la interfaz para los elementos de la barra lateral
  interface SidebarItem {
    name: string;
    icon: React.ReactNode;
    path?: string;
    active?: boolean;
    hasChildren?: boolean;
    badge?: string | number;
  }
  
  const sidebarItems: SidebarItem[] = [
    {
      name: "Casino",
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#9400d3] to-[#e100ff]">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm14 8h-4v6h4v-6z"/>
        </svg>
      </div>,
      path: "/",
      active: !location.includes('/sports'),
      hasChildren: true
    },
    {
      name: "Sportsbook",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-white" />
      </div>,
      path: "/sports",
      active: location.includes('/sports'),
      hasChildren: true
    },
    {
      name: "Recompensas",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Gift className="w-4 h-4 text-white" />
      </div>,
      path: "#",
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
      name: "Promociones",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Target className="w-4 h-4 text-white" />
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
      name: "Soporte en vivo",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Headset className="w-4 h-4 text-white" />
      </div>,
      path: "#"
    },
    {
      name: "Español",
      icon: <div className="w-5 h-5 flex items-center justify-center">
        <Globe className="w-4 h-4 text-white" />
      </div>,
      path: "#",
      hasChildren: true
    }
  ];

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-[#673ab7] border-r border-[#7e57c2] transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Sidebar Header with Logo */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#7e57c2]">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between w-full">
            <div className="text-white font-bold">
              <span className="text-xl">Casino</span>
            </div>
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className="text-white hover:text-gray-200 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="h-8 w-8 rounded-full bg-[#9c27b0] flex items-center justify-center hover:bg-[#ba68c8] transition-colors"
            >
              <span className="text-white font-bold text-sm">C</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Items */}
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="py-2 space-y-1">
          {sidebarItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.path || "#"}
              className={cn(
                "group flex items-center justify-between px-3 py-2 mx-2 rounded-lg text-white transition-colors",
                item.active ? "bg-[#5e35b1]" : "hover:bg-[#5e35b1]/60"
              )}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                {!sidebarCollapsed && (
                  <span className={cn(
                    "font-medium text-sm",
                    item.active ? "text-white" : "text-white opacity-90 group-hover:opacity-100"
                  )}>
                    {item.name}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <>
                  {item.badge && (
                    <div className="px-1.5 py-0.5 bg-white text-[#673ab7] text-xs font-bold rounded">
                      {item.badge}
                    </div>
                  )}
                  {item.hasChildren && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-80">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Total Bets Counter */}
      {!sidebarCollapsed && (
        <div className="mt-auto px-3 py-3 mx-2 mb-2 rounded-lg bg-[#5e35b1] border border-[#7e57c2]">
          <div className="text-xs text-white opacity-75 mb-1">Total apuestas</div>
          <div className="text-sm font-medium text-white">{totalBets}</div>
        </div>
      )}
    </div>
  );
}
