import React, { useEffect, useRef, useState } from 'react';
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
              />
            </div>
          </div>
          
          {/* Lista de monedas */}
          <div className="max-h-60 overflow-y-auto">
            {currencies.map((currency) => (
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
                <div className="text-white text-sm">{currency.value.toFixed(8)}</div>
              </div>
            ))}
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