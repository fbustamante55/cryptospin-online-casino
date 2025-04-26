import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CrashGame } from "@/components/games/crash/CrashGame";
import { CrashRocket } from "@/components/games/crash/CrashRocket";
import { CrashSpace } from "@/components/games/crash/CrashSpace";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import "@/components/games/crash/crash.css";

export function CrashPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<string>("classic");
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    // Ocultar la alerta después de 10 segundos
    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const renderSelectedGame = () => {
    switch (selectedGame) {
      case "classic":
        return <CrashGame />;
      case "rocket":
        return <CrashRocket />;
      case "space":
        return <CrashSpace />;
      default:
        return <CrashGame />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6 text-white">{t('crash.title', 'Crash Games')}</h1>
      
      {showAlert && (
        <Alert className="mb-6 bg-amber-900/30 border-amber-600 text-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <AlertDescription className="text-amber-200">
            {t('crash.betDisclaimer', 'Remember to cash out before the multiplier crashes for maximum winnings!')}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-[#192531] border-[#1c2b3a] shadow-lg mb-6">
        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="w-full bg-[#0e1824] border-b border-[#1c2b3a] rounded-t-lg rounded-b-none h-auto py-2 px-4 grid grid-cols-3 gap-2">
            <TabsTrigger 
              value="classic" 
              onClick={() => setSelectedGame("classic")}
              className="py-2 rounded-md bg-[#192531] data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
            >
              {t('crash.classicGame', 'Classic Crash')}
            </TabsTrigger>
            <TabsTrigger 
              value="rocket" 
              onClick={() => setSelectedGame("rocket")}
              className="py-2 rounded-md bg-[#192531] data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
            >
              {t('crash.rocketGame', 'Rocket Launch')}
            </TabsTrigger>
            <TabsTrigger 
              value="space" 
              onClick={() => setSelectedGame("space")}
              className="py-2 rounded-md bg-[#192531] data-[state=active]:bg-[#09b66d] data-[state=active]:text-white"
            >
              {t('crash.spaceGame', 'Space X')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="classic" className="p-0 m-0">
            <div className="p-4">
              {selectedGame === "classic" && renderSelectedGame()}
            </div>
          </TabsContent>
          
          <TabsContent value="rocket" className="p-0 m-0">
            <div className="p-4">
              {selectedGame === "rocket" && renderSelectedGame()}
            </div>
          </TabsContent>
          
          <TabsContent value="space" className="p-0 m-0">
            <div className="p-4">
              {selectedGame === "space" && renderSelectedGame()}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="bg-[#192531] border-[#1c2b3a] shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">{t('crash.howToPlay', 'How to Play')}</h2>
        <div className="space-y-4 text-gray-300">
          <p>{t('crash.instructions1', 'Place your bet before the round begins.')}</p>
          <p>{t('crash.instructions2', 'Watch as the multiplier increases.')}</p>
          <p>{t('crash.instructions3', 'Cash out before the game crashes to win your bet multiplied by the current value.')}</p>
          <p>{t('crash.instructions4', 'If you wait too long and the game crashes before you cash out, you lose your bet.')}</p>
          <p className="font-bold text-[#09b66d]">{t('crash.goodLuck', 'Good luck!')}</p>
        </div>
      </Card>
    </div>
  );
}