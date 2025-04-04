import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ChevronDown, 
  Wallet, 
  Gift, 
  Settings, 
  Clock, 
  UserCircle, 
  Share, 
  HelpCircle, 
  Headset, 
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { icon: <Wallet size={18} />, label: "Cajero", link: "/wallet" },
    { icon: <Gift size={18} />, label: "Recompensas", link: "#", badge: "1" },
    { icon: <Settings size={18} />, label: "Ajustes de cuenta", link: "#" },
    { icon: <UserCircle size={18} />, label: "Perfil", link: "/profile" },
    { icon: <Clock size={18} />, label: "Historial", link: "/history" },
    { icon: <Share size={18} />, label: "Recomienda y gana", link: "#" },
    { icon: <HelpCircle size={18} />, label: "Centro de ayuda", link: "#" },
    { icon: <Headset size={18} />, label: "Soporte en vivo", link: "#" }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#192531] border border-[#1c2b3a] hover:bg-[#1c2b3a] transition-colors"
      >
        <div className="flex items-center">
          <div className="w-7 h-7 bg-[#09b66d] rounded-full flex items-center justify-center text-[#0e1824]">
            <User size={16} />
          </div>
          <div className="ml-2 text-left hidden lg:block">
            <p className="text-sm font-medium text-white truncate max-w-[100px]">{user?.username}</p>
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-[#09b66d] mr-1"></span>
              <span className="text-xs text-[#09b66d]">Online</span>
            </div>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[#0e1824] border border-[#1c2b3a] overflow-hidden z-20">
          <div className="p-3 border-b border-[#1c2b3a]">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#09b66d] rounded-full flex items-center justify-center text-[#0e1824]">
                <User size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-gray-900">
                  VIP
                </span>
              </div>
            </div>
          </div>
          
          <div className="py-1">
            {menuItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.link}
                className="flex items-center px-4 py-2.5 text-sm text-white hover:bg-[#192531] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-[#627087] mr-3">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 bg-yellow-500 rounded-full text-[10px] text-gray-900 font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            
            <div className="border-t border-[#1c2b3a] mt-1">
              <button 
                onClick={() => {
                  logoutMutation.mutate();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-white hover:bg-red-600/10 transition-colors"
              >
                <span className="text-red-500 mr-3">
                  <LogOut size={18} />
                </span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}