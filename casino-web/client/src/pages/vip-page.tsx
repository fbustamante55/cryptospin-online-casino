import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Crown,
  Star,
  Gift,
  DollarSign,
  Zap,
  Clock,
  HeadphonesIcon,
  Target,
  Shield,
  Sparkles,
  AlertCircle
} from "lucide-react";

// Define VIP levels and their colors/details
const vipLevels = [
  { 
    name: "Bronce", 
    color: "#CD7F32", 
    textColor: "text-amber-700",
    bgColor: "bg-amber-700/20",
    borderColor: "border-amber-700/50",
    icon: Star,
    benefits: [
      "2% Rakeback semanal",
      "Bonos semanales de hasta $50",
      "Acceso a promociones estándar",
      "Soporte 24/7"
    ],
    requirements: "Apostar $500 en total"
  },
  { 
    name: "Plata", 
    color: "#C0C0C0", 
    textColor: "text-gray-400",
    bgColor: "bg-gray-400/20",
    borderColor: "border-gray-400/50",
    icon: Trophy,
    benefits: [
      "3% Rakeback semanal",
      "Bonos mensuales de hasta $200",
      "Promociones especiales",
      "Mayor velocidad de procesamiento de retiros",
      "Atención a cliente prioritaria"
    ],
    requirements: "Apostar $2,000 en total"
  },
  { 
    name: "Oro", 
    color: "#FFD700", 
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    borderColor: "border-yellow-400/50",
    icon: Crown,
    benefits: [
      "5% Rakeback semanal",
      "Bonos mensuales de hasta $500",
      "Promociones exclusivas",
      "Retiros prioritarios",
      "Soporte VIP dedicado",
      "Bonos de recarga mejorados"
    ],
    requirements: "Apostar $10,000 en total"
  },
  { 
    name: "Platino", 
    color: "#E5E4E2", 
    textColor: "text-indigo-300",
    bgColor: "bg-indigo-300/20",
    borderColor: "border-indigo-300/50",
    icon: Sparkles,
    benefits: [
      "7% Rakeback semanal",
      "Bonos mensuales de hasta $1,000",
      "Recargas diarias",
      "Anfitrión VIP personal",
      "Promociones personalizadas",
      "Límites de apuestas más altos",
      "Cashback en pérdidas"
    ],
    requirements: "Apostar $50,000 en total"
  },
  { 
    name: "Diamante", 
    color: "#B9F2FF", 
    textColor: "text-sky-400",
    bgColor: "bg-sky-400/20",
    borderColor: "border-sky-400/50",
    icon: Zap,
    benefits: [
      "10% Rakeback semanal",
      "Bonos mensuales personalizados",
      "Recargas diarias premium",
      "Anfitrión VIP exclusivo 24/7",
      "Eventos VIP y torneos exclusivos",
      "Límites de apuestas ilimitados",
      "Cashback mejorado en pérdidas",
      "Regalos físicos y sorpresas"
    ],
    requirements: "Solo por invitación ($100,000+ apostados)"
  }
];

export default function VIPPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [hoveredLevel, setHoveredLevel] = useState<null | number>(null);
  const [activeTab, setActiveTab] = useState("benefits");

  // Mock user VIP data - in a real app, this would come from the backend
  const userVIPData = {
    currentLevel: 0, // Bronce (index of the vipLevels array)
    progress: 17.99, // Percent progress to next level
    totalWagered: 350, // Total amount wagered in the current period
    nextLevelWagerRequired: 500, // Amount needed to reach next level
    nextLevelAmountRemaining: 150 // Amount remaining to reach next level
  };

  // Calculate next level
  const nextLevel = userVIPData.currentLevel + 1 < vipLevels.length ? userVIPData.currentLevel + 1 : null;

  // Calculate the position of each level marker in the progress bar
  const getLevelPosition = (levelIndex: number) => {
    const totalLevels = vipLevels.length;
    return (levelIndex / (totalLevels - 1)) * 100;
  };

  // Animation variants for cards
  const cardVariants = {
    initial: { y: 20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FFD700] to-[#09b66d] mb-3"
        >
          ¡Bienvenido al Club VIP de Crypto Spin!
        </motion.h1>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
        >
          Cuanto más apuestes, más subirás de nivel y desbloquearás recompensas exclusivas
        </motion.p>
      </div>

      {/* Current Level & Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-gradient-to-r from-[#0e1824] to-[#14202f] border border-[#1c2b3a] rounded-xl p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Level */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className={`w-20 h-20 rounded-full ${vipLevels[userVIPData.currentLevel].bgColor} flex items-center justify-center mb-2`}
              style={{ boxShadow: `0 0 15px ${vipLevels[userVIPData.currentLevel].color}` }}
            >
              {(() => {
                const Icon = vipLevels[userVIPData.currentLevel].icon;
                return <Icon 
                  className={`h-10 w-10 ${vipLevels[userVIPData.currentLevel].textColor}`}
                  strokeWidth={1.5} 
                />;
              })()}
            </div>
            <h3 className="text-lg font-bold mb-1">Tu nivel actual</h3>
            <div className={`text-2xl font-bold ${vipLevels[userVIPData.currentLevel].textColor}`} 
                 style={{ textShadow: `0 0 10px ${vipLevels[userVIPData.currentLevel].color}` }}>
              {vipLevels[userVIPData.currentLevel].name}
            </div>
          </div>

          {/* Progress to Next Level */}
          <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Progreso al siguiente nivel</span>
              <span className="text-sm font-bold">{userVIPData.progress.toFixed(2)}%</span>
            </div>

            {/* Custom Progress Bar with Level Markers */}
            <div className="relative mb-4">
              <Progress 
                value={userVIPData.progress} 
                className="h-4 bg-[#1c2b3a]" 
              />
              {/* Overlay a gradient on the progress indicator */}
              <div 
                className="absolute top-0 left-0 h-4 bg-gradient-to-r from-[#09b66d] to-[#FFD700] rounded-full" 
                style={{ 
                  width: `${userVIPData.progress}%`, 
                  opacity: 0.9 
                }} 
              />
              
              {/* Level Markers on Progress Bar */}
              <div className="absolute top-0 w-full h-full">
                {vipLevels.map((level, i) => (
                  <div 
                    key={i}
                    className={`absolute h-6 w-1.5 -mt-1 rounded-full transition-all duration-300 ${
                      i <= userVIPData.currentLevel ? 'bg-white' : 'bg-gray-600'
                    }`}
                    style={{ left: `${getLevelPosition(i)}%`, transform: 'translateX(-50%)' }}
                    onMouseEnter={() => setHoveredLevel(i)}
                    onMouseLeave={() => setHoveredLevel(null)}
                  />
                ))}
              </div>

              {/* Tooltip for hovered level */}
              {hoveredLevel !== null && (
                <div 
                  className="absolute -top-16 text-center bg-[#0e1824] border border-[#1c2b3a] p-2 rounded-md shadow-lg z-10 min-w-32"
                  style={{ 
                    left: `${getLevelPosition(hoveredLevel)}%`, 
                    transform: 'translateX(-50%)' 
                  }}
                >
                  <div className={`text-sm font-bold ${vipLevels[hoveredLevel].textColor}`}>
                    {vipLevels[hoveredLevel].name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {hoveredLevel <= userVIPData.currentLevel ? "Nivel desbloqueado" : "Próximo nivel"}
                  </div>
                  <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-[#0e1824] border-r border-b border-[#1c2b3a]"></div>
                </div>
              )}
            </div>

            {nextLevel !== null && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Siguiente nivel</p>
                  <div className="flex items-center">
                    <span className={`font-bold ${vipLevels[nextLevel].textColor}`}>
                      {vipLevels[nextLevel].name}
                    </span>
                    <Badge variant="outline" className="ml-2 bg-[#1c2b3a]">
                      {userVIPData.nextLevelAmountRemaining} fichas más
                    </Badge>
                  </div>
                </div>

                <Button variant="default" className="bg-gradient-to-r from-[#09b66d] to-[#06884d] hover:from-[#06884d] hover:to-[#09b66d] border-none">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Depositar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Current Stats & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-[#0e1824] rounded-lg p-3 flex items-center">
            <DollarSign className="h-5 w-5 text-[#FFD700] mr-2" />
            <span>Has apostado <span className="font-bold text-white">{userVIPData.totalWagered}</span> fichas este mes</span>
          </div>
          <div className="bg-[#0e1824] rounded-lg p-3 flex items-center">
            <Target className="h-5 w-5 text-[#FF3E8F] mr-2" />
            <span>Apuesta <span className="font-bold text-white">{userVIPData.nextLevelAmountRemaining}</span> fichas más para subir de nivel</span>
          </div>
          <div className="bg-[#0e1824] rounded-lg p-3 flex items-center">
            <Gift className="h-5 w-5 text-[#09b66d] mr-2" />
            <span>Bonos semanales disponibles: <span className="font-bold text-white">2</span></span>
          </div>
        </div>
      </motion.div>

      {/* VIP System Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="benefits">Beneficios VIP</TabsTrigger>
          <TabsTrigger value="levels">Niveles VIP</TabsTrigger>
          <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
        </TabsList>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={0}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-[#09b66d]/20 flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-[#09b66d]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Bonos Exclusivos</h3>
              <p className="text-gray-400 text-sm">Accede a bonos exclusivos de recarga y promociones especiales que aumentan con cada nivel VIP.</p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={1}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#FFD700]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Rakeback Semanal</h3>
              <p className="text-gray-400 text-sm">Recupera un porcentaje de tus apuestas cada semana, independientemente de si ganas o pierdes.</p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={2}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-[#FF3E8F]/20 flex items-center justify-center mb-4">
                <HeadphonesIcon className="h-6 w-6 text-[#FF3E8F]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Soporte Prioritario</h3>
              <p className="text-gray-400 text-sm">Obtén acceso a líneas de soporte exclusivas y prioritarias con tiempos de respuesta más rápidos.</p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={3}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-indigo-300/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold mb-2">Límites Superiores</h3>
              <p className="text-gray-400 text-sm">Disfruta de límites de depósito, retiro y apuestas más altos a medida que subes de nivel VIP.</p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={4}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-green-400/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Retiros Rápidos</h3>
              <p className="text-gray-400 text-sm">Procesamiento prioritario de retiros con tiempos de espera reducidos para miembros VIP.</p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={5}
              className="bg-[#0e1824] border border-[#1c2b3a] rounded-xl p-6"
            >
              <div className="h-12 w-12 rounded-full bg-[#B9F2FF]/20 flex items-center justify-center mb-4">
                <Crown className="h-6 w-6 text-[#B9F2FF]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Anfitrión VIP</h3>
              <p className="text-gray-400 text-sm">Accede a un anfitrión VIP personal que te proporcionará atención personalizada (niveles Platino y superiores).</p>
            </motion.div>
          </div>
        </TabsContent>

        {/* Levels Tab */}
        <TabsContent value="levels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vipLevels.map((level, i) => (
              <motion.div
                key={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                custom={i}
                className={`bg-[#0e1824] border ${level.borderColor} rounded-xl p-6 relative overflow-hidden`}
              >
                {userVIPData.currentLevel === i && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#09b66d] text-xs text-white px-3 py-1 transform rotate-45 translate-y-2 translate-x-8">
                      Actual
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${level.textColor}`}>{level.name}</h3>
                    <p className="text-sm text-gray-400">{level.requirements}</p>
                  </div>
                  <div 
                    className={`w-12 h-12 rounded-full ${level.bgColor} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 10px ${level.color}` }}
                  >
                    {(() => {
                      const Icon = level.icon;
                      return <Icon 
                        className={`h-6 w-6 ${level.textColor}`}
                        strokeWidth={1.5} 
                      />;
                    })()}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {level.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm">
                      <div className="h-1.5 w-1.5 bg-[#09b66d] rounded-full mr-2"></div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                
                {userVIPData.currentLevel < i && (
                  <Button variant="outline" className="w-full mt-2 border-[#1c2b3a] hover:bg-[#1c2b3a]">
                    Cómo alcanzar este nivel
                  </Button>
                )}
                
                {userVIPData.currentLevel >= i && (
                  <div className="text-xs text-[#09b66d] flex items-center mt-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Nivel desbloqueado
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <Card className="bg-[#0e1824] border-[#1c2b3a]">
            <CardHeader>
              <CardTitle>¿Cómo funciona el programa VIP?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>Nuestro programa VIP está basado en tus niveles de apuesta. Cuanto más juegues, más subirás de nivel y desbloquearás recompensas. Tu nivel VIP se calcula en base al total apostado durante tu tiempo en Crypto Spin.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0e1824] border-[#1c2b3a]">
            <CardHeader>
              <CardTitle>¿Cómo puedo subir de nivel VIP?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>Para subir de nivel VIP, simplemente sigue apostando en cualquiera de nuestros juegos. El sistema calculará automáticamente tu progreso basado en el volumen de apuestas. Cada nivel tiene requisitos específicos que puedes ver en la sección de Niveles VIP.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0e1824] border-[#1c2b3a]">
            <CardHeader>
              <CardTitle>¿Qué es el Rakeback?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>El Rakeback es un sistema de devolución de dinero basado en tus apuestas, independientemente de si ganas o pierdes. El porcentaje de Rakeback aumenta con tu nivel VIP y se paga semanalmente directamente a tu cuenta.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0e1824] border-[#1c2b3a]">
            <CardHeader>
              <CardTitle>¿Puedo perder mi nivel VIP?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>Una vez que alcanzas un nivel VIP, lo mantienes durante al menos 30 días. Si después de este período no mantienes un volumen de apuestas acorde a tu nivel, podrías bajar al nivel anterior. Los niveles Diamante tienen períodos de evaluación diferentes.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0e1824] border-[#1c2b3a]">
            <CardHeader>
              <CardTitle>¿Qué es un Anfitrión VIP?</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>Un Anfitrión VIP es un gestor personal asignado a miembros de alto nivel (Platino y Diamante). Tu anfitrión se encargará de ofrecerte bonos personalizados, invitaciones a eventos exclusivos y atención preferencial para cualquier necesidad que tengas en la plataforma.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* VIP Host Section (only for high levels) */}
      {userVIPData.currentLevel < 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative bg-gradient-to-r from-[#192531] to-[#14202f] border border-[#1c2b3a] rounded-xl p-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#B9F2FF]/5 to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="shrink-0 w-24 h-24 rounded-full bg-[#B9F2FF]/20 flex items-center justify-center">
              <Crown className="h-12 w-12 text-[#B9F2FF]" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Tu Anfitrión VIP Personal</h3>
              <p className="text-gray-300 mb-4">
                Alcanza el nivel Platino para desbloquear un anfitrión VIP dedicado que te proporcionará bonificaciones personalizadas, soporte prioritario y acceso a eventos exclusivos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button variant="default" className="bg-[#B9F2FF] hover:bg-[#a0e3ff] text-[#0e1824]">
                  <Crown className="h-4 w-4 mr-2" />
                  Alcanza Platino
                </Button>
                <Button variant="outline" className="border-[#1c2b3a] hover:bg-[#1c2b3a]">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Más información
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}