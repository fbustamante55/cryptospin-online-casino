import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RouletteWheelProps {
  spinning: boolean;
  onSpinComplete: (number: number) => void;
  resultNumber?: number | null;
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

export function RouletteWheel({ spinning, onSpinComplete, resultNumber }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: -45 }); // Posición inicial de la bola
  const [showIndicator, setShowIndicator] = useState(false);
  const [animateWinner, setAnimateWinner] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Calcular la posición de la bola
  const calculateBallPosition = (angle: number) => {
    // La bola se mueve en dirección opuesta a la rueda
    const radians = ((angle % 360) * Math.PI) / 180;
    const radius = 45; // Radio para la posición de la bola
    const x = radius * Math.sin(radians);
    const y = -radius * Math.cos(radians);
    return { x, y };
  };
  
  useEffect(() => {
    if (spinning) {
      // Reiniciar animación
      setAnimateWinner(false);
      setShowIndicator(false);
      
      // Elegir un número ganador aleatorio o usar el proporcionado
      let chosenNumber;
      if (resultNumber !== undefined && resultNumber !== null) {
        chosenNumber = resultNumber;
      } else {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        chosenNumber = numbers[randomIndex];
      }
      
      setWinningNumber(chosenNumber);
      
      // Calcular la rotación final para que el número ganador quede en la parte superior
      const baseRotation = 360 * 8; // Girar varias vueltas completas
      const segmentAngle = 360 / numbers.length;
      const numberPosition = numbers.indexOf(chosenNumber) * segmentAngle;
      const targetRotation = baseRotation + numberPosition;
      
      // Aplicar la rotación
      setRotation(targetRotation);
      
      // Animación de la bola
      const ballAnimation = setInterval(() => {
        const currentTime = Date.now();
        const ballAngle = (currentTime / 10) % 360;
        setBallPosition(calculateBallPosition(ballAngle));
      }, 16);
      
      // Notificar cuando se complete el giro
      const spinDuration = 5000; // 5 segundos
      
      // Mostrar el indicador justo antes de terminar
      setTimeout(() => {
        setShowIndicator(true);
        clearInterval(ballAnimation);
        
        // Calcular la posición final de la bola (opuesta a la posición del número ganador)
        const finalBallAngle = numberPosition + 180;
        setBallPosition(calculateBallPosition(finalBallAngle));
      }, spinDuration - 500);
      
      setTimeout(() => {
        if (chosenNumber !== null) {
          setAnimateWinner(true);
          onSpinComplete(chosenNumber);
        }
      }, spinDuration);
    } else if (!spinning && winningNumber === null) {
      // Reiniciar cuando no está girando y no hay número ganador
      setRotation(0);
      setBallPosition({ x: 0, y: -45 });
      setShowIndicator(false);
      setAnimateWinner(false);
    }
  }, [spinning, onSpinComplete, resultNumber]);
  
  return (
    <div className="relative flex items-center justify-center my-8">
      <div className="w-64 h-64 md:w-80 md:h-80 relative" ref={wheelRef}>
        {/* Fondo y borde exterior de la ruleta */}
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
              const isWinningNumber = number === winningNumber && !spinning && animateWinner;
              
              return (
                <g key={number} transform={`rotate(${angle}, 50, 50)`}>
                  <path 
                    d={`M 50 50 L 50 0 A 50 50 0 0 1 ${50 + 50 * Math.sin(Math.PI / numbers.length)} ${50 - 50 * Math.cos(Math.PI / numbers.length)} Z`}
                    fill={color === 'red' ? '#e53935' : color === 'black' ? '#212121' : '#388e3c'}
                    className={isWinningNumber ? 'animate-pulse' : ''}
                    style={isWinningNumber ? { filter: 'brightness(1.5)' } : {}}
                  />
                  <text 
                    x="50" 
                    y="15" 
                    textAnchor="middle" 
                    fill={isWinningNumber ? '#ffff00' : 'white'}
                    fontSize={isWinningNumber ? '8' : '6'}
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
        
        {/* Marcador/aguja en la parte superior */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-red-600 z-20"></div>
        
        {/* Bola de la ruleta (animada) */}
        <motion.div
          className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10"
          style={{
            x: ballPosition.x,
            y: ballPosition.y,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
        
        {/* Destello cuando la bola cae en su posición final */}
        <AnimatePresence>
          {showIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 top-1/2 w-8 h-8 rounded-full bg-white/20 z-5"
              style={{
                x: ballPosition.x,
                y: ballPosition.y,
                translateX: '-50%',
                translateY: '-50%',
              }}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Número ganador (indicador mayor) */}
      <AnimatePresence>
        {winningNumber !== null && !spinning && animateWinner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ${
              getNumberColor(winningNumber) === 'red' 
                ? 'bg-red-600' 
                : getNumberColor(winningNumber) === 'black' 
                  ? 'bg-gray-900' 
                  : 'bg-green-600'
            } border-4 border-white`}>
              {winningNumber}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}