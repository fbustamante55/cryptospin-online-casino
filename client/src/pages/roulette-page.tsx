import React, { useEffect, useState, useRef } from 'react';
import { RouletteGame } from '@/components/roulette/roulette-game';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { motion, useAnimationControls } from 'framer-motion';

export default function RoulettePage() {
  const { user } = useAuth() || {};
  const [currentColorScheme, setCurrentColorScheme] = useState(0);
  const backgroundControls = useAnimationControls();
  const particlesRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Esquemas de colores para transiciones
  const colorSchemes = [
    { background: 'from-black via-[#1E1E3F] to-[#3D0000]', accent: '#ff3a3a' },
    { background: 'from-[#000F1A] via-[#002440] to-[#003A66]', accent: '#00a3ff' },
    { background: 'from-[#001A02] via-[#003D07] to-[#005C0C]', accent: '#00ff44' },
    { background: 'from-[#1A0020] via-[#350040] to-[#5F0073]', accent: '#d275ff' },
    { background: 'from-[#201A00] via-[#403500] to-[#736000]', accent: '#ffce00' },
  ];

  // Partículas animadas para el fondo
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const container = particlesRef.current;
    const particles: HTMLDivElement[] = [];
    const numParticles = 50;
    const colorScheme = colorSchemes[currentColorScheme];
    
    // Crear partículas
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full';
      particle.style.backgroundColor = colorScheme.accent;
      particle.style.opacity = (Math.random() * 0.3 + 0.1).toString();
      particle.style.width = `${Math.random() * 6 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.dataset.speedX = ((Math.random() - 0.5) * 0.7).toString();
      particle.dataset.speedY = ((Math.random() - 0.5) * 0.7).toString();
      container.appendChild(particle);
      particles.push(particle);
    }
    
    // Animar partículas
    function animateParticles() {
      particles.forEach(p => {
        const speedX = parseFloat(p.dataset.speedX || '0');
        const speedY = parseFloat(p.dataset.speedY || '0');
        const x = parseFloat(p.style.left);
        const y = parseFloat(p.style.top);
        
        let newX = x + speedX;
        let newY = y + speedY;
        
        // Rebotar en los bordes
        if (newX > 100) {
          newX = 100;
          p.dataset.speedX = (-speedX).toString();
        } else if (newX < 0) {
          newX = 0;
          p.dataset.speedX = (-speedX).toString();
        }
        
        if (newY > 100) {
          newY = 100;
          p.dataset.speedY = (-speedY).toString();
        } else if (newY < 0) {
          newY = 0;
          p.dataset.speedY = (-speedY).toString();
        }
        
        p.style.left = `${newX}%`;
        p.style.top = `${newY}%`;
      });
      
      animationFrameRef.current = requestAnimationFrame(animateParticles);
    }
    
    animationFrameRef.current = requestAnimationFrame(animateParticles);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Limpiar partículas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [currentColorScheme]);

  // Cambiar el esquema de color periódicamente
  useEffect(() => {
    // Transición inicial
    backgroundControls.start({
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: { duration: 15, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }
    });
    
    // Cambiar el esquema de color cada 30 segundos
    const interval = setInterval(() => {
      setCurrentColorScheme(prev => (prev + 1) % colorSchemes.length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${colorSchemes[currentColorScheme].background}`}
        animate={backgroundControls}
        transition={{ duration: 2 }}
      >
        {/* Contenedor para partículas */}
        <div 
          ref={particlesRef}
          className="absolute inset-0 overflow-hidden"
        ></div>
        
        {/* Efecto de brillo */}
        <div className="absolute inset-0 backdrop-blur-[100px]"></div>
        
        {/* Malla difuminada */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        ></div>
      </motion.div>
      
      {/* Contenido principal */}
      <div className="container relative mx-auto p-4 z-10">
        <div className="mb-6 space-y-2">
          <motion.h1 
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Ruleta
          </motion.h1>
          <motion.p 
            className="text-gray-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            El clásico juego de casino. ¡Coloca tus apuestas y gana a lo grande!
          </motion.p>
          {user && (
            <motion.div 
              className="text-lg font-medium text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Balance: <span className="text-[#00FFAA] font-bold">${user.balance.toLocaleString()}</span>
            </motion.div>
          )}
        </div>
        
        <Separator className="my-6 bg-white/20" />
        
        {/* Contenedor del juego con fondo semitransparente */}
        <motion.div 
          className="bg-black/60 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RouletteGame />
        </motion.div>
      </div>
    </div>
  );
}