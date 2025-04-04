import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  Search, 
  ChevronRight, 
  ChevronsRight, 
  AlertCircle,
  Ticket
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tournament {
  id: string;
  title: string;
  game: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  prize: string;
  participants: number;
  maxParticipants: number;
  entryFee: number;
}

export default function TournamentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">("active");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Datos de ejemplo para torneos
  const tournaments: Tournament[] = [
    {
      id: "t1",
      title: t("tournaments.crypto_clash"),
      game: "Crash",
      startDate: "2025-03-25T10:00:00",
      endDate: "2025-03-28T22:00:00",
      status: "active",
      prize: "5,000 USDT",
      participants: 128,
      maxParticipants: 256,
      entryFee: 25
    },
    {
      id: "t2",
      title: t("tournaments.weekend_warrior"),
      game: "Slots",
      startDate: "2025-03-29T12:00:00",
      endDate: "2025-03-31T23:59:59",
      status: "upcoming",
      prize: "2,500 USDT",
      participants: 45,
      maxParticipants: 100,
      entryFee: 10
    },
    {
      id: "t3",
      title: t("tournaments.high_roller_challenge"),
      game: "Roulette",
      startDate: "2025-03-20T14:00:00",
      endDate: "2025-03-24T23:59:59",
      status: "completed",
      prize: "10,000 USDT",
      participants: 64,
      maxParticipants: 64,
      entryFee: 100
    },
    {
      id: "t4",
      title: t("tournaments.dice_masters"),
      game: "Dice",
      startDate: "2025-03-26T08:00:00",
      endDate: "2025-03-27T20:00:00",
      status: "active",
      prize: "1,500 USDT",
      participants: 89,
      maxParticipants: 150,
      entryFee: 5
    },
    {
      id: "t5",
      title: t("tournaments.blackjack_bonanza"),
      game: "Blackjack",
      startDate: "2025-04-01T15:00:00",
      endDate: "2025-04-07T22:00:00",
      status: "upcoming",
      prize: "3,000 USDT",
      participants: 12,
      maxParticipants: 75,
      entryFee: 20
    },
    {
      id: "t6",
      title: t("tournaments.crypto_cup_finals"),
      game: "Crash",
      startDate: "2025-03-15T12:00:00",
      endDate: "2025-03-20T20:00:00",
      status: "completed",
      prize: "15,000 USDT",
      participants: 256,
      maxParticipants: 256,
      entryFee: 50
    }
  ];

  // Filtrar torneos por status y búsqueda
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesStatus = tournament.status === activeTab;
    const matchesSearch = 
      tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tournament.game.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && (searchQuery === "" || matchesSearch);
  });

  // Función para unirse a un torneo
  const joinTournament = (tournament: Tournament) => {
    if (tournament.participants >= tournament.maxParticipants) {
      toast({
        title: t("tournaments.full_title"),
        description: t("tournaments.full_description"),
        variant: "destructive",
      });
      return;
    }
    
    // Aquí iría la lógica para unirse al torneo
    toast({
      title: t("tournaments.joined_title"),
      description: t("tournaments.joined_description", { title: tournament.title }),
      variant: "default",
    });
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Función para mostrar la lista de torneos
  function renderTournamentList() {
    if (filteredTournaments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <AlertCircle className="h-16 w-16 text-gray-500" />
          <h2 className="text-xl font-semibold text-white">
            {activeTab === "active" 
              ? t("tournaments.no_active") 
              : activeTab === "upcoming" 
                ? t("tournaments.no_upcoming")
                : t("tournaments.no_completed")
            }
          </h2>
          <p className="text-gray-400 max-w-md">
            {t("tournaments.check_other_tabs")}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredTournaments.map((tournament) => (
          <Card 
            key={tournament.id} 
            className="bg-[#192531] border-[#1c2b3a] overflow-hidden"
          >
            <div className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    tournament.status === "active" 
                      ? "bg-[#09b66d]/20" 
                      : tournament.status === "upcoming" 
                        ? "bg-[#FFB636]/20" 
                        : "bg-[#7B8794]/20"
                  }`}>
                    <Trophy className={`h-10 w-10 ${
                      tournament.status === "active" 
                        ? "text-[#09b66d]" 
                        : tournament.status === "upcoming" 
                          ? "text-[#FFB636]" 
                          : "text-[#7B8794]"
                    }`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-white">{tournament.title}</h3>
                      <Badge className={`${
                        tournament.status === "active" 
                          ? "bg-[#09b66d]" 
                          : tournament.status === "upcoming" 
                            ? "bg-[#FFB636]" 
                            : "bg-[#7B8794]"
                      }`}>
                        {tournament.status === "active" 
                          ? t("tournaments.active") 
                          : tournament.status === "upcoming" 
                            ? t("tournaments.upcoming") 
                            : t("tournaments.completed")
                        }
                      </Badge>
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          {t("tournaments.participants")}: {tournament.participants}/{tournament.maxParticipants}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400">{t("tournaments.prize_pool")}</span>
                    <span className="text-xl font-bold text-[#09b66d]">{tournament.prize}</span>
                  </div>
                  
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400">{t("tournaments.entry_fee")}</span>
                    <span className="text-lg font-semibold text-white">{tournament.entryFee} USDT</span>
                  </div>
                  
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400">{t("tournaments.game")}</span>
                    <span className="text-lg font-semibold text-white">{tournament.game}</span>
                  </div>
                  
                  {tournament.status === "active" || tournament.status === "upcoming" ? (
                    <Button 
                      onClick={() => joinTournament(tournament)} 
                      className={`min-w-[120px] ${
                        tournament.status === "active" 
                          ? "bg-[#09b66d] hover:bg-[#09b66d]/80" 
                          : "bg-[#FFB636] hover:bg-[#FFB636]/80"
                      }`}
                      disabled={tournament.participants >= tournament.maxParticipants}
                    >
                      {tournament.participants >= tournament.maxParticipants 
                        ? t("tournaments.full") 
                        : t("tournaments.join")
                      }
                    </Button>
                  ) : (
                    <Button variant="secondary" className="min-w-[120px]">
                      {t("tournaments.view_results")}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Barra de progreso para mostrar participantes */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">
                    {Math.round((tournament.participants / tournament.maxParticipants) * 100)}% {t("tournaments.full")}
                  </span>
                  {tournament.status === "active" && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {t("tournaments.ending_soon")}
                      </span>
                    </div>
                  )}
                </div>
                <Progress 
                  value={(tournament.participants / tournament.maxParticipants) * 100} 
                  className={`h-2 ${
                    tournament.status === "active" 
                      ? "bg-[#192531]" 
                      : tournament.status === "upcoming" 
                        ? "bg-[#192531]" 
                        : "bg-[#192531]"
                  }`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Render principal
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("tournaments.title")}</h1>
          <p className="text-gray-400">{t("tournaments.description")}</p>
        </div>

        {/* Banner promocional */}
        <Card className="bg-gradient-to-r from-[#0d1d2a] to-[#09b66d]/30 border-none overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {t("tournaments.monthly_championship")}
                </h2>
                <p className="text-gray-300 max-w-md">
                  {t("tournaments.monthly_description")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-gray-300">
                    <Trophy className="h-5 w-5 mr-2 text-[#FFD700]" />
                    <span>25,000 USDT</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-2 text-[#09b66d]" />
                    <span>{t("tournaments.april_dates")}</span>
                  </div>
                </div>
                <Button className="bg-[#09b66d] hover:bg-[#09b66d]/80">
                  <Ticket className="h-4 w-4 mr-2" />
                  {t("tournaments.pre_register")}
                </Button>
              </div>
              
              <div className="hidden md:block">
                <Trophy className="h-40 w-40 text-[#FFD700] opacity-50" />
              </div>
            </div>
          </div>
        </Card>

        {/* Búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs defaultValue="active" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="bg-[#192531] border border-[#1c2b3a]">
              <TabsTrigger value="active" className="data-[state=active]:bg-[#09b66d]">
                {t("tournaments.active")}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#09b66d]">
                {t("tournaments.upcoming")}
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#09b66d]">
                {t("tournaments.completed")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder={t("tournaments.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0e1824] border-[#1c2b3a] text-white"
            />
          </div>
        </div>

        {/* Lista de torneos */}
        <TabsContent value={activeTab} className="mt-0">
          {renderTournamentList()}
        </TabsContent>

        {/* Enlaces adicionales */}
        <div className="flex justify-center">
          <Button variant="link" className="text-[#09b66d]">
            {t("tournaments.view_rules")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}