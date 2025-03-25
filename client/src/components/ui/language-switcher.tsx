import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Language = {
  code: string;
  name: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  
  const currentLanguage = LANGUAGES.find(lang => lang.code === (user?.language || "en")) || LANGUAGES[0];
  
  const handleLanguageChange = async (languageCode: string) => {
    if (!user || isChangingLanguage || languageCode === user.language) return;
    
    try {
      setIsChangingLanguage(true);
      
      // Call API to update language preference
      await apiRequest("POST", "/api/update-language", { language: languageCode });
      
      toast({
        title: "Language updated",
        description: "Your language preference has been updated. Some content may require refreshing to display in the new language.",
      });
      
      // In a real app, this would trigger a refresh of the user data and update translations
      // For now, we'll just handle this manually
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Failed to update language",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChangingLanguage(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="border-gray-700 hover:bg-[#0F1923]/50 transition-colors"
        >
          <Languages className="h-4 w-4 text-gray-400" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1A2634] border-gray-800 text-white">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={`cursor-pointer hover:bg-[#0F1923]/50 ${currentLanguage.code === language.code ? 'bg-[#0F1923]' : ''}`}
            onClick={() => handleLanguageChange(language.code)}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}