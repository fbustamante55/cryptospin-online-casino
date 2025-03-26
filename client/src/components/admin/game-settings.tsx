import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Joystick, 
  Save,
  Dices, 
  CircleOff,
  Combine,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for each game type
const rouletteSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(1),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  winningOdds: z.number().min(1).max(40),
  enabledBetTypes: z.object({
    number: z.boolean(),
    color: z.boolean(),
    evenOdd: z.boolean(),
    highLow: z.boolean(),
    dozen: z.boolean(),
    column: z.boolean(),
    split: z.boolean(),
    street: z.boolean(),
    corner: z.boolean(),
    sixline: z.boolean(),
  }),
});

const slotsSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(0.5),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  symbolFrequencies: z.object({
    seven: z.number().min(1).max(100),
    bar: z.number().min(1).max(100),
    doubleBar: z.number().min(1).max(100),
    tripleBar: z.number().min(1).max(100),
    cherry: z.number().min(1).max(100),
    lemon: z.number().min(1).max(100),
    orange: z.number().min(1).max(100),
    plum: z.number().min(1).max(100),
  }),
  bonusFrequency: z.number().min(0).max(100),
  freeSpinsFrequency: z.number().min(0).max(100),
  jackpotEnabled: z.boolean(),
  jackpotAmount: z.number().min(1000),
  jackpotContribution: z.number().min(0).max(10),
  payouts: z.object({
    '7': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(100),
    }),
    'BAR': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(50),
    }),
    '2xBAR': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(50),
    }),
    '3xBAR': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(30),
    }),
    'CHERRY': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(20),
    }),
    'ANY': z.object({
      symbol: z.string(),
      label: z.string(),
      multiplier: z.number().min(1).max(10),
    }),
  }).optional(),
  bookOfEgyptSettings: z.object({
    winProbability: z.number().min(1).max(100),
    maxMultiplier: z.number().min(5).max(100),
    specialSymbolFrequency: z.number().min(1).max(30),
  }).optional(),
});

const diceSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(1),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  minWinChance: z.number().min(1).max(98),
  maxWinChance: z.number().min(1).max(98),
  maxMultiplier: z.number().min(2),
});

const crashSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(1),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  maxMultiplier: z.number().min(2),
  crashCurveParameters: z.object({
    baseMultiplier: z.number().min(0.1),
    volatility: z.number().min(0.1).max(10),
    houseEdgeFactor: z.number().min(0.1).max(5),
  }),
  autoCashoutEnabled: z.boolean(),
  gameIntervalSeconds: z.number().min(5).max(60),
});

const blackjackSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(1),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  deckCount: z.number().min(1).max(8),
  dealerStandsOnSoft17: z.boolean(),
  blackjackPaysRatio: z.number().min(1).max(2.5),
  doubleAfterSplit: z.boolean(),
  surrender: z.boolean(),
  insurance: z.boolean(),
  maxSplits: z.number().min(1).max(4),
});

const baccaratSettingsSchema = z.object({
  houseEdge: z.number().min(0).max(15),
  minBet: z.number().min(1),
  maxBet: z.number().min(10),
  maxWin: z.number().min(100),
  playerBankerPayoutRatio: z.number().min(0.5).max(1),
  tiePayoutRatio: z.number().min(7).max(9),
  deckCount: z.number().min(1).max(8),
});

type RouletteSettings = z.infer<typeof rouletteSettingsSchema>;
type SlotsSettings = z.infer<typeof slotsSettingsSchema>;
type DiceSettings = z.infer<typeof diceSettingsSchema>;
type CrashSettings = z.infer<typeof crashSettingsSchema>;
type BlackjackSettings = z.infer<typeof blackjackSettingsSchema>;
type BaccaratSettings = z.infer<typeof baccaratSettingsSchema>;

export function GameSettings() {
  const [activeTab, setActiveTab] = useState("roulette");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize with some sensible defaults
  const rouletteForm = useForm<RouletteSettings>({
    resolver: zodResolver(rouletteSettingsSchema),
    defaultValues: {
      houseEdge: 2.7,
      minBet: 10,
      maxBet: 10000,
      maxWin: 100000,
      winningOdds: 35,
      enabledBetTypes: {
        number: true,
        color: true,
        evenOdd: true,
        highLow: true,
        dozen: true,
        column: true,
        split: true,
        street: true,
        corner: true,
        sixline: true,
      },
    },
  });

  const slotsForm = useForm<SlotsSettings>({
    resolver: zodResolver(slotsSettingsSchema),
    defaultValues: {
      houseEdge: 5,
      minBet: 0.5,
      maxBet: 5000,
      maxWin: 50000,
      symbolFrequencies: {
        seven: 5,
        bar: 10,
        doubleBar: 15,
        tripleBar: 10,
        cherry: 20,
        lemon: 15,
        orange: 15,
        plum: 10,
      },
      bonusFrequency: 5,
      freeSpinsFrequency: 3,
      jackpotEnabled: true,
      jackpotAmount: 10000,
      jackpotContribution: 2,
      payouts: {
        '7': { symbol: '7', label: 'Three 7s', multiplier: 10 },
        'BAR': { symbol: 'BAR', label: 'Three BARs', multiplier: 5 },
        '2xBAR': { symbol: '2xBAR', label: 'Three 2xBARs', multiplier: 4 },
        '3xBAR': { symbol: '3xBAR', label: 'Three 3xBARs', multiplier: 3 },
        'CHERRY': { symbol: 'CH', label: 'Three CHERRYs', multiplier: 2.5 },
        'ANY': { symbol: 'ANY', label: 'Any matching symbols', multiplier: 2 }
      },
      bookOfEgyptSettings: {
        winProbability: 25, // 25% probabilidad de ganar (baja)
        maxMultiplier: 10,  // Multiplicador máximo de 10x
        specialSymbolFrequency: 10 // Frecuencia de símbolos especiales (10%)
      }
    },
  });

  const diceForm = useForm<DiceSettings>({
    resolver: zodResolver(diceSettingsSchema),
    defaultValues: {
      houseEdge: 1.5,
      minBet: 10,
      maxBet: 10000,
      maxWin: 100000,
      minWinChance: 1,
      maxWinChance: 98,
      maxMultiplier: 99,
    },
  });

  const crashForm = useForm<CrashSettings>({
    resolver: zodResolver(crashSettingsSchema),
    defaultValues: {
      houseEdge: 3,
      minBet: 10,
      maxBet: 10000,
      maxWin: 100000,
      maxMultiplier: 100,
      crashCurveParameters: {
        baseMultiplier: 1,
        volatility: 3,
        houseEdgeFactor: 1.5,
      },
      autoCashoutEnabled: true,
      gameIntervalSeconds: 15,
    },
  });

  const blackjackForm = useForm<BlackjackSettings>({
    resolver: zodResolver(blackjackSettingsSchema),
    defaultValues: {
      houseEdge: 0.5,
      minBet: 10,
      maxBet: 10000,
      maxWin: 100000,
      deckCount: 6,
      dealerStandsOnSoft17: true,
      blackjackPaysRatio: 1.5,
      doubleAfterSplit: true,
      surrender: true,
      insurance: true,
      maxSplits: 3,
    },
  });

  const baccaratForm = useForm<BaccaratSettings>({
    resolver: zodResolver(baccaratSettingsSchema),
    defaultValues: {
      houseEdge: 1.06,
      minBet: 10,
      maxBet: 10000,
      maxWin: 100000,
      playerBankerPayoutRatio: 0.95,
      tiePayoutRatio: 8,
      deckCount: 8,
    },
  });

  useEffect(() => {
    fetchGameSettings();
  }, []);

  const fetchGameSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest({
        url: "/api/admin/game-settings",
        method: "GET",
      });

      // Update forms with server data
      if (response.roulette) {
        rouletteForm.reset(response.roulette);
      }
      if (response.slots) {
        slotsForm.reset(response.slots);
      }
      if (response.dice) {
        diceForm.reset(response.dice);
      }
      if (response.crash) {
        crashForm.reset(response.crash);
      }
      if (response.blackjack) {
        blackjackForm.reset(response.blackjack);
      }
      if (response.baccarat) {
        baccaratForm.reset(response.baccarat);
      }
    } catch (error) {
      console.error("Error fetching game settings:", error);
      toast({
        title: "Error",
        description: "Failed to load game settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (formData: any, gameType: string) => {
    setIsSaving(true);
    try {
      await apiRequest({
        url: `/api/admin/game-settings/${gameType}`,
        method: "PATCH",
        data: formData,
      });

      toast({
        title: "Success",
        description: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} settings saved successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error(`Error saving ${gameType} settings:`, error);
      toast({
        title: "Error",
        description: `Failed to save ${gameType} settings`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onRouletteSubmit = (data: RouletteSettings) => saveSettings(data, "roulette");
  const onSlotsSubmit = (data: SlotsSettings) => saveSettings(data, "slots");
  const onDiceSubmit = (data: DiceSettings) => saveSettings(data, "dice");
  const onCrashSubmit = (data: CrashSettings) => saveSettings(data, "crash");
  const onBlackjackSubmit = (data: BlackjackSettings) => saveSettings(data, "blackjack");
  const onBaccaratSubmit = (data: BaccaratSettings) => saveSettings(data, "baccarat");

  if (isLoading) {
    return (
      <Card className="w-full bg-[#1A2634] border-gray-800">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFAA]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#1A2634] border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Joystick className="h-5 w-5 text-[#00FFAA]" />
          Game Settings
        </CardTitle>
        <CardDescription>
          Configure house edge, limits, and game-specific parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="roulette">Roulette</TabsTrigger>
            <TabsTrigger value="slots">Slots</TabsTrigger>
            <TabsTrigger value="dice">Dice</TabsTrigger>
            <TabsTrigger value="crash">Crash</TabsTrigger>
            <TabsTrigger value="blackjack">Blackjack</TabsTrigger>
            <TabsTrigger value="baccarat">Baccarat</TabsTrigger>
          </TabsList>
          
          {/* Roulette Settings */}
          <TabsContent value="roulette">
            <Form {...rouletteForm}>
              <form onSubmit={rouletteForm.handleSubmit(onRouletteSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-lg font-semibold flex items-center">
                      <CircleOff className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      General Settings
                    </div>
                    
                    <FormField
                      control={rouletteForm.control}
                      name="houseEdge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Edge (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={0}
                                max={15}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value}%</span>
                          </div>
                          <FormDescription>
                            Set the house edge percentage (European roulette standard: 2.7%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="winningOdds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Straight-Up Win Payout (Odds)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={40}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value}:1</span>
                          </div>
                          <FormDescription>
                            Set the payout odds for a straight-up win (standard: 35:1)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-lg font-semibold flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      Betting Limits
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={rouletteForm.control}
                        name="minBet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Bet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="bg-[#0F1923] border-gray-800"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={rouletteForm.control}
                        name="maxBet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Bet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="bg-[#0F1923] border-gray-800"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={rouletteForm.control}
                      name="maxWin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Win</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#0F1923] border-gray-800"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum amount a player can win in a single round
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                <div className="space-y-4">
                  <div className="text-lg font-semibold flex items-center">
                    <Dices className="h-5 w-5 mr-2 text-[#00FFAA]" />
                    Enabled Bet Types
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.number"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Straight-Up</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.color"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Color</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.evenOdd"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Even/Odd</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.highLow"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>High/Low</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.dozen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Dozen</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.column"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Column</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.split"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Split</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.street"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Street</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.corner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Corner</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rouletteForm.control}
                      name="enabledBetTypes.sixline"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Six Line</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Roulette Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Slots Settings */}
          <TabsContent value="slots">
            <Form {...slotsForm}>
              <form onSubmit={slotsForm.handleSubmit(onSlotsSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-lg font-semibold flex items-center">
                      <Combine className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      General Settings
                    </div>
                    
                    <FormField
                      control={slotsForm.control}
                      name="houseEdge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Edge (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={0}
                                max={15}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value}%</span>
                          </div>
                          <FormDescription>
                            Set the house edge percentage (typical range: 3-10%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="jackpotEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800 p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Enable Jackpot</FormLabel>
                            <FormDescription>
                              Allow players to win a progressive jackpot
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {slotsForm.watch("jackpotEnabled") && (
                      <>
                        <FormField
                          control={slotsForm.control}
                          name="jackpotAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jackpot Starting Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="bg-[#0F1923] border-gray-800"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Initial jackpot amount when reset
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={slotsForm.control}
                          name="jackpotContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jackpot Contribution (%)</FormLabel>
                              <div className="flex items-center gap-4">
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="flex-1"
                                  />
                                </FormControl>
                                <span className="w-12 text-center">{field.value}%</span>
                              </div>
                              <FormDescription>
                                Percentage of each bet that contributes to the jackpot
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    <FormField
                      control={slotsForm.control}
                      name="bonusFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus Round Frequency (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={0}
                                max={20}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value}%</span>
                          </div>
                          <FormDescription>
                            How often bonus rounds appear (0 to disable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="freeSpinsFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Spins Frequency (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={0}
                                max={15}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value}%</span>
                          </div>
                          <FormDescription>
                            How often free spins are awarded (0 to disable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-lg font-semibold flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-[#00FFAA]" />
                      Betting Limits
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={slotsForm.control}
                        name="minBet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Bet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="bg-[#0F1923] border-gray-800"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={slotsForm.control}
                        name="maxBet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Bet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="bg-[#0F1923] border-gray-800"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={slotsForm.control}
                      name="maxWin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Win</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-[#0F1923] border-gray-800"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum amount a player can win in a single spin (excluding jackpot)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                {/* Book of Egypt Settings */}
                <div className="space-y-4">
                  <div className="text-lg font-semibold flex items-center">
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#00FFAA"
                      strokeWidth="2"
                      className="h-5 w-5 mr-2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <path d="M7 7h10v10H7z"></path>
                      <path d="M8 12h8"></path>
                      <path d="M12 8v8"></path>
                    </svg>
                    Book of Egypt Specific Settings
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={slotsForm.control}
                      name="bookOfEgyptSettings.winProbability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Win Probability (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={5}
                                max={50}
                                step={1}
                                value={[field.value || 25]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value || 25}%</span>
                          </div>
                          <FormDescription>
                            Probability of getting a winning combination (lower = harder)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="bookOfEgyptSettings.maxMultiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={2}
                                max={50}
                                step={1}
                                value={[field.value || 10]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value || 10}x</span>
                          </div>
                          <FormDescription>
                            Highest possible multiplier for Book of Egypt
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="bookOfEgyptSettings.specialSymbolFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Symbol Frequency (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value || 10]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value || 10}%</span>
                          </div>
                          <FormDescription>
                            How often special book symbols appear
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                {/* Payout Table Settings */}
                <div className="space-y-4">
                  <div className="text-lg font-semibold flex items-center">
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#00FFAA"
                      strokeWidth="2"
                      className="h-5 w-5 mr-2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                    Payout Table Settings
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={slotsForm.control}
                      name="payouts.7.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>7 Symbol Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={20}
                                step={0.5}
                                value={[field.value || 10]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 10}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="payouts.BAR.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BAR Symbol Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={0.5}
                                value={[field.value || 5]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 5}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="payouts.2xBAR.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>2xBAR Symbol Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={8}
                                step={0.5}
                                value={[field.value || 4]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 4}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="payouts.3xBAR.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>3xBAR Symbol Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={6}
                                step={0.5}
                                value={[field.value || 3]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 3}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="payouts.CHERRY.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CHERRY Symbol Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={0.1}
                                value={[field.value || 2.5]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 2.5}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="payouts.ANY.multiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ANY Matching Symbols Multiplier</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={3}
                                step={0.1}
                                value={[field.value || 2]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-12 text-center">{field.value || 2}x</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                <div className="space-y-4">
                  <div className="text-lg font-semibold flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-[#00FFAA]" />
                    Symbol Frequencies
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.seven"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seven Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.bar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bar Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.doubleBar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>2x Bar Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.tripleBar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>3x Bar Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.cherry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cherry Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.lemon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lemon Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.orange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orange Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={slotsForm.control}
                      name="symbolFrequencies.plum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plum Symbol (%)</FormLabel>
                          <div className="flex items-center gap-4">
                            <FormControl>
                              <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                            </FormControl>
                            <span className="w-10 text-center">{field.value}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Slots Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Other game tabs would follow the same pattern */}
          <TabsContent value="dice">
            <Form {...diceForm}>
              <form onSubmit={diceForm.handleSubmit(onDiceSubmit)} className="space-y-6">
                {/* Dice settings form content */}
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Dice Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="crash">
            <Form {...crashForm}>
              <form onSubmit={crashForm.handleSubmit(onCrashSubmit)} className="space-y-6">
                {/* Crash settings form content */}
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Crash Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="blackjack">
            <Form {...blackjackForm}>
              <form onSubmit={blackjackForm.handleSubmit(onBlackjackSubmit)} className="space-y-6">
                {/* Blackjack settings form content */}
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Blackjack Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="baccarat">
            <Form {...baccaratForm}>
              <form onSubmit={baccaratForm.handleSubmit(onBaccaratSubmit)} className="space-y-6">
                {/* Baccarat settings form content */}
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#00FFAA] to-[#00FFAA]/80 hover:from-[#33FFBB] hover:to-[#00FFAA] text-[#0F1923] font-medium"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4 animate-pulse" /> 
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" /> 
                      Save Baccarat Settings
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}