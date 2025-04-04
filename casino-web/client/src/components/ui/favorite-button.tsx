import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface FavoriteButtonProps {
  gameType: string;
  gameId?: string;
  gameName: string; // Will be stored as gameTitle in the database
  gameImage?: string;
  className?: string;
}

export function FavoriteButton({ 
  gameType, 
  gameId, 
  gameName, 
  gameImage,
  className 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);

  // Check if this game is already a favorite
  const { data, isLoading } = useQuery({
    queryKey: ['/api/favorites/check', gameType, gameId],
    queryFn: async () => {
      if (!user) return { isFavorite: false };
      
      const params = new URLSearchParams({
        gameType,
        ...(gameId && { gameId })
      });
      
      return apiRequest<{ isFavorite: boolean, favoriteId?: number }>({
        url: `/api/favorites/check?${params}`,
        method: 'GET'
      });
    },
    enabled: !!user,
  });

  // Add to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t("favorites.login_required"));
      
      return apiRequest({
        url: '/api/favorites',
        method: 'POST',
        data: {
          userId: user.id,
          gameType,
          gameId: gameId || null,
          gameTitle: gameName, // Convert from gameName prop to gameTitle field
          gameImage: gameImage || null
        }
      });
    },
    onSuccess: (data) => {
      setFavoriteId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: t("favorites.added_title"),
        description: t("favorites.added_description", { gameName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || t("favorites.failed_add"),
        variant: "destructive"
      });
    }
  });

  // Remove from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user) throw new Error(t("favorites.login_required_remove"));
      
      return apiRequest({
        url: `/api/favorites/${id}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      setFavoriteId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites/check', gameType, gameId] });
      toast({
        title: t("favorites.removed_title"),
        description: t("favorites.removed_description", { gameName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || t("favorites.failed_remove"),
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (data?.favoriteId) {
      setFavoriteId(data.favoriteId);
    }
  }, [data]);

  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: t("auth.login_required"),
        description: t("favorites.login_required_message"),
        variant: "destructive"
      });
      return;
    }

    if (data?.isFavorite && favoriteId) {
      removeFavoriteMutation.mutate(favoriteId);
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const isFavorite = data?.isFavorite || false;
  const isLoaded = !isLoading;
  const isPending = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={!isLoaded || isPending || !user}
      className={cn(
        "absolute top-2 right-2 z-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50",
        className
      )}
    >
      <Star
        className={cn(
          "h-5 w-5 transition-all",
          isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    </Button>
  );
}