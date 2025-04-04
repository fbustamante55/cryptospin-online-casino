import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  History, 
  Star, 
  Dice5, 
  Coins, 
  BarChart2
} from "lucide-react";
import { GameCard } from "@/components/ui/game-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interfaces
interface Game {
  id: string;
  title: string;
  description: string;
  image: string;
  gameType: "slots" | "dice" | "crash" | "roulette" | "blackjack" | "baccarat" | "keno";
  gameId?: string;
  featured?: boolean;
  popular?: boolean;
  new?: boolean;
  tag?: {
    text: string;
    color: "primary" | "secondary" | "tertiary";
  };
  rating?: number;
}

export default function CasinoGamesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Lista de juegos de casino
  const games: Game[] = [
    {
      id: "g1",
      title: t("games.crash_title"),
      description: t("games.crash_description"),
      image: "/images/games/crash.webp", 
      gameType: "crash",
      featured: true,
      popular: true,
      tag: {
        text: "HOT",
        color: "primary"
      },
      rating: 4.9
    },
    // Juegos del repositorio slotopol
    {
      id: "s1",
      title: t("games.slots_50gems_title"),
      description: t("games.slots_50gems_description"),
      image: "/images/games/50gems.webp", 
      gameType: "slots",
      gameId: "50gems",
      featured: true,
      popular: true,
      tag: {
        text: "POPULAR",
        color: "primary"
      },
      rating: 4.8
    },
    {
      id: "s2",
      title: t("games.slots_777_title"),
      description: t("games.slots_777_description"),
      image: "/images/games/777.webp",
      gameType: "slots",
      gameId: "777",
      popular: true,
      rating: 4.6
    },
    {
      id: "s3",
      title: t("games.slots_book_of_egypt_title"),
      description: t("games.slots_book_of_egypt_description"),
      image: "/images/games/book-of-egypt.webp",
      gameType: "slots",
      gameId: "book-of-egypt",
      featured: true,
      tag: {
        text: "HOT",
        color: "primary"
      },
      rating: 4.9
    },
    {
      id: "s4",
      title: t("games.slots_halloween_title"),
      description: t("games.slots_halloween_description"),
      image: "/images/games/halloween.webp",
      gameType: "slots",
      gameId: "halloween",
      featured: true,
      rating: 4.5
    },
    {
      id: "s5",
      title: t("games.slots_hot_scatter_title"),
      description: t("games.slots_hot_scatter_description"),
      image: "/images/games/hot-scatter.webp",
      gameType: "slots",
      gameId: "hot-scatter",
      rating: 4.4
    },
    // Juegos originales
    {
      id: "g11",
      title: t("games.keno_title"),
      description: t("games.keno_description"),
      image: "/images/games/keno.webp",
      gameType: "keno",
      new: true,
      tag: {
        text: "NUEVO",
        color: "tertiary"
      },
      rating: 4.5
    },
    {
      id: "g3",
      title: t("games.dice_title"),
      description: t("games.dice_description"),
      image: "/images/games/dice.webp",
      gameType: "dice",
      featured: true,
      rating: 4.5
    },
    {
      id: "g4",
      title: t("games.roulette_title"),
      description: t("games.roulette_description"),
      image: "/images/games/roulette.webp",
      gameType: "roulette",
      popular: true,
      rating: 4.8
    },
    {
      id: "g5",
      title: t("games.blackjack_title"),
      description: t("games.blackjack_description"),
      image: "/images/games/blackjack.webp",
      gameType: "blackjack",
      rating: 4.6
    },
    {
      id: "g6",
      title: t("games.baccarat_title"),
      description: t("games.baccarat_description"),
      image: "/images/games/baccarat.webp",
      gameType: "baccarat",
      new: true,
      tag: {
        text: t("games.new"),
        color: "tertiary"
      },
      rating: 4.3
    },
    {
      id: "g2",
      title: t("games.slots_fruity_title"),
      description: t("games.slots_fruity_description"),
      image: "/images/games/slots1.webp",
      gameType: "slots",
      gameId: "fruity-fiesta",
      popular: true,
      tag: {
        text: t("games.popular"),
        color: "secondary"
      },
      rating: 4.7
    },
    {
      id: "g7",
      title: t("games.slots_crypto_title"),
      description: t("games.slots_crypto_description"),
      image: "/images/games/slots2.webp",
      gameType: "slots",
      gameId: "crypto-millionaire",
      new: true,
      tag: {
        text: t("games.new"),
        color: "tertiary"
      },
      rating: 4.4
    },
    {
      id: "g8",
      title: t("games.slots_aztec_title"),
      description: t("games.slots_aztec_description"),
      image: "/images/games/slots3.webp",
      gameType: "slots",
      gameId: "aztec-treasure",
      rating: 4.2
    },
    {
      id: "g9",
      title: t("games.slots_oriental_title"),
      description: t("games.slots_oriental_description"),
      image: "/images/games/slots4.webp", 
      gameType: "slots",
      gameId: "oriental-fortune",
      rating: 4.3
    }
  ];

  // Filtrar juegos por tab y búsqueda
  const filteredGames = games.filter((game) => {
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "featured" && game.featured) ||
      (activeTab === "popular" && game.popular) ||
      (activeTab === "new" && game.new) ||
      (activeTab === game.gameType);
    
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && (searchQuery === "" || matchesSearch);
  });

  // Construir la ruta para el juego
  const getGameRoute = (game: Game) => {
    switch(game.gameType) {
      case "crash":
        return "/crash";
      case "dice":
        return "/dice";
      case "roulette":
        return "/roulette";
      case "blackjack":
        return "/blackjack";
      case "baccarat":
        return "/baccarat";
      case "slots":
        return `/slots${game.gameId ? `/${game.gameId}` : ''}`;
      case "keno":
        return "/keno";
      default:
        return "/";
    }
  };

  // Obtener el ícono para cada pestaña
  const getTabIcon = (tab: string) => {
    switch(tab) {
      case "featured":
        return <Sparkles className="h-4 w-4 mr-2" />;
      case "popular":
        return <TrendingUp className="h-4 w-4 mr-2" />;
      case "new":
        return <Sparkles className="h-4 w-4 mr-2" />;
      case "slots":
        return <BarChart2 className="h-4 w-4 mr-2" />;
      case "dice":
        return <Dice5 className="h-4 w-4 mr-2" />;
      case "crash":
        return <TrendingUp className="h-4 w-4 mr-2" />;
      case "roulette":
        return <Coins className="h-4 w-4 mr-2" />;
      case "keno":
        return <Star className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("games.title")}</h1>
          <p className="text-gray-400">{t("games.description")}</p>
        </div>

        {/* Banner destacado */}
        <div className="relative rounded-xl overflow-hidden h-48 md:h-64">
          <div className="absolute inset-0 bg-gradient-to-r from-[#09b66d] to-[#0d1d2a] opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/images/games/banner-bg.webp')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
            <Badge className="mb-2 w-fit bg-white/20 text-white border-none">
              {t("games.featured")}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{t("games.banner_title")}</h2>
            <p className="text-white/80 max-w-md mb-4">{t("games.banner_description")}</p>
            <Link href="/crash">
              <a className="bg-white text-[#09b66d] hover:bg-white/90 font-medium py-2 px-4 rounded-md w-fit">
                {t("games.play_now")}
              </a>
            </Link>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#192531] border border-[#1c2b3a] h-auto flex flex-wrap">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#09b66d]">
                {t("games.all")}
              </TabsTrigger>
              <TabsTrigger value="featured" className="data-[state=active]:bg-[#09b66d]">
                <Sparkles className="h-4 w-4 mr-2" />
                {t("games.featured")}
              </TabsTrigger>
              <TabsTrigger value="popular" className="data-[state=active]:bg-[#09b66d]">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("games.popular")}
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-[#09b66d]">
                <Star className="h-4 w-4 mr-2" />
                {t("games.new")}
              </TabsTrigger>
              <TabsTrigger value="crash" className="data-[state=active]:bg-[#09b66d]">
                {t("games.crash")}
              </TabsTrigger>
              <TabsTrigger value="slots" className="data-[state=active]:bg-[#09b66d]">
                {t("games.slots")}
              </TabsTrigger>
              <TabsTrigger value="dice" className="data-[state=active]:bg-[#09b66d]">
                {t("games.dice")}
              </TabsTrigger>
              <TabsTrigger value="roulette" className="data-[state=active]:bg-[#09b66d]">
                {t("games.roulette")}
              </TabsTrigger>
              <TabsTrigger value="keno" className="data-[state=active]:bg-[#09b66d]">
                {t("games.keno") || "Keno"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder={t("games.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0e1824] border-[#1c2b3a] text-white"
            />
          </div>
        </div>

        {/* Cuadrícula de juegos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <Link key={game.id} href={getGameRoute(game)}>
                <a>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    image={game.image}
                    gameType={game.gameType}
                    gameId={game.gameId}
                    tag={game.tag}
                    rating={game.rating}
                  />
                </a>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-64 gap-4 text-center">
              <History className="h-16 w-16 text-gray-500" />
              <h2 className="text-xl font-semibold text-white">{t("games.no_games_found")}</h2>
              <p className="text-gray-400 max-w-md">{t("games.try_different_search")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}