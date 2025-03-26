import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Twitch,
  Github,
  ChevronDown
} from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a1420] border-t border-[#1c2b3a] text-white pt-8 pb-4">
      {/* Logo and social media */}
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#09b66d] to-[#00e5af] bg-clip-text text-transparent">
            CryptoSpin
          </h2>
          <p className="text-sm text-gray-400">
            © {currentYear} CryptoSpin.com | {t('footer.allRightsReserved')}
          </p>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Twitter size={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Facebook size={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Instagram size={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Youtube size={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Twitch size={20} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">
            <Github size={20} />
          </a>
        </div>
      </div>

      {/* Link sections */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 border-t border-[#1c2b3a] pt-8">
          {/* Casino section */}
          <div>
            <h3 className="text-white font-medium mb-4">{t('tabs.casino')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/crash" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sidebar.crash')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.slots')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sidebar.liveCasino')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.roulette')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.blackjack')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sidebar.providers')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.promotionsAndCompetitions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Sports section */}
          <div>
            <h3 className="text-white font-medium mb-4">{t('tabs.sports')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sports" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.sportsBetting')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sidebar.liveEvents')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sports.soccer')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sports.basketball')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('sports.tennis')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.eSports')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.sportRules')}
                </Link>
              </li>
            </ul>
          </div>

          {/* About Us section */}
          <div>
            <h3 className="text-white font-medium mb-4">{t('footer.aboutUs')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.vipClub')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.affiliate')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.verification')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.helpWithProblems')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.liveChatSupport')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.termsAndConditions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Info section */}
          <div>
            <h3 className="text-white font-medium mb-4">{t('footer.paymentInfo')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.depositsAndWithdrawals')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.paymentMethods')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.cryptoGuide')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.cryptoWithdrawals')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.cashierGuide')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.howToDeposit')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support section */}
          <div>
            <h3 className="text-white font-medium mb-4">{t('footer.helpAndSupport')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.helpGuides')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.casinoGuide')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.sportsBettingGuide')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.cryptoGuide')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.stakeVIPPerks')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-[#09b66d] transition-colors">
                  {t('footer.houseEdgeExplained')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Language and currency selector */}
      <div className="container mx-auto px-4 mt-8 pt-4 border-t border-[#1c2b3a]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            CryptoSpin © {currentYear} - {t('footer.disclaimer')}
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <button className="flex items-center space-x-2 bg-[#0e1824] px-3 py-1.5 rounded border border-[#1c2b3a] text-sm">
                <span>🇺🇸</span>
                <span>English</span>
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="relative">
              <button className="flex items-center space-x-2 bg-[#0e1824] px-3 py-1.5 rounded border border-[#1c2b3a] text-sm">
                <span>USD</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}