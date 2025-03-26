// The Odds API integration
// La API key se obtiene desde una API del servidor para no exponerla en el cliente
const BASE_URL = 'https://api.the-odds-api.com/v4';

// Types for sports data
export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface EventOdds {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

/**
 * Obtiene la API key del servidor
 */
async function getApiKey(): Promise<string> {
  try {
    const response = await fetch('/api/sports/apikey');
    if (!response.ok) {
      throw new Error(`Error obteniendo API key: ${response.status}`);
    }
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error('Error al obtener API key:', error);
    throw error;
  }
}

/**
 * Fetches available sports from The Odds API
 */
export async function fetchSports(): Promise<Sport[]> {
  try {
    const apiKey = await getApiKey();
    const response = await fetch(`${BASE_URL}/sports/?apiKey=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
}

/**
 * Fetches upcoming events and odds for a specific sport
 */
export async function fetchOdds(
  sportKey: string,
  regions: string = 'us',
  markets: string = 'h2h',
  oddsFormat: string = 'decimal'
): Promise<EventOdds[]> {
  try {
    const apiKey = await getApiKey();
    const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error);
    throw error;
  }
}

/**
 * Fetches upcoming events across all sports
 */
export async function fetchUpcomingEvents(
  regions: string = 'us',
  markets: string = 'h2h',
  oddsFormat: string = 'decimal'
): Promise<EventOdds[]> {
  try {
    const apiKey = await getApiKey();
    const url = `${BASE_URL}/sports/upcoming/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
}

/**
 * Formats odds to decimal format with two decimal places
 * Converts American odds to decimal format:
 * - Positive odds (e.g. +200): (odds / 100) + 1
 * - Negative odds (e.g. -150): (100 / |odds|) + 1
 * 
 * @param odds American odds value
 * @param showInfo Whether to show additional information about the odds
 * @returns Formatted decimal odds string
 */
export function formatAmericanOdds(odds: number, showInfo: boolean = false): string {
  let decimalOdds: number;
  
  if (odds > 0) {
    // Convertir cuota positiva a decimal: (cuota/100) + 1
    decimalOdds = (odds / 100) + 1;
  } else {
    // Convertir cuota negativa a decimal: (100/|cuota|) + 1
    decimalOdds = (100 / Math.abs(odds)) + 1;
  }
  
  // Formatear a dos decimales
  const formattedOdds = decimalOdds.toFixed(2);
  
  if (showInfo) {
    const impliedProb = ((1 / decimalOdds) * 100).toFixed(1);
    return `${formattedOdds} (${impliedProb}%)`;
  }
  
  return formattedOdds;
}

/**
 * Converts American odds to implied probability
 * 
 * @param odds American odds value
 * @returns Implied probability as a percentage
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    // Positive odds formula: 100 / (odds + 100)
    return 100 / (odds + 100);
  } else {
    // Negative odds formula: |odds| / (|odds| + 100)
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

/**
 * Converts ISO date to a more readable format
 */
export function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Extracts the best odds for an event from multiple bookmakers
 */
export function getBestOdds(event: EventOdds, marketKey: string = 'h2h'): { [team: string]: number } {
  const bestOdds: { [team: string]: number } = {};
  
  // Initialize with home and away team
  bestOdds[event.home_team] = 0;
  bestOdds[event.away_team] = 0;
  
  // Check all bookmakers for the best odds
  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey);
    
    if (market) {
      for (const outcome of market.outcomes) {
        // If better odds found, update
        if (!bestOdds[outcome.name] || outcome.price > bestOdds[outcome.name]) {
          bestOdds[outcome.name] = outcome.price;
        }
      }
    }
  }
  
  return bestOdds;
}

/**
 * Gets a color for each sport type for UI styling
 */
export function getSportColor(sportGroup: string): string {
  const colors: {[key: string]: string} = {
    'Soccer': '#1e88e5',
    'Basketball': '#d32f2f',
    'Tennis': '#ff9800',
    'American Football': '#8bc34a',
    'Baseball': '#ff5722',
    'Ice Hockey': '#03a9f4',
    'Mixed Martial Arts': '#9c27b0',
    'Rugby League': '#795548',
    'Aussie Rules': '#ffc107',
    'Cricket': '#2196f3',
    'Golf': '#4caf50',
  };
  
  return colors[sportGroup] || '#607d8b'; // Default color
}

/**
 * Genera eventos deportivos de ejemplo para demostración
 * Esta función se utiliza cuando la API externa no está disponible
 */
export function generateDemoEvents(): EventOdds[] {
  const now = new Date();
  const oneHourBefore = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAfter = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursAfter = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeDaysAfter = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  // Eventos deportivos de ejemplo
  return [
    // Eventos en vivo (fútbol)
    {
      id: "1001",
      sport_key: "soccer_laliga",
      sport_title: "La Liga",
      commence_time: oneHourBefore.toISOString(),
      home_team: "Real Madrid",
      away_team: "Barcelona",
      bookmakers: [{
        key: "betway",
        title: "Betway",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Real Madrid", price: 200 },
              { name: "Barcelona", price: 180 },
              { name: "Draw", price: 230 }
            ]
          },
          {
            key: "spreads",
            outcomes: [
              { name: "Real Madrid", price: -110, point: -1.5 },
              { name: "Barcelona", price: -110, point: 1.5 }
            ]
          }
        ]
      }]
    },
    {
      id: "1002",
      sport_key: "soccer_epl",
      sport_title: "Premier League",
      commence_time: twoHoursBefore.toISOString(),
      home_team: "Manchester City",
      away_team: "Liverpool",
      bookmakers: [{
        key: "betway",
        title: "Betway",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Manchester City", price: 150 },
              { name: "Liverpool", price: 250 },
              { name: "Draw", price: 280 }
            ]
          }
        ]
      }]
    },
    // Eventos en vivo (baloncesto)
    {
      id: "1003",
      sport_key: "basketball_nba",
      sport_title: "NBA",
      commence_time: twoHoursBefore.toISOString(),
      home_team: "LA Lakers",
      away_team: "Chicago Bulls",
      bookmakers: [{
        key: "betmgm",
        title: "BetMGM",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "LA Lakers", price: -200 },
              { name: "Chicago Bulls", price: 180 }
            ]
          }
        ]
      }]
    },
    // Próximos eventos
    {
      id: "1004",
      sport_key: "soccer_fifa_world_cup",
      sport_title: "FIFA World Cup",
      commence_time: oneHourAfter.toISOString(),
      home_team: "Argentina",
      away_team: "Brasil",
      bookmakers: [{
        key: "betway",
        title: "Betway",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Argentina", price: 160 },
              { name: "Brasil", price: 180 },
              { name: "Draw", price: 210 }
            ]
          }
        ]
      }]
    },
    {
      id: "1005",
      sport_key: "basketball_euroleague",
      sport_title: "Euroleague",
      commence_time: twoHoursAfter.toISOString(),
      home_team: "Real Madrid",
      away_team: "CSKA Moscow",
      bookmakers: [{
        key: "betmgm",
        title: "BetMGM",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Real Madrid", price: -150 },
              { name: "CSKA Moscow", price: 130 }
            ]
          }
        ]
      }]
    },
    {
      id: "1006",
      sport_key: "soccer_uefa_champs_league",
      sport_title: "UEFA Champions League",
      commence_time: threeDaysAfter.toISOString(),
      home_team: "Bayern Munich",
      away_team: "Paris Saint-Germain",
      bookmakers: [{
        key: "betway",
        title: "Betway",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Bayern Munich", price: 130 },
              { name: "Paris Saint-Germain", price: 210 },
              { name: "Draw", price: 250 }
            ]
          }
        ]
      }]
    },
    // Más eventos en vivo
    {
      id: "1007",
      sport_key: "tennis_atp",
      sport_title: "ATP Tennis",
      commence_time: oneHourBefore.toISOString(),
      home_team: "Rafael Nadal",
      away_team: "Novak Djokovic",
      bookmakers: [{
        key: "betway",
        title: "Betway",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Rafael Nadal", price: -120 },
              { name: "Novak Djokovic", price: 100 }
            ]
          }
        ]
      }]
    },
    {
      id: "1008",
      sport_key: "baseball_mlb",
      sport_title: "MLB",
      commence_time: twoHoursBefore.toISOString(),
      home_team: "New York Yankees",
      away_team: "Boston Red Sox",
      bookmakers: [{
        key: "betmgm",
        title: "BetMGM",
        last_update: now.toISOString(),
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "New York Yankees", price: -130 },
              { name: "Boston Red Sox", price: 110 }
            ]
          }
        ]
      }]
    }
  ];
}