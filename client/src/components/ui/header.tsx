import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Search, Gift, Bell, ChevronDown, Menu, X, User, Wallet, History, Trophy, Settings, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { CurrencyDropdown } from "@/components/ui/currency-dropdown";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { DepositModal } from "@/components/ui/deposit-modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ChevronDown SVG como fallback por si hay problemas con lucide-react
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

interface HeaderProps {
  className?: string;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ className, onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Lista de criptomonedas disponibles con su valor (todos a 0)
  const currencies = [
    { code: 'BTC', name: 'Bitcoin', value: 0.00000000, icon: '₿', color: '#f7931a' },
    { code: 'ETH', name: 'Ethereum', value: 0.00000000, icon: 'Ξ', color: '#627eea' },
    { code: 'LTC', name: 'Litecoin', value: 0.00000000, icon: 'Ł', color: '#b8b8b8' },
    { code: 'USDT', name: 'Tether', value: 0.00000000, icon: '₮', color: '#26a17b' },
    { code: 'SOL', name: 'Solana', value: 0.00000000, icon: '◎', color: '#00ffbd' },
    { code: 'DOGE', name: 'Dogecoin', value: 0.00000000, icon: 'Ð', color: '#c2a633' },
    { code: 'BCH', name: 'Bitcoin Cash', value: 0.00000000, icon: '₿', color: '#8dc351' },
    { code: 'XRP', name: 'Ripple', value: 0.00000000, icon: '✕', color: '#23292f' },
    { code: 'TRX', name: 'TRON', value: 0.00000000, icon: '♦', color: '#ef0027' },
    { code: 'EOS', name: 'EOS', value: 0.00000000, icon: 'ε', color: '#000000' }
  ];
  
  // Obtener la moneda seleccionada
  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[3]; // USDT por defecto

  const currencyTriggerRef = useRef<HTMLDivElement>(null);
  
  // Detectar scroll para aplicar efectos al header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Ref para el menú de usuario
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Cerrar el menú de usuario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <>
      {/* Modal de depósito */}
      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
      
      {/* Header - Versión desktop y mobile */}
      <header 
        className={cn(
          "bg-[#0e1824] border-b border-[#1c2b3a] sticky top-0 z-40 w-full",
          isScrolled && "shadow-md backdrop-blur-sm bg-[#0e1824]/95",
          className
        )}
      >
        {/* Contenido del header para versión desktop */}
        <div className="hidden md:flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#09b66d] to-[#f8c541] text-transparent bg-clip-text font-['Montserrat']">CRYPTOSPIN</h1>
            </Link>
          </div>
          
          {/* Balance con selector de criptomonedas y botón de depósito */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center space-x-3 relative">
              {/* Caja única con selector y botón de depósito */}
              <div className="flex items-center bg-[#0e1824] rounded-full border border-[#1c2b3a] overflow-hidden">
                {/* Selector de divisas */}
                <div 
                  ref={currencyTriggerRef}
                  className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-[#192531]/70 transition-all duration-200"
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                >
                  <div className="h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: currentCurrency.color }}>
                    {currentCurrency.icon}
                  </div>
                  <span className="text-white text-sm font-bold">{currentCurrency.value.toFixed(8)}</span>
                  <div className={`h-4 w-4 ml-2 text-white transition-transform ${isWalletOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </div>
                
                {/* Línea vertical separadora */}
                <div className="h-6 w-px bg-[#1c2b3a]"></div>
                
                {/* Botón de depósito */}
                <button 
                  className="flex items-center px-5 py-1.5 bg-[#09b66d] hover:bg-[#0fda85] text-white font-bold text-sm transition-all duration-200"
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  {t('deposit')}
                </button>
              </div>
              
              {/* Usando nuestro componente de portal de monedas */}
              <CurrencyDropdown 
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                currencies={currencies}
                selectedCurrency={selectedCurrency}
                onCurrencySelect={setSelectedCurrency}
                triggerRef={currencyTriggerRef}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
              <Search className="h-5 w-5" />
            </button>
            
            <button className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] text-white hover:border-[#09b66d]/50 transition-all duration-200">
              <Gift className="h-5 w-5" />
            </button>
            
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[#192531] border border-[#1c2b3a] hover:border-[#09b66d]/50 transition-all duration-200">
              <NotificationDropdown />
            </div>
            
            <div className="relative">
              <div 
                className="flex items-center bg-[#192531] border border-[#1c2b3a] rounded-md px-1 py-1 cursor-pointer hover:border-[#09b66d]/50 transition-all duration-200"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#09b66d] flex items-center justify-center text-white font-bold">
                    {user?.username?.substring(0, 1) || 'U'}
                  </div>
                  <div className="px-2">
                    <div className="text-xs text-white font-medium max-w-[80px] truncate">
                      {user?.username || 'Usuario'}
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-[#09b66d] rounded-full mr-1"></div>
                      <span className="text-[10px] text-gray-400">VIP</span>
                    </div>
                  </div>
                  {/* Using ChevronDown component for dropdown indicator */}
                  <ChevronDown className={`h-4 w-4 text-white mr-1 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {/* Dropdown menu */}
              {isUserMenuOpen && (
                <div ref={userMenuRef} className="absolute right-0 mt-2 w-56 bg-[#192531] border border-[#1c2b3a] rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-[#1c2b3a]">
                    <p className="text-sm text-white font-semibold">{user?.username || 'Usuario'}</p>
                    <p className="text-xs text-gray-400 mt-1">Balance: {currentCurrency.value.toFixed(8)} {currentCurrency.code}</p>
                  </div>
                  
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Mi Perfil</span>
                    </div>
                  </Link>
                  
                  <Link href="/wallet" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      <span>Mi Billetera</span>
                    </div>
                  </Link>
                  
                  <Link href="/history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <History className="h-4 w-4 mr-2" />
                      <span>Historial de Apuestas</span>
                    </div>
                  </Link>
                  
                  <Link href="/vip" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>Programa VIP</span>
                      <Badge className="ml-auto bg-[#09b66d] text-[10px]">Nivel 2</Badge>
                    </div>
                  </Link>
                  
                  <Link href="/bonuses" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-2" />
                      <span>Mis Bonos</span>
                      <Badge className="ml-auto bg-[#f8c541] text-[10px] text-black">2</Badge>
                    </div>
                  </Link>
                  
                  <div className="border-t border-[#1c2b3a] mt-1"></div>
                  
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#0e1824] hover:text-white">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Configuración</span>
                    </div>
                  </Link>
                  
                  <button className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-[#0e1824]">
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Cerrar Sesión</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Header para versión móvil */}
        <div className="md:hidden flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <button 
              type="button" 
              className="text-gray-400 hover:text-white focus:outline-none mr-2"
              onClick={onMobileMenuToggle}
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Link href="/" className="flex items-center">
              <h1 className="font-heading font-bold text-xl text-white tracking-wider">
                <span className="text-[#09b66d]">Crypto</span>Spin
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="flex items-center py-1.5 px-3 bg-[#09b66d] hover:bg-[#0fda85] text-white font-bold text-sm rounded-full transition-all duration-200"
              onClick={() => setIsDepositModalOpen(true)}
            >
              {t('deposit')}
            </button>
            
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#192531] border border-[#1c2b3a] text-white">
              <Bell className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}