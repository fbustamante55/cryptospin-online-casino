import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

// Lista ampliada de idiomas
const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
];

export function SidebarLanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = LANGUAGES.find(lang => lang.code === (user?.language || "en")) || LANGUAGES[0];
  
  const handleLanguageChange = async (languageCode: string) => {
    if (!user || isChangingLanguage || languageCode === user.language) {
      setIsOpen(false);
      return;
    }
    
    try {
      setIsChangingLanguage(true);
      
      // Cambiar el idioma en i18next inmediatamente para una mejor experiencia
      await i18n.changeLanguage(languageCode);
      
      // Call API to update language preference
      await apiRequest({
        method: "POST",
        url: "/api/update-language",
        data: { language: languageCode }
      });
      
      toast({
        title: t('languageSelector.languageUpdated'),
        description: t('languageSelector.languageUpdateDescription'),
      });
      
      // Cerrar el diálogo
      setIsOpen(false);
      
      // Recargar la página para aplicar el nuevo idioma completamente
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: t('languageSelector.errorUpdating'),
        description: error instanceof Error ? error.message : t('languageSelector.unknownError'),
        variant: "destructive",
      });
    } finally {
      setIsChangingLanguage(false);
    }
  };
  
  if (collapsed) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Link href="#" className="flex items-center px-4 py-3 text-white hover:bg-[#192531] transition-colors">
            <span className="text-gray-400">
              <Globe className="h-4 w-4" />
            </span>
          </Link>
        </DialogTrigger>
        <DialogContent className="bg-[#192531] border-[#1c2b3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-4">{t('languageSelector.selectLanguage')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {LANGUAGES.map((language) => (
              <Button
                key={language.code}
                variant="outline"
                className={`flex items-center justify-start p-3 border-[#1c2b3a] hover:bg-[#0F1923]/50 ${currentLanguage.code === language.code ? 'bg-[#09b66d] hover:bg-[#09b66d]/90 text-white' : 'bg-[#192531]'}`}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChangingLanguage}
              >
                <span className="mr-2 text-xl">{language.flag}</span>
                <span>{language.nativeName}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Link 
          href="#" 
          className="flex items-center justify-between px-4 py-3 text-white hover:bg-[#192531] transition-colors"
        >
          <div className="flex items-center">
            <span className="text-gray-400">
              <Globe className="h-4 w-4" />
            </span>
            <span className="ml-3">{t('sidebar.language')}: {currentLanguage.flag} {currentLanguage.nativeName}</span>
          </div>
          <span className="text-gray-400">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </Link>
      </DialogTrigger>
      <DialogContent className="bg-[#192531] border-[#1c2b3a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">{t('languageSelector.selectLanguage')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((language) => (
            <Button
              key={language.code}
              variant="outline"
              className={`flex items-center justify-start p-3 border-[#1c2b3a] hover:bg-[#0F1923]/50 ${currentLanguage.code === language.code ? 'bg-[#09b66d] hover:bg-[#09b66d]/90 text-white' : 'bg-[#192531]'}`}
              onClick={() => handleLanguageChange(language.code)}
              disabled={isChangingLanguage}
            >
              <span className="mr-2 text-xl">{language.flag}</span>
              <span>{language.nativeName}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}