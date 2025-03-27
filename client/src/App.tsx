import { Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Route } from "wouter";
// Importar i18n (esto inicializa la configuración de i18n)
import "@/lib/i18n";

// Pages
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import WalletPage from "@/pages/wallet-page";
import HistoryPage from "@/pages/history-page";
import ProfilePage from "@/pages/profile-page";
import FavoritesPage from "@/pages/favorites-page";
import TestPhoneInputPage from "@/pages/test-phone-input-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import SportsBettingPage from "@/pages/sports-betting-page";
import TournamentsPage from "@/pages/tournaments-page";
import RewardsPage from "@/pages/rewards-page";
import SupportPage from "@/pages/support-page";
import RecentGamesPage from "@/pages/recent-games-page";
import LiveEventsPage from "@/pages/live-events-page";
import EventDetailPage from "@/pages/event-detail-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/favorites" component={FavoritesPage} />
      <ProtectedRoute path="/recent" component={RecentGamesPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} />
      <ProtectedRoute path="/sports" component={SportsBettingPage} />
      <ProtectedRoute path="/sports/vivo" component={LiveEventsPage} />
      <ProtectedRoute path="/sports/event/:eventId" component={EventDetailPage} />
      <ProtectedRoute path="/tournaments" component={TournamentsPage} />
      <ProtectedRoute path="/rewards" component={RewardsPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      <Route path="/test-phone-input">
        <TestPhoneInputPage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// Importamos el componente de debug
import { LanguageDebug } from "@/components/language-debug";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        {/* Componente de debug para ver el estado del idioma */}
        <LanguageDebug />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
