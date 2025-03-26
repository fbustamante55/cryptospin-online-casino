import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Gift, Trophy, Target, Calendar, Check, Award, Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Reward {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "daily" | "achievement" | "mission";
  status: "available" | "claimed" | "locked";
  progress?: number;
  total?: number;
  icon: JSX.Element;
  cooldown?: string;
}

export default function RewardsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");

  // Datos de ejemplo para recompensas
  const rewards: Reward[] = [
    {
      id: "r1",
      title: t("rewards.daily_bonus"),
      description: t("rewards.daily_bonus_description"),
      amount: 10,
      type: "daily",
      status: "available",
      icon: <Gift className="h-8 w-8 text-[#09b66d]" />
    },
    {
      id: "r2",
      title: t("rewards.weekly_chest"),
      description: t("rewards.weekly_chest_description"),
      amount: 50,
      type: "daily",
      status: "locked",
      cooldown: "3 days",
      icon: <Gift className="h-8 w-8 text-gray-400" />
    },
    {
      id: "r3",
      title: t("rewards.first_deposit"),
      description: t("rewards.first_deposit_description"),
      amount: 100,
      type: "achievement",
      status: "claimed",
      icon: <Trophy className="h-8 w-8 text-[#f8c541]" />
    },
    {
      id: "r4",
      title: t("rewards.win_streak"),
      description: t("rewards.win_streak_description"),
      amount: 25,
      type: "achievement",
      status: "locked",
      progress: 3,
      total: 5,
      icon: <Award className="h-8 w-8 text-gray-400" />
    },
    {
      id: "r5",
      title: t("rewards.play_games"),
      description: t("rewards.play_games_description"),
      amount: 15,
      type: "mission",
      status: "locked",
      progress: 7,
      total: 10,
      icon: <Target className="h-8 w-8 text-gray-400" />
    },
    {
      id: "r6",
      title: t("rewards.refer_friend"),
      description: t("rewards.refer_friend_description"),
      amount: 30,
      type: "mission",
      status: "locked",
      progress: 0,
      total: 1,
      icon: <Users className="h-8 w-8 text-gray-400" />
    }
  ];

  // Filtrar recompensas por tipo
  const filteredRewards = rewards.filter(reward => reward.type === activeTab);

  // Función para reclamar recompensa
  const claimReward = (reward: Reward) => {
    if (reward.status !== "available") return;
    
    // Aquí se implementaría la lógica para reclamar recompensa
    toast({
      title: t("rewards.claimed_title"),
      description: t("rewards.claimed_description", { amount: reward.amount }),
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("rewards.title")}</h1>
          <p className="text-gray-400">{t("rewards.description")}</p>
        </div>

        {/* Sección para mostrar el balance de recompensas del usuario */}
        <Card className="bg-[#192531] border-[#1c2b3a]">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-[#09b66d]/20 p-4 rounded-full">
                  <Gift className="h-8 w-8 text-[#09b66d]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">{t("rewards.your_rewards")}</h3>
                  <p className="text-sm text-gray-400">{t("rewards.redeem_credits")}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-white">100 USDT</span>
                <Button className="mt-2 bg-[#09b66d] hover:bg-[#09b66d]/80">
                  {t("rewards.redeem")}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs para filtrar recompensas */}
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#192531] border border-[#1c2b3a]">
            <TabsTrigger value="daily" className="data-[state=active]:bg-[#09b66d]">
              {t("rewards.daily")}
            </TabsTrigger>
            <TabsTrigger value="achievement" className="data-[state=active]:bg-[#09b66d]">
              {t("rewards.achievements")}
            </TabsTrigger>
            <TabsTrigger value="mission" className="data-[state=active]:bg-[#09b66d]">
              {t("rewards.missions")}
            </TabsTrigger>
          </TabsList>

          {["daily", "achievement", "mission"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRewards.length > 0 ? (
                  filteredRewards.map((reward) => (
                    <Card 
                      key={reward.id} 
                      className={`bg-[#192531] border-[#1c2b3a] ${
                        reward.status === "available" ? "border-[#09b66d]/30" : ""
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            {reward.icon}
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-white">{reward.title}</h3>
                              <p className="text-sm text-gray-400">{reward.description}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-[#09b66d]">+{reward.amount} USDT</span>
                        </div>
                        
                        {reward.progress !== undefined && reward.total !== undefined && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-400">
                                {t("rewards.progress")}: {reward.progress}/{reward.total}
                              </span>
                              <span className="text-xs text-gray-400">
                                {Math.round((reward.progress / reward.total) * 100)}%
                              </span>
                            </div>
                            <Progress value={(reward.progress / reward.total) * 100} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-4">
                          {reward.status === "available" ? (
                            <Button 
                              onClick={() => claimReward(reward)}
                              className="w-full bg-[#09b66d] hover:bg-[#09b66d]/80"
                            >
                              {t("rewards.claim")}
                            </Button>
                          ) : reward.status === "claimed" ? (
                            <Button disabled className="w-full bg-[#313d4a] text-gray-300">
                              <Check className="h-4 w-4 mr-2" />{t("rewards.claimed")}
                            </Button>
                          ) : (
                            <Button disabled className="w-full bg-[#313d4a] text-gray-300">
                              {reward.cooldown ? (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  {t("rewards.available_in", { time: reward.cooldown })}
                                </div>
                              ) : (
                                t("rewards.locked")
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center h-64 gap-4 text-center">
                    <h2 className="text-xl font-semibold text-white">{t("rewards.no_rewards")}</h2>
                    <p className="text-gray-400 max-w-md">{t("rewards.check_later")}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}