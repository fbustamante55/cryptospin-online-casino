import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import { 
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber } from "@/lib/game-utils";

// Chart color constants
const COLORS = {
  primary: "#00FFAA",
  secondary: "#0088FE",
  tertiary: "#FF8042",
  success: "#00C49F",
  warning: "#FFBB28",
  danger: "#FF5A5A",
  purple: "#7C3AED",
  indigo: "#6366F1",
  pink: "#EC4899",
  blue: "#3B82F6"
};

const PIE_COLORS = [
  COLORS.primary, 
  COLORS.secondary, 
  COLORS.tertiary, 
  COLORS.success, 
  COLORS.warning, 
  COLORS.danger
];

// Types for our analytics data
interface AnalyticsTimeframe {
  day: {
    labels: string[];
    users: number[];
    transactions: number[];
    bets: number[];
    wins: number[];
    deposits: number[];
    withdrawals: number[];
    revenue: number[];
  };
  week: {
    labels: string[];
    users: number[];
    transactions: number[];
    bets: number[];
    wins: number[];
    deposits: number[];
    withdrawals: number[];
    revenue: number[];
  };
  month: {
    labels: string[];
    users: number[];
    transactions: number[];
    bets: number[];
    wins: number[];
    deposits: number[];
    withdrawals: number[];
    revenue: number[];
  };
  year: {
    labels: string[];
    users: number[];
    transactions: number[];
    bets: number[];
    wins: number[];
    deposits: number[];
    withdrawals: number[];
    revenue: number[];
  };
}

interface GameAnalytics {
  gameType: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  revenue: number;
  popularity: number;
}

interface UserSegment {
  segment: string;
  count: number;
  percentage: number;
  avgBet: number;
  totalBets: number;
  totalRevenue: number;
}

interface AnalyticsData {
  timeframeData: AnalyticsTimeframe;
  gameAnalytics: GameAnalytics[];
  userSegments: UserSegment[];
  kpis: {
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
    retentionRate: number;
    averageSessionTime: number;
    newUsersToday: number;
    totalRevenue: number;
    dailyRevenue: number;
    profitMargin: number;
    averageBetSize: number;
  };
}

export function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("week");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const { toast } = useToast();

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AnalyticsData>({
        url: `/api/admin/analytics?timeframe=${timeframe}`,
        method: "GET"
      });
      
      setAnalyticsData(response);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to format data for charts
  const prepareTimeframeData = (dataType: keyof AnalyticsTimeframe["day"]) => {
    if (!analyticsData) return [];
    
    return analyticsData.timeframeData[timeframe].labels.map((label, index) => ({
      name: label,
      value: analyticsData.timeframeData[timeframe][dataType][index]
    }));
  };

  const prepareGameAnalyticsData = () => {
    if (!analyticsData) return [];
    return analyticsData.gameAnalytics;
  };

  const prepareUserSegmentsData = () => {
    if (!analyticsData) return [];
    return analyticsData.userSegments;
  };

  // Loading state
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

  // If data failed to load
  if (!analyticsData) {
    return (
      <Card className="w-full bg-[#1A2634] border-gray-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load analytics data</p>
            <Button onClick={fetchAnalyticsData}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A2634] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Users className="h-4 w-4 mr-2 text-[#00FFAA]" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.kpis.totalUsers)}</div>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <span className="text-[#00FFAA] font-medium">
                +{formatNumber(analyticsData.kpis.newUsersToday)}
              </span>
              <span className="ml-1">today</span>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <div>
                <span className="text-gray-400">Active: </span>
                <span className="font-medium">{formatNumber(analyticsData.kpis.activeUsers)}</span>
              </div>
              <div>
                <span className="text-gray-400">Conversion: </span>
                <span className="font-medium">{analyticsData.kpis.conversionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-[#00FFAA]" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(analyticsData.kpis.totalRevenue)}</div>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <span className="text-[#00FFAA] font-medium">
                ${formatNumber(analyticsData.kpis.dailyRevenue)}
              </span>
              <span className="ml-1">today</span>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <div>
                <span className="text-gray-400">Margin: </span>
                <span className="font-medium">{analyticsData.kpis.profitMargin}%</span>
              </div>
              <div>
                <span className="text-gray-400">Avg Bet: </span>
                <span className="font-medium">${formatNumber(analyticsData.kpis.averageBetSize)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-[#00FFAA]" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.kpis.retentionRate}%</div>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <span className="ml-1">retention rate</span>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <div>
                <span className="text-gray-400">Avg Session: </span>
                <span className="font-medium">{analyticsData.kpis.averageSessionTime} min</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1A2634] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-[#00FFAA]" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={timeframe}
              onValueChange={(value) => setTimeframe(value as "day" | "week" | "month" | "year")}
            >
              <SelectTrigger className="bg-[#0F1923] border-gray-800">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2634] border-gray-800">
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant={chartType === "line" ? "default" : "outline"}
                className={chartType === "line" ? "bg-[#00FFAA] text-black" : "bg-[#0F1923] border-gray-800"}
                onClick={() => setChartType("line")}
              >
                Line
              </Button>
              <Button 
                size="sm" 
                variant={chartType === "bar" ? "default" : "outline"}
                className={chartType === "bar" ? "bg-[#00FFAA] text-black" : "bg-[#0F1923] border-gray-800"}
                onClick={() => setChartType("bar")}
              >
                Bar
              </Button>
              <Button 
                size="sm" 
                variant={chartType === "area" ? "default" : "outline"}
                className={chartType === "area" ? "bg-[#00FFAA] text-black" : "bg-[#0F1923] border-gray-800"}
                onClick={() => setChartType("area")}
              >
                Area
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="revenue" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Revenue & Bets
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Games Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            User Segments
          </TabsTrigger>
        </TabsList>
        
        {/* Revenue & Bets Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Over Time</CardTitle>
                <CardDescription>
                  Total revenue during selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={prepareTimeframeData("revenue")}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`, 'Revenue']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name="Revenue" 
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: COLORS.primary }} 
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    ) : chartType === "bar" ? (
                      <BarChart data={prepareTimeframeData("revenue")}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`, 'Revenue']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Revenue" 
                          fill={COLORS.primary} 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <AreaChart data={prepareTimeframeData("revenue")}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`, 'Revenue']}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Revenue"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Bets vs Wins</CardTitle>
                <CardDescription>
                  Comparison of total bets and wins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        bets: analyticsData.timeframeData[timeframe].bets[index],
                        wins: analyticsData.timeframeData[timeframe].wins[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [formatNumber(value as number)]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="bets" 
                          name="Total Bets" 
                          stroke={COLORS.secondary} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: COLORS.secondary }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="wins" 
                          name="Total Wins" 
                          stroke={COLORS.success} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: COLORS.success }} 
                        />
                      </LineChart>
                    ) : chartType === "bar" ? (
                      <BarChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        bets: analyticsData.timeframeData[timeframe].bets[index],
                        wins: analyticsData.timeframeData[timeframe].wins[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [formatNumber(value as number)]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="bets" 
                          name="Total Bets" 
                          fill={COLORS.secondary} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="wins" 
                          name="Total Wins" 
                          fill={COLORS.success} 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <AreaChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        bets: analyticsData.timeframeData[timeframe].bets[index],
                        wins: analyticsData.timeframeData[timeframe].wins[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [formatNumber(value as number)]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="bets"
                          name="Total Bets"
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                          fillOpacity={0.2}
                          stackId="1"
                        />
                        <Area
                          type="monotone"
                          dataKey="wins"
                          name="Total Wins"
                          stroke={COLORS.success}
                          fill={COLORS.success}
                          fillOpacity={0.2}
                          stackId="2"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Deposits & Withdrawals</CardTitle>
                <CardDescription>
                  Money flowing in and out of the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        deposits: analyticsData.timeframeData[timeframe].deposits[index],
                        withdrawals: analyticsData.timeframeData[timeframe].withdrawals[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="deposits" 
                          name="Deposits" 
                          stroke={COLORS.blue} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: COLORS.blue }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="withdrawals" 
                          name="Withdrawals" 
                          stroke={COLORS.danger} 
                          strokeWidth={2}
                          dot={{ r: 4, fill: COLORS.danger }} 
                        />
                      </LineChart>
                    ) : chartType === "bar" ? (
                      <BarChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        deposits: analyticsData.timeframeData[timeframe].deposits[index],
                        withdrawals: analyticsData.timeframeData[timeframe].withdrawals[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="deposits" 
                          name="Deposits" 
                          fill={COLORS.blue} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="withdrawals" 
                          name="Withdrawals" 
                          fill={COLORS.danger} 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <AreaChart data={prepareTimeframeData("labels").map((item, index) => ({
                        name: item.name,
                        deposits: analyticsData.timeframeData[timeframe].deposits[index],
                        withdrawals: analyticsData.timeframeData[timeframe].withdrawals[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          tick={{fill: '#94a3b8'}}
                          tickFormatter={(value) => `$${formatNumber(value)}`}
                        />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                          formatter={(value) => [`$${formatNumber(value as number)}`]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="deposits"
                          name="Deposits"
                          stroke={COLORS.blue}
                          fill={COLORS.blue}
                          fillOpacity={0.2}
                        />
                        <Area
                          type="monotone"
                          dataKey="withdrawals"
                          name="Withdrawals"
                          stroke={COLORS.danger}
                          fill={COLORS.danger}
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
                <CardDescription>
                  New and active users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={prepareTimeframeData("users")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        tickFormatter={(value) => `${formatNumber(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [formatNumber(value as number)]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="New Users" 
                        fill={COLORS.purple} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Total Users" 
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        dot={{ r: 4, fill: COLORS.primary }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Games Analytics Tab */}
        <TabsContent value="games">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Game Popularity</CardTitle>
                <CardDescription>
                  Percentage of bets by game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareGameAnalyticsData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="popularity"
                        nameKey="gameType"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {prepareGameAnalyticsData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Game</CardTitle>
                <CardDescription>
                  How much each game contributes to revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareGameAnalyticsData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="gameType" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        tickFormatter={(value) => `$${formatNumber(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [`$${formatNumber(value as number)}`]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue" 
                        fill={COLORS.primary} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Game Performance</CardTitle>
                <CardDescription>
                  Total bets, wins, and house edge by game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareGameAnalyticsData()} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="gameType" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        tickFormatter={(value) => `${formatNumber(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [formatNumber(value as number)]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="totalBets" 
                        name="Total Bets" 
                        fill={COLORS.blue} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="totalWins" 
                        name="Total Wins" 
                        fill={COLORS.success} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="totalLosses" 
                        name="Total Losses" 
                        fill={COLORS.danger} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* User Segments Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">User Segments</CardTitle>
                <CardDescription>
                  Distribution of users by segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareUserSegmentsData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="percentage"
                        nameKey="segment"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {prepareUserSegmentsData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Revenue by User Segment</CardTitle>
                <CardDescription>
                  How much each user segment contributes to revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareUserSegmentsData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="segment" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        tickFormatter={(value) => `$${formatNumber(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value) => [`$${formatNumber(value as number)}`]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="totalRevenue" 
                        name="Revenue" 
                        fill={COLORS.primary} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1A2634] border-gray-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">User Segment Details</CardTitle>
                <CardDescription>
                  Detailed metrics by user segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareUserSegmentsData()} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="segment" 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        yAxisId="left"
                        tickFormatter={(value) => `${formatNumber(value)}`}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{fill: '#94a3b8'}}
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => `$${formatNumber(value)}`}
                      />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0F1923', borderColor: '#334155'}}
                        formatter={(value, name) => {
                          if (name === "Average Bet") return [`$${formatNumber(value as number)}`];
                          return [formatNumber(value as number)];
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="count" 
                        name="User Count" 
                        fill={COLORS.purple} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="totalBets" 
                        name="Total Bets" 
                        fill={COLORS.blue} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="avgBet" 
                        name="Average Bet" 
                        fill={COLORS.warning} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}