import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Settings } from 'lucide-react';
import { WalletSettings } from './wallet-settings';

interface CurrencyDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: any[];
  selectedCurrency: string;
  onCurrencySelect: (code: string) => void;
  triggerRef: React.RefObject<HTMLDivElement>;
}

// Tipo para la configuración del monedero
interface WalletSettings {
  hideZeroBalances: boolean;
  showFiatEquivalent: boolean;
  selectedFiat: string;
}

export function CurrencyDropdown({ 
  isOpen, 
  onClose, 
  currencies, 
  selectedCurrency, 
  onCurrencySelect,
  triggerRef
}: CurrencyDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Obtener la configuración del monedero del localStorage
  const [walletSettings, setWalletSettings] = useState<WalletSettings>({
    hideZeroBalances: localStorage.getItem('walletSettings.hideZeroBalances') === 'true',
    showFiatEquivalent: localStorage.getItem('walletSettings.showFiatEquivalent') !== 'false',
    selectedFiat: localStorage.getItem('walletSettings.selectedFiat') || 'USD'
  });
  
  useEffect(() => {
    // Función para manejar clics fuera del menú desplegable
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    
    // Función para manejar tecla Escape
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    // Agregar event listeners
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);
  
  // Calcular la posición del dropdown basada en el elemento disparador
  const [position, setPosition] = React.useState({
    top: 0,
    left: 0,
  });
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen, triggerRef]);
  
  // Escuchar cambios en la configuración del monedero
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<WalletSettings>;
      setWalletSettings(customEvent.detail);
    };
    
    document.addEventListener('walletSettingsChanged', handleSettingsChange as EventListener);
    
    return () => {
      document.removeEventListener('walletSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);
  
  // Aplicar filtros según la configuración y la búsqueda
  const filteredCurrencies = useMemo(() => {
    return currencies.filter(currency => {
      // Aplicar filtro de búsqueda
      if (searchQuery && !currency.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Aplicar filtro de ocultar saldos en cero
      if (walletSettings.hideZeroBalances && currency.value === 0) {
        return false;
      }
      
      return true;
    });
  }, [currencies, searchQuery, walletSettings.hideZeroBalances]);
  
  // Renderizar el modal de configuración del monedero y el dropdown
  return (
    <>
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
          }}
          className="bg-[#0e1824] border border-[#1c2b3a] rounded-lg shadow-lg w-60"
        >
          {/* Buscador */}
          <div className="p-3 border-b border-[#1c2b3a]">
            <div className="flex items-center bg-[#192531] rounded-md px-3 py-2">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input 
                className="bg-transparent text-white text-sm w-full focus:outline-none" 
                placeholder="Buscar Divisas" 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Lista de monedas */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCurrencies.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No se encontraron divisas
              </div>
            ) : (
              filteredCurrencies.map((currency) => {
                // Calcular el valor a mostrar (crypto o fiat equivalente)
                let displayValue = currency.value;
                let displayValueStr = "";
                
                if (walletSettings.showFiatEquivalent) {
                  // Convertir a la moneda fiat seleccionada
                  // Aquí es necesario un tipo de cambio real, pero como ejemplo usamos valores inventados
                  const cryptoToFiatRate = {
                    USD: { BTC: 42500, ETH: 2700, XRP: 0.52, LTC: 72, BCH: 340 },
                    EUR: { BTC: 39000, ETH: 2480, XRP: 0.48, LTC: 66, BCH: 314 },
                    JPY: { BTC: 6320000, ETH: 402000, XRP: 77, LTC: 10700, BCH: 50800 },
                    // Añadir más monedas y tipos de cambio según sea necesario
                  };
                  
                  // Usar el tipo de cambio correspondiente o un valor por defecto
                  const rateTable = cryptoToFiatRate[walletSettings.selectedFiat as keyof typeof cryptoToFiatRate] || cryptoToFiatRate.USD;
                  const rate = rateTable[currency.code as keyof typeof rateTable] || 1;
                  
                  // Calcular el valor en la moneda fiat
                  displayValue = currency.value * rate;
                  
                  // Formatear según la moneda (diferentes posiciones decimales)
                  if (walletSettings.selectedFiat === 'JPY') {
                    displayValueStr = displayValue.toFixed(0);
                  } else {
                    displayValueStr = displayValue.toFixed(2);
                  }
                  
                  // Añadir el símbolo de la moneda fiat
                  const fiatSymbols: {[key: string]: string} = {
                    USD: '$', EUR: '€', JPY: '¥', INR: '₹', GBP: '£',
                    ARS: 'AR$', BRL: 'R$', CAD: 'C$', CLP: 'CLP', CNY: '¥',
                    IDR: 'Rp', KRW: '₩', MXN: 'MX$', NGN: '₦', PEN: 'S/',
                    PHP: '₱', PLN: 'zł', RUB: '₽', TRY: '₺', VND: '₫'
                  };
                  
                  displayValueStr = `${fiatSymbols[walletSettings.selectedFiat] || ''}${displayValueStr}`;
                } else {
                  // Mostrar el valor en crypto normalmente
                  displayValueStr = displayValue.toFixed(8);
                }
                
                return (
                  <div 
                    key={currency.code} 
                    className={`flex items-center justify-between p-3 hover:bg-[#192531] cursor-pointer ${currency.code === selectedCurrency ? 'bg-[#192531]' : ''}`}
                    onClick={() => {
                      onCurrencySelect(currency.code);
                      onClose();
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3`} style={{ backgroundColor: currency.color }}>
                        <span className="text-white text-xs font-bold">{currency.icon}</span>
                      </div>
                      <div className="text-white text-sm">{currency.code}</div>
                    </div>
                    <div className="text-white text-sm">
                      {displayValueStr}
                      {walletSettings.showFiatEquivalent && (
                        <div className="text-gray-400 text-xs text-right">
                          {currency.value.toFixed(8)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-[#1c2b3a]">
            <div 
              className="flex items-center text-[#09b66d] hover:text-[#0fda85] text-sm cursor-pointer"
              onClick={() => {
                setIsSettingsOpen(true);
                onClose(); // Cerrar el dropdown al abrir la configuración
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Configuración de Monedero</span>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <WalletSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}