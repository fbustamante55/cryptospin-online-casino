import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RouletteWheelProps {
  spinning: boolean;
  onSpinComplete: (number: number) => void;
}

// Configuración de la ruleta
const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Colores correspondientes a cada número
const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
  if (number === 0) return 'green';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? 'red' : 'black';
};

export function RouletteWheel({ spinning, onSpinComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  
  useEffect(() => {
    if (spinning) {
      // Elegir un número ganador aleatorio
      const randomIndex = Math.floor(Math.random() * numbers.length);
      const chosenNumber = numbers[randomIndex];
      setWinningNumber(chosenNumber);
      
      // Calcular la rotación final para que el número ganador quede en la parte superior
      const baseRotation = 360 * 8; // Girar varias vueltas completas
      const segmentAngle = 360 / numbers.length;
      const numberPosition = numbers.indexOf(chosenNumber) * segmentAngle;
      const targetRotation = baseRotation + numberPosition;
      
      // Aplicar la rotación
      setRotation(targetRotation);
      
      // Notificar cuando se complete el giro
      const spinDuration = 5000; // 5 segundos
      setTimeout(() => {
        if (chosenNumber !== null) {
          onSpinComplete(chosenNumber);
        }
      }, spinDuration);
    } else {
      // Reiniciar la rotación cuando se detenga el giro
      setRotation(0);
      setWinningNumber(null);
    }
  }, [spinning, onSpinComplete]);
  
  return (
    <div className="relative flex items-center justify-center my-8">
      <div className="w-64 h-64 md:w-80 md:h-80 relative">
        {/* Fondo fijo de la ruleta */}
        <div className="absolute inset-0 rounded-full bg-[#263850] shadow-lg border-4 border-[#1b2736]"></div>
        
        {/* Ruleta giratoria */}
        <motion.div 
          className="absolute inset-0 rounded-full overflow-hidden"
          animate={{ 
            rotate: spinning ? rotation : 0 
          }}
          transition={{ 
            duration: spinning ? 5 : 0,
            ease: spinning ? [0.2, 0.65, 0.3, 0.9] : 'easeInOut'
          }}
        >
          {/* Segmentos de la ruleta */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="50" fill="#1b2736" />
            
            {numbers.map((number, index) => {
              const angle = (index * 360) / numbers.length;
              const color = getNumberColor(number);
              
              return (
                <g key={number} transform={`rotate(${angle}, 50, 50)`}>
                  <path 
                    d={`M 50 50 L 50 0 A 50 50 0 0 1 ${50 + 50 * Math.sin(Math.PI / numbers.length)} ${50 - 50 * Math.cos(Math.PI / numbers.length)} Z`}
                    fill={color === 'red' ? '#e53935' : color === 'black' ? '#212121' : '#388e3c'}
                  />
                  <text 
                    x="50" 
                    y="15" 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="6" 
                    fontWeight="bold"
                    transform={`rotate(${90}, 50, 15)`}
                  >
                    {number}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        
        {/* Marcador/aguja */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-red-600"></div>
      </div>
      
      {/* Número ganador */}
      {winningNumber !== null && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold">
          {!spinning && (
            <div className="bg-[#1b2736] rounded-full w-12 h-12 flex items-center justify-center border-2 border-[#e53935]">
              {winningNumber}
            </div>
          )}
        </div>
      )}
    </div>
  );
}