import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GameCard } from "@/components/ui/game-card";
import { Favorite } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's favorites
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      if (!user) throw new Error("Unauthorized");
      return apiRequest<Favorite[]>({
        url: '/api/favorites',
        method: 'GET'
      });
    },
    enabled: !!user,
  });

  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("failed_to_load_favorites"),
        variant: "destructive"
      });
    }
  }, [error, toast, t]);

  // Group favorites by game type
  const groupedFavorites = data?.reduce((acc, favorite) => {
    const { gameType } = favorite;
    
    if (!acc[gameType]) {
      acc[gameType] = [];
    }
    
    acc[gameType].push(favorite);
    return acc;
  }, {} as Record<string, Favorite[]>) || {};

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">{t("navigation.favorites")}</h1>
          <p className="text-gray-400">{t("favorites_description")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Button variant="outline" disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <h2 className="text-xl font-semibold text-white">{t("favorites.empty_state")}</h2>
            <p className="text-gray-400 max-w-md">{t("favorites.empty_state_description")}</p>
          </div>
        ) : (
          Object.entries(groupedFavorites).map(([gameType, favorites]) => (
            <div key={gameType} className="space-y-4">
              <h2 className="text-xl font-semibold text-white capitalize">
                {t(gameType)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favorites.map((favorite: Favorite) => (
                  <GameCard
                    key={favorite.id}
                    title={favorite.gameTitle}
                    description={t(`${gameType}_description`)}
                    image={favorite.gameImage || ""}
                    gameType={gameType as "slots" | "dice" | "crash"}
                    gameId={favorite.gameId || undefined}
                    tag={{ text: t(gameType), color: "primary" }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}