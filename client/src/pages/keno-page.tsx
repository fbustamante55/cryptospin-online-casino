import { useState } from 'react';
import { KenoGame } from "@/components/keno/keno-game";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GameHistory } from "@shared/schema";
import { motion } from "framer-motion";
import { Crown, Coins, Calendar, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function KenoPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Obtener historial específico para keno
  const { data: gameHistory } = useQuery<GameHistory[]>({
    queryKey: ["/api/game-history"],
    select: (data) => data.filter((history) => history.gameType === "keno").slice(0, 5),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game component (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <KenoGame />
        </div>
        
        {/* Sidebar (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Game info card */}
          <Card className="bg-[#1A2634] border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Crown className="h-5 w-5 text-[#F9C846] mr-2" />
                {t("keno.about_keno")}
              </h3>
              <div className="space-y-4 text-gray-300">
                <p>{t("keno.keno_description_1")}</p>
                <p>{t("keno.keno_description_2")}</p>
                
                <div className="mt-4">
                  <h4 className="font-medium text-white mb-2">{t("keno.how_to_play")}</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                    <li>{t("keno.keno_how_to_1")}</li>
                    <li>{t("keno.keno_how_to_2")}</li>
                    <li>{t("keno.keno_how_to_3")}</li>
                    <li>{t("keno.keno_how_to_4")}</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">{t("keno.keno_payouts")}</h4>
                  <p className="text-sm text-gray-400">
                    {t("keno.keno_payouts_description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent games card */}
          <Card className="bg-[#1A2634] border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-[#F9C846] mr-2" />
                {t("keno.recent_games")}
              </h3>
              
              {gameHistory && gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game) => {
                    const outcome = JSON.parse(game.outcome);
                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-[#0F1923] border border-gray-800"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-400">
                              {game.gameId || "American Keno"}
                            </span>
                            <div className="flex items-center mt-1">
                              <Coins className="h-4 w-4 text-[#09B66D] mr-1" />
                              <span className="font-medium text-white">{game.bet}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${game.win ? 'text-[#09B66D]' : 'text-red-500'}`}>
                              {game.win ? `+${game.winAmount}` : `-${game.bet}`}
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              <span className="text-xs text-gray-400 mr-2">
                                {outcome.matches} {t("keno.matches")}
                              </span>
                              <TrendingUp className={`h-3 w-3 ${game.win ? 'text-[#09B66D]' : 'text-red-500'}`} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{t("keno.no_recent_games")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}