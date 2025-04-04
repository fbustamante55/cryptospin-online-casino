import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FiatCurrency {
  code: string;
  name: string;
  symbol: string;
}

export function WalletSettings({ isOpen, onClose }: WalletSettingsProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  // Inicializar con valores del localStorage o valores por defecto
  const [hideZeroBalances, setHideZeroBalances] = React.useState(() => {
    return localStorage.getItem('walletSettings.hideZeroBalances') === 'true' || false;
  });
  const [showFiatEquivalent, setShowFiatEquivalent] = React.useState(() => {
    return localStorage.getItem('walletSettings.showFiatEquivalent') === 'false' ? false : true;
  });
  const [selectedFiat, setSelectedFiat] = React.useState(() => {
    return localStorage.getItem('walletSettings.selectedFiat') || 'USD';
  });
  
  const fiatCurrencies: FiatCurrency[] = [
    { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Yen japonés', symbol: '¥' },
    { code: 'INR', name: 'Rupia india', symbol: '₹' },
    { code: 'ARS', name: 'Peso argentino', symbol: 'AR$' },
    { code: 'BRL', name: 'Real brasileño', symbol: 'R$' },
    { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$' },
    { code: 'CLP', name: 'Peso chileno', symbol: 'CLP' },
    { code: 'CNY', name: 'Yuan chino', symbol: '¥' },
    { code: 'IDR', name: 'Rupia indonesia', symbol: 'Rp' },
    { code: 'KRW', name: 'Won surcoreano', symbol: '₩' },
    { code: 'MXN', name: 'Peso mexicano', symbol: '$' },
    { code: 'NGN', name: 'Naira nigeriana', symbol: '₦' },
    { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
    { code: 'PHP', name: 'Peso filipino', symbol: '₱' },
    { code: 'PLN', name: 'Złoty polaco', symbol: 'zł' },
    { code: 'RUB', name: 'Rublo ruso', symbol: '₽' },
    { code: 'TRY', name: 'Lira turca', symbol: '₺' },
    { code: 'VND', name: 'Đồng vietnamita', symbol: '₫' },
  ];
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll en el body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      // Restaurar scroll en el body cuando el modal se cierra
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  const handleSave = () => {
    // Guardar la configuración en localStorage
    localStorage.setItem('walletSettings.hideZeroBalances', hideZeroBalances.toString());
    localStorage.setItem('walletSettings.showFiatEquivalent', showFiatEquivalent.toString());
    localStorage.setItem('walletSettings.selectedFiat', selectedFiat);
    
    // Publicar un evento personalizado para notificar a otros componentes del cambio
    const event = new CustomEvent('walletSettingsChanged', {
      detail: {
        hideZeroBalances,
        showFiatEquivalent,
        selectedFiat
      }
    });
    document.dispatchEvent(event);
    
    console.log('Configuración guardada:', {
      hideZeroBalances,
      showFiatEquivalent,
      selectedFiat
    });
    onClose();
  };
  
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-[#0e1824] border border-[#1c2b3a] rounded-lg shadow-lg w-[400px] max-w-[90vw]"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2b3a]">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l2-2m0 0l7-7 7 7M5 4v14a2 2 0 002 2h10a2 2 0 002-2V4"></path>
            </svg>
            <h2 className="text-white font-bold">Configuración de Monedero</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-4">
          {/* Ocultar saldos en cero */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-semibold">Ocultar saldos en cero</label>
              <button 
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 ${hideZeroBalances ? 'bg-[#09b66d] justify-end' : 'bg-[#192531] justify-start'}`}
                onClick={() => setHideZeroBalances(!hideZeroBalances)}
              >
                <span className="w-5 h-5 bg-white rounded-full mx-0.5"></span>
              </button>
            </div>
            <p className="text-gray-400 text-sm">Los balances que estén en cero no aparecerán en tu monedero</p>
          </div>
          
          {/* Mostrar criptos en fiat */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-semibold">Mostrar criptos en fiat</label>
              <button 
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 ${showFiatEquivalent ? 'bg-[#09b66d] justify-end' : 'bg-[#192531] justify-start'}`}
                onClick={() => setShowFiatEquivalent(!showFiatEquivalent)}
              >
                <span className="w-5 h-5 bg-white rounded-full mx-0.5"></span>
              </button>
            </div>
            <p className="text-gray-400 text-sm">Todas las apuestas y transacciones se determinarán en su equivalente en criptomonedas</p>
          </div>
          
          {/* Selección de moneda fiat */}
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-2">
              {fiatCurrencies.map(currency => (
                <button
                  key={currency.code}
                  className={`flex items-center justify-center p-2 rounded-md border ${
                    selectedFiat === currency.code 
                      ? 'border-[#09b66d] bg-[#192531]' 
                      : 'border-[#1c2b3a] bg-[#0e1824] hover:bg-[#192531]/50'
                  } transition-colors duration-200`}
                  onClick={() => setSelectedFiat(currency.code)}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-white text-xs mb-1">{currency.code}</span>
                    <span className="text-[#09b66d] text-lg">{currency.symbol}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Aviso */}
          <div className="mb-6 text-gray-400 text-sm">
            Ten en cuenta que el valor provisto es una aproximación.
          </div>
        </div>
        
        {/* Footer con botón de guardar */}
        <div className="border-t border-[#1c2b3a] p-4 flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-[#09b66d] hover:bg-[#0fda85] text-white font-bold"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}