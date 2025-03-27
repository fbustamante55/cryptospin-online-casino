import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipo para los datos de actividad del juego
interface GameActivity {
  id: string;
  gameImage: string;
  gameName: string;
  userName: string;
  userAvatar: string;
  time: string;
  bet: number;
  multiplier: number;
  payout: number;
  win: boolean;
}

// Datos de demostración
const demoGameActivities: GameActivity[] = [
  {
    id: "1",
    gameImage: "/images/games/sweet-bonanza.webp",
    gameName: "Sweet Bonanza",
    userName: "User1",
    userAvatar: "/images/avatar/1.png",
    time: "2:03 PM",
    bet: 100.25,
    multiplier: 1.75,
    payout: 175.43,
    win: true
  },
  {
    id: "2",
    gameImage: "/images/games/book-of-ra.webp",
    gameName: "Book of Ra",
    userName: "Oculto",
    userAvatar: "/images/avatar/2.png",
    time: "2:03 PM",
    bet: 100.00,
    multiplier: 1.60,
    payout: 160.00,
    win: true
  },
  {
    id: "3",
    gameImage: "/images/games/gonzo-quest.webp",
    gameName: "El Paso Gunfight XXL",
    userName: "Oculto",
    userAvatar: "/images/avatar/3.png",
    time: "2:03 PM",
    bet: 100.00,
    multiplier: 0.95,
    payout: 95.20,
    win: false
  },
  {
    id: "4",
    gameImage: "/images/games/mission-impossible.webp",
    gameName: "Mission Uncrossable",
    userName: "DhaIieri",
    userAvatar: "/images/avatar/4.png",
    time: "2:03 PM",
    bet: 160.00,
    multiplier: 0.00,
    payout: 0.00,
    win: false
  },
  {
    id: "5",
    gameImage: "/images/games/roo-vip.webp",
    gameName: "Roo's VIP Blackjack",
    userName: "FdemI51",
    userAvatar: "/images/avatar/5.png",
    time: "2:03 PM",
    bet: 300.00,
    multiplier: 0.00,
    payout: 0.00,
    win: false
  },
  {
    id: "6",
    gameImage: "/images/games/blackjack.webp",
    gameName: "Exclusive Blackjack",
    userName: "dan0899",
    userAvatar: "/images/avatar/6.png",
    time: "2:03 PM",
    bet: 100.00,
    multiplier: 0.00,
    payout: 0.00,
    win: false
  },
  {
    id: "7",
    gameImage: "/images/games/infinite-blackjack.webp",
    gameName: "Infinite Blackjack",
    userName: "kousim73",
    userAvatar: "/images/avatar/7.png",
    time: "2:03 PM",
    bet: 107.98,
    multiplier: 0.80,
    payout: 94.78,
    win: false
  },
  {
    id: "8",
    gameImage: "/images/games/baccarat.webp",
    gameName: "Speed Baccarat A",
    userName: "msi615",
    userAvatar: "/images/avatar/8.png",
    time: "2:03 PM",
    bet: 200.00,
    multiplier: 0.00,
    payout: 0.00,
    win: false
  },
  {
    id: "9",
    gameImage: "/images/games/vip-blackjack.webp",
    gameName: "Blackjack VIP Diamond",
    userName: "Nokele",
    userAvatar: "/images/avatar/9.png",
    time: "2:03 PM",
    bet: 280.74,
    multiplier: 1.60,
    payout: 448.11,
    win: true
  },
  {
    id: "10",
    gameImage: "/images/games/8bit-quest.webp",
    gameName: "8-Bit Quest",
    userName: "Oculto",
    userAvatar: "/images/avatar/10.png",
    time: "2:03 PM",
    bet: 400.00,
    multiplier: 0.26,
    payout: 104.00,
    win: false
  }
];

export function LiveActivityTable() {
  const [activeTab, setActiveTab] = useState("all");
  const [activities, setActivities] = useState<GameActivity[]>(demoGameActivities);

  // Filtrar actividades según la pestaña seleccionada
  useEffect(() => {
    if (activeTab === "all") {
      setActivities(demoGameActivities);
    } else if (activeTab === "big-wins") {
      setActivities(demoGameActivities.filter(activity => activity.multiplier >= 1.5));
    } else if (activeTab === "lucky-wins") {
      setActivities(demoGameActivities.filter(activity => 
        activity.multiplier > 0 && activity.multiplier < 1.5));
    } else if (activeTab === "my-bets") {
      // En un caso real, filtrarías por el usuario actual
      setActivities([]);
    }
  }, [activeTab]);

  return (
    <div className="w-full bg-[#0e1824] border border-[#1c2b3a] rounded-lg overflow-hidden">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 bg-[#0a131d]">
          <TabsTrigger 
            value="all" 
            className={cn(
              "text-sm py-2", 
              activeTab === "all" ? "text-white" : "text-gray-400"
            )}
          >
            Todas
          </TabsTrigger>
          <TabsTrigger 
            value="big-wins" 
            className={cn(
              "text-sm py-2", 
              activeTab === "big-wins" ? "text-white" : "text-gray-400"
            )}
          >
            Grandes Victorias
          </TabsTrigger>
          <TabsTrigger 
            value="lucky-wins" 
            className={cn(
              "text-sm py-2", 
              activeTab === "lucky-wins" ? "text-white" : "text-gray-400"
            )}
          >
            Victorias Afortunadas
          </TabsTrigger>
          <TabsTrigger 
            value="my-bets" 
            className={cn(
              "text-sm py-2", 
              activeTab === "my-bets" ? "text-white" : "text-gray-400"
            )}
          >
            Mis Apuestas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0a131d] text-gray-400">
              <th className="text-left py-3 px-4 font-medium">JUEGO</th>
              <th className="text-left py-3 px-4 font-medium">USUARIO</th>
              <th className="text-left py-3 px-4 font-medium">HORA</th>
              <th className="text-left py-3 px-4 font-medium">APUESTA</th>
              <th className="text-left py-3 px-4 font-medium">MULTIPLICADOR</th>
              <th className="text-left py-3 px-4 font-medium">PAGO</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-t border-[#1c2b3a] hover:bg-[#192531]">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded bg-[#192531] mr-3 flex items-center justify-center overflow-hidden">
                      {/* En un caso real, aquí iría la imagen del juego */}
                      <div className="w-8 h-8 rounded bg-[#09b66d] text-white flex items-center justify-center">
                        {activity.gameName.charAt(0)}
                      </div>
                    </div>
                    <span className="text-white font-medium">{activity.gameName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-[#192531] mr-2 flex items-center justify-center">
                      {/* En un caso real, aquí iría el avatar del usuario */}
                      <span className="text-xs text-white">{activity.userName.charAt(0)}</span>
                    </div>
                    <span className="text-gray-300">{activity.userName}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-300">{activity.time}</td>
                <td className="py-3 px-4">
                  <span className="font-medium text-white">${activity.bet.toFixed(2)}</span>
                </td>
                <td className="py-3 px-4">
                  <span 
                    className={cn(
                      "font-medium",
                      activity.multiplier > 0 
                        ? activity.multiplier >= 1.5 
                          ? "text-green-500" 
                          : "text-yellow-500"
                        : "text-gray-400"
                    )}
                  >
                    {activity.multiplier.toFixed(2)}x
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span 
                    className={cn(
                      "font-medium",
                      activity.payout > 0 ? "text-green-500" : "text-gray-400"
                    )}
                  >
                    ${activity.payout.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}