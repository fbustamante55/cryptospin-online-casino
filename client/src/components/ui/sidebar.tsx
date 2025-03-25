import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  Home,
  Dices,
  Gamepad,
  TrendingUp,
  Wallet,
  Clock,
  User,
  Settings
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string) => location === path;

  const navItems = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Slots", path: "/slots", icon: <Gamepad className="h-5 w-5" /> },
    { name: "Dice", path: "/dice", icon: <Dices className="h-5 w-5" /> },
    { name: "Crash", path: "/crash", icon: <TrendingUp className="h-5 w-5" /> },
    { name: "Wallet", path: "/wallet", icon: <Wallet className="h-5 w-5" /> },
    { name: "History", path: "/history", icon: <Clock className="h-5 w-5" /> },
    { name: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className={cn("hidden md:flex flex-col w-64 bg-[#1A2634] border-r border-gray-800", className)}>
      <div className="p-4 border-b border-gray-800">
        <h1 className="font-heading font-bold text-2xl text-white tracking-wider">
          <span className="text-[#00FFAA]">Crypto</span>Play
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-gray-300 rounded-lg group transition-colors",
                isActive(item.path) 
                  ? "bg-[#0F1923] text-white" 
                  : "hover:bg-[#0F1923] hover:text-white"
              )}
            >
              <span className={cn(
                "mr-3", 
                isActive(item.path) 
                  ? "text-[#00FFAA]" 
                  : "text-gray-400 group-hover:text-[#00FFAA]"
              )}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#00FFAA] flex items-center justify-center text-[#0F1923]">
            <User className="h-4 w-4" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <button 
              onClick={() => logoutMutation.mutate()}
              className="text-xs text-gray-400 hover:text-[#00FFAA]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
