import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GameCard } from "@/components/ui/game-card";

export default function CasinoGamesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Categorías de juegos
  const categories = [
    { id: "all", name: t("games.all") },
    { id: "popular", name: t("games.popular") },
    { id: "new", name: t("games.new") },
    { id: "slots", name: t("games.slots") },
    { id: "table", name: t("games.table") },
    { id: "jackpot", name: t("games.jackpot") },
  ];

  // Datos de ejemplo para los juegos de casino
  const casinoGames = [
    {
      id: "crash",
      title: "Crash",
      description: t("crash_description"),
      image: "/games/crash.jpg",
      category: ["popular", "new"],
      gameType: "crash" as const,
      rating: 4.8,
    },
    {
      id: "slots1",
      title: "Fortune Tiger",
      description: t("slots_description"),
      image: "/games/slots.jpg",
      category: ["popular", "slots", "jackpot"],
      gameType: "slots" as const,
      rating: 4.5,
    },
    {
      id: "dice1",
      title: "Dice",
      description: t("dice_description"),
      image: "/games/dice.jpg",
      category: ["table"],
      gameType: "dice" as const,
      rating: 4.2,
    },
    {
      id: "roulette1",
      title: "European Roulette",
      description: t("games.roulette_description"),
      image: "/games/roulette.jpg",
      category: ["popular", "table"],
      gameType: "crash" as const, // Temporalmente usando crash hasta que se implemente roulette
      rating: 4.7,
    },
    {
      id: "blackjack1",
      title: "Blackjack Classic",
      description: t("games.blackjack_description"),
      image: "/games/blackjack.jpg",
      category: ["table"],
      gameType: "crash" as const, // Temporalmente usando crash hasta que se implemente blackjack
      rating: 4.6,
    },
    {
      id: "baccarat1",
      title: "Baccarat Pro",
      description: t("games.baccarat_description"),
      image: "/games/baccarat.jpg",
      category: ["table", "new"],
      gameType: "crash" as const, // Temporalmente usando crash hasta que se implemente baccarat
      rating: 4.4,
    },
  ];

  // Filtrar juegos por categoría y búsqueda
  const filteredGames = casinoGames.filter((game) => {
    const matchesCategory = activeCategory === "all" || game.category.includes(activeCategory);
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("games.casino_games")}</h1>
          <p className="text-gray-400">{t("games.casino_description")}</p>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={t("games.search_games")}
              className="pl-10 bg-[#192531] border-[#1c2b3a] focus:border-[#09b66d] text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-[#09b66d] text-white"
                    : "bg-[#192531] text-gray-300 hover:bg-[#313d4a]"
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de juegos */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                description={game.description}
                image={game.image}
                gameType={game.gameType}
                gameId={game.id}
                rating={game.rating}
                tag={{
                  text: game.category.includes("new") ? t("games.new") : "",
                  color: "primary",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <h2 className="text-xl font-semibold text-white">{t("games.no_games_found")}</h2>
            <p className="text-gray-400 max-w-md">{t("games.try_different_search")}</p>
          </div>
        )}
      </div>
    </div>
  );
}