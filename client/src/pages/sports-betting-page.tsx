import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { SportsEvent } from "@shared/schema";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Coins, Bell, Timer, Calendar, TrendingUp, Trophy, X } from "lucide-react";

// Sport types
const SPORTS = [
  { id: "mma", name: "MMA", icon: "🥊" },
  { id: "baseball", name: "MLB", icon: "⚾" },
  { id: "football", name: "NFL", icon: "🏈" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "soccer", name: "Soccer", icon: "⚽" },
  { id: "hockey", name: "Hockey", icon: "🏒" }
];

// Mock data - these would come from the API
const MOCK_EVENTS = [
  {
    id: 1,
    sportType: "mma",
    title: "UFC Fight Night",
    competition: "UFC 300",
    participants: {
      home: { name: "Jon Jones", odds: 1.55 },
      away: { name: "Francis Ngannou", odds: 2.40 }
    },
    startTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: "upcoming"
  },
  {
    id: 2,
    sportType: "baseball",
    title: "MLB Regular Season",
    competition: "American League",
    participants: {
      home: { name: "New York Yankees", odds: 1.90 },
      away: { name: "Boston Red Sox", odds: 1.85 }
    },
    startTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    status: "upcoming"
  },
  {
    id: 3,
    sportType: "football",
    title: "NFL Regular Season",
    competition: "Week 5",
    participants: {
      home: { name: "Kansas City Chiefs", odds: 1.65 },
      away: { name: "San Francisco 49ers", odds: 2.20 }
    },
    startTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: "upcoming"
  },
  {
    id: 4,
    sportType: "tennis",
    title: "Grand Slam",
    competition: "Wimbledon",
    participants: {
      home: { name: "Novak Djokovic", odds: 1.45 },
      away: { name: "Rafael Nadal", odds: 2.70 }
    },
    startTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: "upcoming"
  },
  {
    id: 5,
    sportType: "soccer",
    title: "Champions League",
    competition: "Quarterfinals",
    participants: {
      home: { name: "Manchester City", odds: 1.75 },
      away: { name: "Real Madrid", odds: 2.05 }
    },
    startTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: "upcoming"
  },
  {
    id: 6,
    sportType: "hockey",
    title: "NHL Playoffs",
    competition: "Stanley Cup Finals",
    participants: {
      home: { name: "Vegas Golden Knights", odds: 1.95 },
      away: { name: "Florida Panthers", odds: 1.85 }
    },
    startTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: "upcoming"
  }
];

export default function SportsBettingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [betSlips, setBetSlips] = useState<Map<number, { eventId: number, selection: "home" | "away", odds: number }>>(new Map());
  const [betAmount, setBetAmount] = useState<string>("10");
  
  // In a real app, this would be fetched from the API
  // const { data: events = [], isLoading } = useQuery({
  //   queryKey: ['/api/sports-events', selectedSport],
  //   queryFn: () => getQueryFn<SportsEvent[]>({ on401: "throw" })(`/api/sports-events?sportType=${selectedSport !== 'all' ? selectedSport : ''}`)
  // });
  
  // Using mock data for now
  const events = MOCK_EVENTS.filter(event => selectedSport === 'all' || event.sportType === selectedSport);
  
  const addToBetSlip = (eventId: number, selection: "home" | "away", odds: number) => {
    const newBetSlips = new Map(betSlips);
    newBetSlips.set(eventId, { eventId, selection, odds });
    setBetSlips(newBetSlips);
    
    toast({
      title: "Added to bet slip",
      description: "Your selection has been added to the bet slip."
    });
  };
  
  const removeFromBetSlip = (eventId: number) => {
    const newBetSlips = new Map(betSlips);
    newBetSlips.delete(eventId);
    setBetSlips(newBetSlips);
  };
  
  const placeBet = async () => {
    if (betSlips.size === 0) {
      toast({
        title: "No selections",
        description: "Please add at least one selection to your bet slip.",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid bet amount.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // const response = await apiRequest("POST", "/api/place-bets", {
      //   bets: Array.from(betSlips.values()).map(slip => ({
      //     eventId: slip.eventId,
      //     selection: slip.selection,
      //     odds: slip.odds,
      //     amount
      //   }))
      // });
      
      toast({
        title: "Bet placed successfully",
        description: "Your bet has been placed successfully."
      });
      
      // Clear bet slip
      setBetSlips(new Map());
      
    } catch (error) {
      toast({
        title: "Failed to place bet",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Calculate total odds for all selections
  const calculateTotalOdds = () => {
    if (betSlips.size === 0) return 0;
    return Array.from(betSlips.values()).reduce((total, slip) => total * slip.odds, 1);
  };
  
  // Calculate potential winnings
  const calculatePotentialWinnings = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    return amount * calculateTotalOdds();
  };
  
  // Format date for display
  const formatEventDate = (date: Date) => {
    // Today or tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + " " + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F1923] text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F1923] border-b border-gray-800 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button type="button" className="text-gray-400 hover:text-white focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="font-heading font-bold text-xl text-white tracking-wider ml-3">
                <span className="text-[#00FFAA]">Crypto</span>Play
              </h1>
            </div>
            
            <div className="hidden md:flex flex-1 px-4">
              <div className="max-w-md w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2 rounded-lg bg-[#1A2634] border border-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00FFAA] focus:border-[#00FFAA]" 
                    placeholder="Search events..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 text-[#0F1923] font-medium text-sm hover:from-[#33FFBB] hover:to-[#00FFAA] transition-all duration-200">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Deposit</span>
              </button>
              
              <div className="px-3 py-1.5 rounded-full bg-[#1A2634] border border-gray-700 flex items-center">
                <Coins className="h-4 w-4 mr-1.5 text-[#F9C846]" />
                <span className="text-sm font-semibold">{user?.balance}</span>
              </div>
              
              <div className="relative">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white focus:outline-none">
                  <Bell className="h-4 w-4" />
                </button>
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#FF3E8F] text-xs flex items-center justify-center">3</span>
              </div>
              
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column - Events */}
              <div className="w-full md:w-2/3">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">Sports Betting</h1>
                  <p className="text-gray-400">Place bets on your favorite sports and events.</p>
                </div>
                
                {/* Sport Selection Tabs */}
                <div className="mb-6 overflow-x-auto">
                  <div className="flex space-x-2 min-w-max">
                    <Button 
                      variant="outline" 
                      className={`${selectedSport === 'all' ? 'bg-[#1A2634] border-[#00FFAA]' : 'border-gray-700'} text-sm px-3 py-1 h-auto`}
                      onClick={() => setSelectedSport('all')}
                    >
                      All Sports
                    </Button>
                    
                    {SPORTS.map(sport => (
                      <Button 
                        key={sport.id}
                        variant="outline" 
                        className={`${selectedSport === sport.id ? 'bg-[#1A2634] border-[#00FFAA]' : 'border-gray-700'} text-sm px-3 py-1 h-auto`}
                        onClick={() => setSelectedSport(sport.id)}
                      >
                        <span className="mr-1.5">{sport.icon}</span>
                        {sport.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Events List */}
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <Card key={event.id} className="bg-[#1A2634] border-gray-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant="outline" className="bg-[#0F1923]/50 mr-2">
                                {SPORTS.find(s => s.id === event.sportType)?.icon || '🏆'}
                              </Badge>
                              <div>
                                <p className="text-xs text-gray-400">{event.competition}</p>
                                <p className="font-medium">{event.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatEventDate(event.startTime)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-[#0F1923] rounded-lg p-3 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="font-medium text-white mb-1">{event.participants.home.name}</p>
                              <Button 
                                variant="outline" 
                                className={`w-full border-gray-700 hover:border-[#00FFAA] ${betSlips.has(event.id) && betSlips.get(event.id)?.selection === 'home' ? 'bg-[#00FFAA]/10 border-[#00FFAA] text-[#00FFAA]' : ''}`}
                                onClick={() => addToBetSlip(event.id, 'home', event.participants.home.odds)}
                              >
                                {event.participants.home.odds.toFixed(2)}
                              </Button>
                            </div>
                            
                            <div className="text-center flex flex-col justify-center items-center">
                              <p className="text-xs text-gray-500 mb-1">Draw</p>
                              <Button 
                                variant="outline" 
                                className="w-full border-gray-700 hover:border-[#00FFAA]"
                                disabled
                              >
                                -
                              </Button>
                            </div>
                            
                            <div className="text-center">
                              <p className="font-medium text-white mb-1">{event.participants.away.name}</p>
                              <Button 
                                variant="outline" 
                                className={`w-full border-gray-700 hover:border-[#00FFAA] ${betSlips.has(event.id) && betSlips.get(event.id)?.selection === 'away' ? 'bg-[#00FFAA]/10 border-[#00FFAA] text-[#00FFAA]' : ''}`}
                                onClick={() => addToBetSlip(event.id, 'away', event.participants.away.odds)}
                              >
                                {event.participants.away.odds.toFixed(2)}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-400">No events found for the selected sport.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Bet Slip */}
              <div className="w-full md:w-1/3">
                <Card className="bg-[#1A2634] border-gray-800 sticky top-20">
                  <CardHeader>
                    <CardTitle>Bet Slip</CardTitle>
                    <CardDescription>Your selected bets</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {betSlips.size > 0 ? (
                      <div className="space-y-4">
                        {Array.from(betSlips.values()).map((slip) => {
                          const event = events.find(e => e.id === slip.eventId);
                          if (!event) return null;
                          
                          return (
                            <div key={slip.eventId} className="relative bg-[#0F1923] rounded-lg p-3">
                              <button 
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                                onClick={() => removeFromBetSlip(slip.eventId)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              
                              <div className="mb-2">
                                <p className="text-xs text-gray-400">{event.competition}</p>
                                <p className="font-medium">{event.title}</p>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm">
                                    {slip.selection === 'home' ? event.participants.home.name : event.participants.away.name}
                                    <span className="text-[#00FFAA] ml-1">
                                      (Win)
                                    </span>
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-transparent border-[#00FFAA] text-[#00FFAA]">
                                  {slip.odds.toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        
                        <Separator className="my-4 bg-gray-800" />
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Bet Amount</p>
                            <div className="relative">
                              <Input 
                                type="number" 
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="bg-[#0F1923] border-gray-700 pl-6"
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                <span className="text-gray-500">$</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-[#0F1923] rounded-lg p-3 space-y-2">
                            <div className="flex justify-between">
                              <p className="text-sm text-gray-400">Total Odds</p>
                              <p className="font-medium">{calculateTotalOdds().toFixed(2)}</p>
                            </div>
                            
                            <div className="flex justify-between">
                              <p className="text-sm text-gray-400">Potential Winnings</p>
                              <p className="font-medium text-[#00FFAA]">${calculatePotentialWinnings().toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                            onClick={placeBet}
                          >
                            Place Bet
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 mb-2">Your bet slip is empty</p>
                        <p className="text-xs text-gray-500">Select odds to add selections to your bet slip</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}