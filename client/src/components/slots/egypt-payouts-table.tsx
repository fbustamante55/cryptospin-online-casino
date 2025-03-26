import React from 'react';
import { 
  SVG_BOOK, 
  SVG_PHARAOH, 
  SVG_ANKH, 
  SVG_EYE_OF_HORUS, 
  SVG_SCARAB, 
  SVG_HIEROGLYPH 
} from './book-of-egypt-icons';

interface EgyptPayoutsTableProps {
  className?: string;
}

export function EgyptPayoutsTable({ className = '' }: EgyptPayoutsTableProps) {
  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#ffc82c" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5 mr-2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
          <line x1="12" y1="8" x2="12" y2="8"></line>
        </svg>
        <h2 className="text-xl font-bold text-white">Tesoros de Egipto</h2>
      </div>

      <div className="space-y-3">
        {/* Libro (Scatter) */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_BOOK} alt="Libro Sagrado" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Tres Libros Sagrados</span>
          </div>
          <span className="text-green-400 font-bold">10x</span>
        </div>

        {/* Faraón */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_PHARAOH} alt="Faraón" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Tres Faraones</span>
          </div>
          <span className="text-green-400 font-bold">5x</span>
        </div>

        {/* Ankh */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_ANKH} alt="Ankh" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Tres Ankhs</span>
          </div>
          <span className="text-green-400 font-bold">4x</span>
        </div>

        {/* Ojo de Horus */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_EYE_OF_HORUS} alt="Ojo de Horus" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Tres Ojos de Horus</span>
          </div>
          <span className="text-green-400 font-bold">3x</span>
        </div>

        {/* Escarabajo */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_SCARAB} alt="Escarabajo" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Tres Escarabajos</span>
          </div>
          <span className="text-green-400 font-bold">2.5x</span>
        </div>

        {/* Cualquier símbolo egipcio */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <img src={SVG_HIEROGLYPH} alt="Jeroglífico" className="w-8 h-8 mr-2" />
            <span className="text-amber-400">Símbolos iguales</span>
          </div>
          <span className="text-green-400 font-bold">2x</span>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-white flex items-center mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ffc82c" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5 mr-2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Partidas Recientes
        </h3>
        
        <div className="text-gray-400 text-center py-6">
          No hay partidas recientes
        </div>
      </div>
    </div>
  );
}