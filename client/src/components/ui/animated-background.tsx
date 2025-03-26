import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedBackground({ children, className = '' }: AnimatedBackgroundProps) {
  const [colorScheme, setColorScheme] = useState(0);
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
    const numParticles = 40;
    const colorSchemeData = colorSchemes[colorScheme];
    
    // Limpiar partículas existentes
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Crear partículas
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full';
      particle.style.backgroundColor = colorSchemeData.accent;
      particle.style.opacity = (Math.random() * 0.3 + 0.1).toString();
      particle.style.width = `${Math.random() * 6 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.dataset.speedX = ((Math.random() - 0.5) * 0.5).toString();
      particle.dataset.speedY = ((Math.random() - 0.5) * 0.5).toString();
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
  }, [colorScheme]);

  // Cambiar el esquema de color periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setColorScheme(prev => (prev + 1) % colorSchemes.length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Fondo animado */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${colorSchemes[colorScheme].background}`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{ 
          duration: 15,
          ease: 'linear', 
          repeat: Infinity, 
          repeatType: 'reverse'
        }}
      >
        {/* Contenedor para partículas */}
        <div 
          ref={particlesRef}
          className="absolute inset-0 overflow-hidden"
        />
        
        {/* Efecto de brillo */}
        <div className="absolute inset-0 backdrop-blur-[100px]" />
        
        {/* Malla difuminada */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </motion.div>
      
      {/* Contenido principal */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}